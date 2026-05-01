from __future__ import annotations

from .client import odoo


class AdminCatalogService:
    BASE_FIELDS = [
        "id",
        "name",
        "vendor_id",
        "product_count",
        "active",
        "write_date",
        "create_date",
    ]

    def __init__(self, client):
        self._client = client

    def _fields(self) -> list[str]:
        fields = list(self.BASE_FIELDS)
        if "category" not in fields:
            fields.append("category")
        return fields

    @staticmethod
    def _is_invalid_field_error(exc: Exception, field: str) -> bool:
        msg = str(exc or "")
        if "invalid field" not in msg.lower():
            return False
        return (f"'{field}'" in msg) or (f"\"{field}\"" in msg) or (field in msg)

    @staticmethod
    def _is_missing_column_error(exc: Exception, field: str) -> bool:
        msg = str(exc or "").lower()
        return ("column" in msg and "does not exist" in msg and field.lower() in msg)

    # ── Public API ──────────────────────────────────────────────

    def get_catalog(self, catalog_id: int) -> dict:
        """Return full details for a single catalog record."""
        fields = self._fields() + ["description"]
        try:
            rows = self._client.call(
                "catalog.catalog",
                "search_read",
                [[["id", "=", catalog_id]]],
                {
                    "fields": fields,
                    "limit": 1,
                    "context": {"active_test": False},
                },
            ) or []
        except Exception as exc:
            if "category" in fields and (
                self._is_invalid_field_error(exc, "category") or self._is_missing_column_error(exc, "category")
            ):
                safe_fields = [f for f in fields if f != "category"]
                rows = self._client.call(
                    "catalog.catalog",
                    "search_read",
                    [[["id", "=", catalog_id]]],
                    {
                        "fields": safe_fields,
                        "limit": 1,
                        "context": {"active_test": False},
                    },
                ) or []
            else:
                raise
        if not rows:
            return {}
        return self._to_api(rows[0])

    def update_catalog(self, catalog_id: int, data: dict) -> dict:
        """Update editable fields on a catalog.catalog record in Odoo."""
        write_vals: dict = {}
        if "name" in data and data["name"]:
            write_vals["name"] = str(data["name"]).strip()
        if "category" in data and "category" in self._fields():
            category = str(data.get("category") or "").strip()
            write_vals["category"] = category or False
        if "active" in data:
            write_vals["active"] = bool(data["active"])
        if "description" in data:
            write_vals["description"] = str(data["description"]).strip()
        if write_vals:
            self._client.call(
                "catalog.catalog",
                "write",
                [[catalog_id], write_vals],
                {"context": {"active_test": False}},
            )
        return self.get_catalog(catalog_id)

    def list_catalogs(
        self,
        q: str | None = None,
        status: str | None = None,
        visibility: str | None = None,
        limit: int = 200,
        offset: int = 0,
    ) -> dict:
        domain = self._build_domain(q, status, visibility)
        fields = self._fields()
        try:
            rows = self._client.search_read("catalog.catalog", domain, fields, limit=limit, offset=offset, order="id desc")
        except Exception as exc:
            if "category" in fields and (
                self._is_invalid_field_error(exc, "category") or self._is_missing_column_error(exc, "category")
            ):
                safe_fields = [f for f in fields if f != "category"]
                rows = self._client.search_read("catalog.catalog", domain, safe_fields, limit=limit, offset=offset, order="id desc")
            else:
                raise
        items = [self._to_api(row) for row in rows]
        stats = self._stats(items)
        filters = self._filters(items)
        return {"items": items, "stats": stats, "filters": filters}

    # ── Internal helpers ────────────────────────────────────────

    def _build_domain(self, q: str | None, status: str | None, visibility: str | None) -> list:
        domain: list = []
        if q:
            term = q.strip()
            if term:
                domain = ["|", ["name", "ilike", term], ["vendor_id.name", "ilike", term]]
        if status and status != "all":
            if status in {"published"}:
                domain.append(["active", "=", True])
            else:
                domain.append(["active", "=", False])
        if visibility and visibility != "all":
            if visibility == "public":
                domain.append(["active", "=", True])
            elif visibility == "private":
                domain.append(["active", "=", False])
        return domain

    def _to_status(self, active: bool) -> str:
        return "published" if active else "draft"

    def _to_visibility(self, active: bool) -> str:
        return "public" if active else "private"

    def _to_api(self, rec: dict) -> dict:
        vendor = rec.get("vendor_id") or []
        cid = int(rec.get("id") or 0)
        active = bool(rec.get("active"))
        return {
            "id": f"CAT-{cid}",
            "rawId": cid,
            "name": rec.get("name") or "-",
            "category": rec.get("category") or "",
            "vendor": vendor[1] if isinstance(vendor, list) and len(vendor) > 1 else "-",
            "vendorId": int(vendor[0]) if isinstance(vendor, list) and vendor else 0,
            "items": int(rec.get("product_count") or 0),
            "status": self._to_status(active),
            "visibility": self._to_visibility(active),
            "active": active,
            "description": rec.get("description") or "",
            "updatedAt": rec.get("write_date") or rec.get("create_date"),
            "createdAt": rec.get("create_date"),
            "rating": 0,
        }

    def _stats(self, items: list[dict]) -> dict:
        total = len(items)
        published = len([c for c in items if c.get("status") == "published"])
        review = len([c for c in items if c.get("status") != "published"])
        return {"total": total, "published": published, "review": review}

    def _filters(self, items: list[dict]) -> dict:
        statuses = sorted({c.get("status") for c in items if c.get("status")})
        visibilities = sorted({c.get("visibility") for c in items if c.get("visibility")})
        return {"statuses": statuses, "visibilities": visibilities}


admin_catalog_service = AdminCatalogService(odoo)
