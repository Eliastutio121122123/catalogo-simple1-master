"""
Odoo JSON-RPC client — compatible con Odoo 19.
Reemplaza XML-RPC que fue deprecado en Odoo 19.
"""
import time
import requests
from flask import current_app


class OdooClient:
    def __init__(self):
        # Keep a shared session available, but avoid relying on it for per-call auth.
        self._session = requests.Session()
        self._uid = None
        self._last_auth_ts = 0.0
        self._session_ttl = 20 * 60  # 20 minutes

    def _cfg(self):
        return {
            "url":      current_app.config["ODOO_URL"],
            "db":       current_app.config["ODOO_DB"],
            "user":     current_app.config["ODOO_USER"],
            "password": current_app.config["ODOO_PASSWORD"],
        }

    # ── JSON-RPC base ─────────────────────────────────────────────────────────
    def _rpc(self, endpoint: str, params: dict, session: requests.Session | None = None) -> any:
        cfg = self._cfg()
        payload = {
            "jsonrpc": "2.0",
            "method":  "call",
            "id":      1,
            "params":  params,
        }
        sess = session or self._session
        try:
            resp = sess.post(
                f"{cfg['url']}{endpoint}",
                json=payload,
                timeout=15,
                headers={"Content-Type": "application/json"},
            )
            data = resp.json()
        except requests.exceptions.ConnectionError:
            raise ConnectionError(f"Cannot connect to Odoo at {cfg['url']}")
        except requests.exceptions.Timeout:
            raise TimeoutError("Odoo request timed out")

        if "error" in data:
            msg = (data["error"]
                   .get("data", {})
                   .get("message") or data["error"].get("message", "Odoo error"))
            raise RuntimeError(msg)

        return data.get("result")

    # ── Autenticación ─────────────────────────────────────────────────────────
    def authenticate(
        self,
        username: str | None = None,
        password: str | None = None,
        persist: bool = True,
        session: requests.Session | None = None,
    ) -> int:
        cfg = self._cfg()
        sess = session or (self._session if persist else requests.Session())
        try:
            result = self._rpc(
                "/web/session/authenticate",
                {
                    "db":       cfg["db"],
                    "login":    username or cfg["user"],
                    "password": password or cfg["password"],
                },
                session=sess,
            )
        except RuntimeError as exc:
            # Map Odoo auth failures to a permission error for cleaner API responses.
            msg = str(exc)
            if "Access Denied" in msg or "Access denied" in msg:
                raise PermissionError("Odoo authentication failed") from exc
            raise
        uid = result.get("uid") if result else None
        if not uid:
            raise PermissionError("Odoo authentication failed")
        return uid

    def _ensure_session(self) -> tuple[requests.Session, int]:
        now = time.time()
        if self._uid and (now - self._last_auth_ts) < self._session_ttl:
            return self._session, self._uid

        # Recreate session to avoid stale cookies.
        self._session = requests.Session()
        self._uid = self.authenticate(session=self._session, persist=False)
        self._last_auth_ts = now
        return self._session, self._uid

    # ── call_kw ───────────────────────────────────────────────────────────────
    def call(self, model: str, method: str, args: list, kwargs: dict = None) -> any:
        cfg = self._cfg()

        def _call_with_session(session: requests.Session, uid: int) -> any:
            return self._rpc(
                "/web/dataset/call_kw",
                {
                    "model":  model,
                    "method": method,
                    "args":   args,
                    "kwargs": kwargs or {},
                    # Odoo 19 call_kw no necesita uid/pwd en params,
                    # usa la sesi??n ??? pero por XML-RPC legacy lo pasamos igual
                    "db":       cfg["db"],
                    "uid":      uid,
                    "password": cfg["password"],
                },
                session=session,
            )

        session, uid = self._ensure_session()
        try:
            return _call_with_session(session, uid)
        except RuntimeError as exc:
            msg = str(exc)
            # Retry once with a fresh session if Odoo reports an expired session.
            if "Session expired" in msg or "Access denied" in msg:
                self._uid = None
                session, uid = self._ensure_session()
                return _call_with_session(session, uid)
            raise

    def search_read(
        self,
        model: str,
        domain: list,
        fields: list,
        limit: int = 100,
        offset: int = 0,
        order: str = None,
    ) -> list:
        kwargs = {"fields": fields, "limit": limit, "offset": offset}
        if order:
            kwargs["order"] = order
        return self.call(model, "search_read", [domain], kwargs) or []

    def read(self, model: str, ids: list, fields: list) -> list:
        return self.call(model, "read", [ids], {"fields": fields}) or []

    def search(self, model: str, domain: list) -> list:
        return self.call(model, "search", [domain]) or []

    def create(self, model: str, values: dict) -> int:
        return self.call(model, "create", [values])

    def write(self, model: str, ids: list, values: dict) -> bool:
        return self.call(model, "write", [ids, values])

    def unlink(self, model: str, ids: list) -> bool:
        return self.call(model, "unlink", [ids])

    def search_count(self, model: str, domain: list) -> int:
        return self.call(model, "search_count", [domain]) or 0


odoo = OdooClient()
