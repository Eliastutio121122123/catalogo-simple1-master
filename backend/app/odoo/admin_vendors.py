from __future__ import annotations

from .client import odoo


class AdminVendorService:
    FIELDS = [
        "id",
        "store_name",
        "status",
        "partner_id",
        "user_id",
        "email",
        "phone",
        "write_date",
    ]

    def __init__(self, client):
        self._client = client

    def list_vendors(
        self,
        q: str | None = None,
        status: str | None = None,
        limit: int = 200,
        offset: int = 0,
    ) -> dict:
        domain = self._build_domain(q, status)
        rows = self._client.search_read("catalog.vendor", domain, self.FIELDS, limit=limit, offset=offset, order="id desc")
        items = [self._to_api(row) for row in rows]
        stats = self._stats(items)
        filters = self._filters(items)
        return {"items": items, "stats": stats, "filters": filters}

    def _build_domain(self, q: str | None, status: str | None) -> list:
        domain: list = []
        if q:
            term = q.strip()
            if term:
                domain = ["|", ["store_name", "ilike", term], ["email", "ilike", term]]
        if status and status != "all":
            mapped = self._from_ui_status(status)
            if mapped:
                domain.append(["status", "=", mapped])
        return domain

    def _from_ui_status(self, status: str) -> str | None:
        if status == "approved":
            return "active"
        if status == "review":
            return "pending"
        if status == "paused":
            return "suspended"
        return None

    def _to_ui_status(self, status: str | None) -> str:
        if status == "active":
            return "approved"
        if status == "pending":
            return "review"
        if status == "suspended":
            return "paused"
        return "review"

    def _catalog_count(self, partner_id: int | None) -> int:
        if not partner_id:
            return 0
        return int(self._client.search_count("catalog.catalog", [["vendor_id", "=", partner_id]]))

    def _to_api(self, rec: dict) -> dict:
        partner = rec.get("partner_id") or []
        partner_id = int(partner[0]) if isinstance(partner, list) and partner else None
        user = rec.get("user_id") or []
        owner = user[1] if isinstance(user, list) and len(user) > 1 else (partner[1] if len(partner) > 1 else "-")
        vid = int(rec.get("id") or 0)
        return {
            "id": f"VND-{vid}",
            "rawId": vid,
            "name": rec.get("store_name") or "-",
            "owner": owner,
            "email": rec.get("email") or "-",
            "catalogs": self._catalog_count(partner_id),
            "status": self._to_ui_status(rec.get("status")),
            "score": 0,
            "updatedAt": rec.get("write_date"),
        }

    def _stats(self, items: list[dict]) -> dict:
        total = len(items)
        approved = len([v for v in items if v.get("status") == "approved"])
        review = len([v for v in items if v.get("status") == "review"])
        return {"total": total, "approved": approved, "review": review}

    def _filters(self, items: list[dict]) -> dict:
        statuses = sorted({v.get("status") for v in items if v.get("status")})
        return {"statuses": statuses}


admin_vendor_service = AdminVendorService(odoo)
