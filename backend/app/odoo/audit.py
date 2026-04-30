from __future__ import annotations

from datetime import datetime, timedelta
from typing import Iterable

from .client import odoo
from .users import UserService


class AuditLogService:
    MODEL = "catalog.audit.log"
    FIELDS = [
        "id",
        "code",
        "occurred_at",
        "actor_name",
        "actor_role",
        "ip_address",
        "action",
        "target",
        "severity",
        "status",
    ]

    def __init__(self, client, user_service: type[UserService] = UserService):
        self._client = client
        self._users = user_service

    def list_logs(
        self,
        q: str | None = None,
        action: str | None = None,
        actor: str | None = None,
        severity: str | None = None,
        range_key: str | None = None,
        limit: int = 200,
        offset: int = 0,
    ) -> dict:
        domain = self._build_domain(q, action, actor, severity, range_key)
        rows = self._client.search_read(
            self.MODEL,
            domain,
            self.FIELDS,
            limit=limit,
            offset=offset,
            order="occurred_at desc, id desc",
        )
        items = [self._to_api(row) for row in rows]
        stats = self._stats(items)
        filters = self._filters(items)
        return {"items": items, "stats": stats, "filters": filters}

    def create_log(self, payload: dict, actor_uid: int | None = None) -> dict:
        values = self._to_odoo(payload, actor_uid)
        log_id = self._client.create(self.MODEL, values)
        rows = self._client.read(self.MODEL, [log_id], self.FIELDS)
        return self._to_api(rows[0]) if rows else self._to_api({"id": log_id, **values})

    def _build_domain(
        self,
        q: str | None,
        action: str | None,
        actor: str | None,
        severity: str | None,
        range_key: str | None,
    ) -> list:
        domain: list = []
        if q:
            term = q.strip()
            if term:
                domain += self._or_domain(
                    ["actor_name", "action", "target", "ip_address", "code"],
                    term,
                )
        if action and action.lower() not in {"all actions", "all"}:
            domain.append(["action", "=", action])
        if actor and actor.lower() not in {"all actors", "all"}:
            domain.append(["actor_name", "=", actor])
        if severity and severity.lower() not in {"all"}:
            domain.append(["severity", "=", severity])
        since = self._range_since(range_key)
        if since:
            domain.append(["occurred_at", ">=", since])
        return domain

    def _range_since(self, range_key: str | None) -> str | None:
        key = (range_key or "24h").strip().lower()
        now = datetime.utcnow()
        if key == "7d":
            return (now - timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")
        if key == "30d":
            return (now - timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S")
        if key == "24h":
            return (now - timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")
        return None

    def _or_domain(self, fields: Iterable[str], term: str) -> list:
        fields_list = list(fields)
        if not fields_list:
            return []
        domain: list = []
        for idx, field in enumerate(fields_list):
            if idx:
                domain = ["|"] + domain
            domain.append([field, "ilike", term])
        return domain

    def _to_api(self, rec: dict) -> dict:
        code = rec.get("code") or f"AL-{rec.get('id')}"
        return {
            "id": code,
            "rawId": rec.get("id"),
            "at": rec.get("occurred_at"),
            "actor": rec.get("actor_name") or "System",
            "role": rec.get("actor_role") or "System",
            "ip": rec.get("ip_address") or "-",
            "action": rec.get("action") or "Event",
            "target": rec.get("target") or "-",
            "severity": rec.get("severity") or "low",
            "status": rec.get("status") or "ok",
        }

    def _to_odoo(self, payload: dict, actor_uid: int | None = None) -> dict:
        actor_name = payload.get("actor") or "System"
        actor_role = payload.get("role") or "System"
        if actor_uid and (payload.get("actor") in (None, "")):
            try:
                rows = self._client.read("res.users", [int(actor_uid)], ["name"])
                if rows and rows[0].get("name"):
                    actor_name = rows[0]["name"]
            except Exception:
                pass
        return {
            "actor_name": actor_name,
            "actor_role": actor_role,
            "ip_address": payload.get("ip") or payload.get("ip_address") or "",
            "action": payload.get("action") or "Event",
            "target": payload.get("target") or "",
            "severity": payload.get("severity") or "low",
            "status": payload.get("status") or "ok",
            "occurred_at": payload.get("at") or payload.get("occurred_at") or False,
        }

    def _stats(self, items: list[dict]) -> dict:
        total = len(items)
        critical = len([r for r in items if r.get("severity") == "critical"])
        failed = len([r for r in items if r.get("status") != "ok"])
        return {"total": total, "critical": critical, "failed": failed}

    def _filters(self, items: list[dict]) -> dict:
        actions = sorted({r.get("action") for r in items if r.get("action")})
        actors = sorted({r.get("actor") for r in items if r.get("actor")})
        return {"actions": actions, "actors": actors}


audit_log_service = AuditLogService(odoo)
