from __future__ import annotations

from typing import Iterable

from .client import odoo


class AdminUserService:
    BASE_FIELDS = ["id", "name", "login", "email", "active", "login_date", "write_date"]

    def __init__(self, client):
        self._client = client
        # Lazy init to avoid accessing Odoo config before Flask app context exists.
        self._groups_field: str | None = None
        self._group_ids: dict | None = None

    def list_users(
        self,
        q: str | None = None,
        role: str | None = None,
        status: str | None = None,
        limit: int = 200,
        offset: int = 0,
    ) -> dict:
        self._ensure_initialized()
        domain = self._build_domain(q, role, status)
        fields = self.BASE_FIELDS + [self._groups_field]
        rows = self._client.search_read("res.users", domain, fields, limit=limit, offset=offset, order="id desc")
        items = [self._to_api(row) for row in rows]
        stats = self._stats(items)
        filters = self._filters(items)
        return {"items": items, "stats": stats, "filters": filters}

    def _ensure_initialized(self) -> None:
        if not self._groups_field:
            self._groups_field = self._resolve_groups_field()
        if self._group_ids is None:
            self._group_ids = self._resolve_group_ids()

    def _resolve_groups_field(self) -> str:
        try:
            fields = self._client.call("res.users", "fields_get", [], {"attributes": ["type"]}) or {}
        except Exception:
            fields = {}
        if "group_ids" in fields:
            return "group_ids"
        if "groups_id" in fields:
            return "groups_id"
        return "group_ids"

    def _resolve_group_ids(self) -> dict:
        return {
            "system": self._xmlid_to_group_id("base.group_system"),
            "internal": self._xmlid_to_group_id("base.group_user"),
            "portal": self._xmlid_to_group_id("base.group_portal"),
            "vendor": self._xmlid_to_group_id("odoo_module.group_vendor"),
        }

    def _xmlid_to_group_id(self, xmlid: str) -> int | None:
        if "." not in xmlid:
            return None
        module, name = xmlid.split(".", 1)
        rows = self._client.search_read(
            "ir.model.data",
            [["module", "=", module], ["name", "=", name], ["model", "=", "res.groups"]],
            ["res_id"],
            limit=1,
        )
        if not rows:
            return None
        return int(rows[0]["res_id"])

    def _build_domain(self, q: str | None, role: str | None, status: str | None) -> list:
        domain: list = []
        if q:
            term = q.strip()
            if term:
                domain += self._or_domain(["name", "email", "login"], term)
        if status and status != "all":
            if status == "active":
                domain.append(["active", "=", True])
            else:
                domain.append(["active", "=", False])
        if role and role != "all":
            domain.append(["id", "in", self._ids_with_role(role)])
        return domain

    def _ids_with_role(self, role: str) -> list[int]:
        rows = self._client.search_read("res.users", [], [self._groups_field], limit=2000)
        ids = []
        for row in rows:
            groups = row.get(self._groups_field) or []
            computed = self._role_from_groups(groups)
            if computed == role:
                ids.append(int(row.get("id")))
        return ids

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

    def _role_from_groups(self, groups: list) -> str:
        ids = set(int(gid) for gid in (groups or []) if gid)
        group_ids = self._group_ids or {}
        if group_ids.get("system") and group_ids["system"] in ids:
            return "Super Admin"
        if group_ids.get("internal") and group_ids["internal"] in ids:
            return "Admin"
        if group_ids.get("vendor") and group_ids["vendor"] in ids:
            return "Vendor"
        if group_ids.get("portal") and group_ids["portal"] in ids:
            return "Customer"
        return "User"

    def _to_api(self, rec: dict) -> dict:
        groups = rec.get(self._groups_field) or []
        status = "active" if rec.get("active") else "suspended"
        last_seen = rec.get("login_date") or rec.get("write_date")
        role = self._role_from_groups(groups)
        uid = int(rec.get("id") or 0)
        return {
            "id": f"USR-{uid}",
            "rawId": uid,
            "name": rec.get("name") or "-",
            "email": rec.get("email") or rec.get("login") or "-",
            "role": role,
            "status": status,
            "lastSeen": last_seen,
        }

    def _stats(self, items: list[dict]) -> dict:
        total = len(items)
        active = len([u for u in items if u.get("status") == "active"])
        suspended = len([u for u in items if u.get("status") != "active"])
        return {"total": total, "active": active, "suspended": suspended}

    def _filters(self, items: list[dict]) -> dict:
        roles = sorted({u.get("role") for u in items if u.get("role")})
        statuses = sorted({u.get("status") for u in items if u.get("status")})
        return {"roles": roles, "statuses": statuses}


admin_user_service = AdminUserService(odoo)
