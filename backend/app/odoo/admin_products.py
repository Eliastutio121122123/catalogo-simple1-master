from __future__ import annotations

from .client import odoo


LOW_STOCK_THRESHOLD = 5


class AdminProductService:
    FIELDS = [
        "id",
        "name",
        "default_code",
        "list_price",
        "standard_price",
        "qty_available",
        "catalog_stock_qty",
        "catalog_id",
        "categ_id",
        "active",
        "create_date",
        "write_date",
        "image_1920",
    ]

    def __init__(self, client):
        self._client = client

    # ── Public API ──────────────────────────────────────────────

    def get_product(self, product_id: int) -> dict:
        """Return full details for a single product template."""
        rows = self._client.call(
            "product.template",
            "search_read",
            [[["id", "=", product_id]]],
            {
                "fields": self.FIELDS + ["description", "description_sale"],
                "limit": 1,
                "context": {"active_test": False, "bin_size": True},
            },
        ) or []
        if not rows:
            return {}
        catalog_map = self._catalog_vendor_map(rows)
        return self._to_api(rows[0], catalog_map)

    def update_product(self, product_id: int, data: dict) -> dict:
        """Update editable fields on a product.template record in Odoo."""
        write_vals: dict = {}
        if "name" in data and data["name"]:
            write_vals["name"] = str(data["name"]).strip()
        if "sku" in data:
            write_vals["default_code"] = str(data["sku"]).strip()
        if "price" in data:
            write_vals["list_price"] = float(data["price"])
        if "cost" in data:
            write_vals["standard_price"] = float(data["cost"])
        if "active" in data:
            write_vals["active"] = bool(data["active"])
        if write_vals:
            self._client.call(
                "product.template",
                "write",
                [[product_id], write_vals],
                {"context": {"active_test": False}},
            )
        # Return updated product
        return self.get_product(product_id)

    def list_products(
        self,
        q: str | None = None,
        status: str | None = None,
        limit: int = 200,
        offset: int = 0,
    ) -> dict:
        domain = self._build_domain(q)
        rows = self._client.call(
            "product.template",
            "search_read",
            [domain],
            {
                "fields": self.FIELDS,
                "limit": limit,
                "offset": offset,
                "order": "id desc",
                "context": {"active_test": False, "bin_size": True},
            },
        ) or []

        if not rows:
            return {
                "items": [],
                "stats": {"total": 0, "active": 0, "low": 0, "out": 0},
            }

        # Resolve catalog → vendor mapping
        catalog_map = self._catalog_vendor_map(rows)

        items = [self._to_api(row, catalog_map) for row in rows]

        # Post-filter by status (after mapping)
        if status and status != "all":
            items = [item for item in items if item.get("status") == status]

        stats = self._stats(items)
        return {"items": items, "stats": stats}

    # ── Internal helpers ────────────────────────────────────────

    def _build_domain(self, q: str | None) -> list:
        domain: list = []
        if q:
            term = q.strip()
            if term:
                domain = [
                    "|",
                    "|",
                    ["name", "ilike", term],
                    ["default_code", "ilike", term],
                    ["categ_id.name", "ilike", term],
                ]
        return domain

    def _catalog_vendor_map(self, rows: list[dict]) -> dict[int, dict]:
        """Build a map of catalog_id -> {catalog_name, vendor_name}."""
        catalog_ids: set[int] = set()
        for row in rows:
            cat = row.get("catalog_id") or []
            if isinstance(cat, list) and cat:
                catalog_ids.add(int(cat[0]))


        if not catalog_ids:
            return {}

        try:
            catalogs = self._client.search_read(
                "catalog.catalog",
                [["id", "in", list(catalog_ids)]],
                ["id", "name", "vendor_id"],
                limit=len(catalog_ids),
            ) or []
        except Exception:
            return {}

        result: dict[int, dict] = {}
        for cat in catalogs:
            cid = int(cat.get("id") or 0)
            vendor = cat.get("vendor_id") or []
            vendor_name = vendor[1] if isinstance(vendor, list) and len(vendor) > 1 else ""
            result[cid] = {
                "catalog_name": cat.get("name") or "",
                "vendor_name": vendor_name,
            }
        return result

    def _stock_qty(self, rec: dict) -> float:
        """Return the best available stock quantity."""
        catalog_stock = rec.get("catalog_stock_qty")
        if catalog_stock is not None and catalog_stock is not False:
            return float(catalog_stock)
        return float(rec.get("qty_available") or 0)

    def _status(self, rec: dict) -> str:
        if not rec.get("active", True):
            return "inactive"
        stock = self._stock_qty(rec)
        if stock <= 0:
            return "out"
        if stock <= LOW_STOCK_THRESHOLD:
            return "low"
        return "active"

    def _to_api(self, rec: dict, catalog_map: dict[int, dict]) -> dict:
        product_id = int(rec.get("id") or 0)
        catalog = rec.get("catalog_id") or []
        catalog_id = int(catalog[0]) if isinstance(catalog, list) and catalog else 0
        catalog_info = catalog_map.get(catalog_id, {})
        catalog_name = catalog_info.get("catalog_name") or (
            catalog[1] if isinstance(catalog, list) and len(catalog) > 1 else ""
        )
        vendor_name = catalog_info.get("vendor_name", "")

        categ = rec.get("categ_id") or []
        category = categ[1] if isinstance(categ, list) and len(categ) > 1 else ""

        stock = self._stock_qty(rec)
        status = self._status(rec)
        sku = rec.get("default_code") or ""

        # Image: in bin_size mode, image_1920 is just the size string — skip it
        has_image = bool(rec.get("image_1920"))

        return {
            "id": f"PRD-{product_id}",
            "rawId": product_id,
            "name": rec.get("name") or "",
            "sku": sku,
            "catalog": catalog_name,
            "catalogId": catalog_id,
            "vendor": vendor_name,
            "category": category,
            "price": float(rec.get("list_price") or 0),
            "cost": float(rec.get("standard_price") or 0),
            "stock": stock,
            "status": status,
            "active": rec.get("active", True),
            "hasImage": has_image,
            "updatedAt": rec.get("write_date") or rec.get("create_date"),
        }

    def _stats(self, items: list[dict]) -> dict:
        total = len(items)
        active = len([p for p in items if p.get("status") == "active"])
        low = len([p for p in items if p.get("status") == "low"])
        out = len([p for p in items if p.get("status") == "out"])
        return {"total": total, "active": active, "low": low, "out": out}


admin_product_service = AdminProductService(odoo)
