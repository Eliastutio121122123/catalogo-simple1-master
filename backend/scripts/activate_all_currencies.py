"""
Activate all currencies in Odoo (res.currency.active = True).

This is useful for development environments where only one currency is active
and the Catalogix vendor product form validates that the selected currency
exists in Odoo.
"""

from __future__ import annotations

import argparse
import os
import sys
from typing import Any

import requests


def _env(name: str, default: str) -> str:
    return str(os.getenv(name, default) or default)


class OdooRPC:
    def __init__(self, *, url: str, db: str, user: str, password: str):
        self.url = url.rstrip("/")
        self.db = db
        self.user = user
        self.password = password
        self._req_id = 0
        self.session = requests.Session()

    def rpc(self, endpoint: str, params: dict) -> Any:
        self._req_id += 1
        resp = self.session.post(
            f"{self.url}{endpoint}",
            json={"jsonrpc": "2.0", "method": "call", "id": self._req_id, "params": params},
            headers={"Content-Type": "application/json"},
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        if "error" in data:
            msg = (
                data["error"].get("data", {}).get("message")
                or data["error"].get("message", "Unknown Odoo error")
            )
            raise RuntimeError(f"Odoo: {msg}")
        return data.get("result")

    def authenticate(self) -> int:
        result = self.rpc(
            "/web/session/authenticate",
            {"db": self.db, "login": self.user, "password": self.password},
        )
        uid = result.get("uid") if isinstance(result, dict) else None
        if not uid:
            raise PermissionError("Odoo authentication failed (uid missing)")
        return int(uid)

    def call_kw(self, model: str, method: str, args: list, kwargs: dict | None = None) -> Any:
        return self.rpc(
            "/web/dataset/call_kw",
            {"model": model, "method": method, "args": args, "kwargs": kwargs or {}},
        )

    def search_read(
        self,
        model: str,
        domain: list,
        fields: list[str],
        *,
        limit: int = 2000,
        offset: int = 0,
        order: str | None = None,
        context: dict | None = None,
    ) -> list[dict]:
        kwargs: dict[str, Any] = {"fields": fields, "limit": limit, "offset": offset}
        if order:
            kwargs["order"] = order
        if context:
            kwargs["context"] = context
        return self.call_kw(model, "search_read", [domain], kwargs) or []

    def write(self, model: str, ids: list[int], values: dict) -> bool:
        return bool(self.call_kw(model, "write", [ids, values], {}))


def main(argv: list[str]) -> int:
    p = argparse.ArgumentParser(description="Activate all currencies in Odoo (res.currency).")
    p.add_argument("--odoo-url", default=_env("ODOO_URL", "http://localhost:8069"))
    p.add_argument("--db", default=_env("ODOO_DB", "catalogix"))
    p.add_argument("--user", default=_env("ODOO_USER", "admin"))
    p.add_argument("--password", default=_env("ODOO_PASSWORD", "admin"))
    p.add_argument("--dry-run", action="store_true", help="Only show what would change.")
    args = p.parse_args(argv)

    rpc = OdooRPC(url=args.odoo_url, db=args.db, user=args.user, password=args.password)

    print("1) Authenticating...")
    uid = rpc.authenticate()
    print(f"   OK (uid={uid})")

    print("2) Loading currencies (including inactive)...")
    rows = rpc.search_read(
        "res.currency",
        [],
        ["id", "name", "active"],
        limit=5000,
        order="name asc",
        context={"active_test": False},
    )
    if not rows:
        print("   No currencies found.")
        return 0

    inactive_ids = [int(r["id"]) for r in rows if r and r.get("id") and not bool(r.get("active", False))]
    active_count = len(rows) - len(inactive_ids)
    print(f"   Found {len(rows)} currencies: active={active_count}, inactive={len(inactive_ids)}")

    if not inactive_ids:
        print("3) Nothing to do. All currencies are already active.")
        return 0

    if args.dry_run:
        sample = ", ".join(str(i) for i in inactive_ids[:25])
        more = "" if len(inactive_ids) <= 25 else f" (+{len(inactive_ids) - 25} more)"
        print(f"3) DRY RUN: would activate {len(inactive_ids)} currencies. Example IDs: {sample}{more}")
        return 0

    print("3) Activating currencies...")
    batch_size = 200
    updated = 0
    for i in range(0, len(inactive_ids), batch_size):
        batch = inactive_ids[i : i + batch_size]
        rpc.write("res.currency", batch, {"active": True})
        updated += len(batch)
        print(f"   Activated {updated}/{len(inactive_ids)}...")

    print("4) Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

