from .client import odoo

CATALOG_FIELDS = [
    "id",
    "name",
    "description",
    "image_url",
    "image_1920",
    "vendor_id",
    "active",
    "product_count",
    "create_date",
    "write_date",
]
CATALOG_DETAIL_FIELDS = CATALOG_FIELDS + ["product_ids"]
PRODUCT_FIELDS = [
    "id",
    "name",
    "list_price",
    "description",
    "image_1920",
    "categ_id",
    "qty_available",
    "catalog_stock_qty",
    "catalog_id",
]


class CatalogService:
    @staticmethod
    def _catalog_search_read(domain: list, limit=20, offset=0) -> list:
        return odoo.call(
            "catalog.catalog",
            "search_read",
            [domain],
            {
                "fields": CATALOG_FIELDS,
                "limit": limit,
                "offset": offset,
                "context": {"bin_size": False},
            },
        ) or []

    @staticmethod
    def _slugify(value: str) -> str:
        cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in (value or ""))
        while "--" in cleaned:
            cleaned = cleaned.replace("--", "-")
        return cleaned.strip("-")

    @classmethod
    def _attach_slug(cls, catalog: dict) -> dict:
        out = dict(catalog)
        image_1920 = out.get("image_1920")
        if image_1920 and not out.get("image_url"):
            if isinstance(image_1920, str) and not image_1920.isdigit():
                out["image_url"] = f"data:image/*;base64,{image_1920}"
        out["slug"] = cls._slugify(out.get("name", ""))
        return out

    @staticmethod
    def _extract_image(values: dict) -> str | None:
        if "image_1920" in values:
            return values.get("image_1920")
        if "image_base64" in values:
            return values.get("image_base64")
        return None

    @staticmethod
    def _status_from_active(active: bool, status_hint: str | None = None) -> str:
        if status_hint:
            hint = status_hint.strip().lower()
            if hint in {"active", "inactive", "draft"}:
                return hint
        return "active" if active else "inactive"

    @classmethod
    def list_public(cls, limit=20, offset=0) -> list:
        rows = cls._catalog_search_read([["active", "=", True]], limit=limit, offset=offset)
        return [cls._attach_slug(row) for row in rows]

    @classmethod
    def get_public_by_id(cls, catalog_id: int) -> dict:
        results = cls._catalog_search_read([["id", "=", catalog_id]], limit=1, offset=0)
        if not results:
            raise LookupError(f"Catalog {catalog_id} not found")
        return cls._attach_slug(results[0])

    @classmethod
    def get_public_by_slug(cls, slug: str) -> dict:
        slug_value = (slug or "").strip().lower()
        if slug_value.isdigit():
            return cls.get_public_by_id(int(slug_value))

        results = cls._catalog_search_read(
            [["active", "=", True], ["name", "ilike", slug_value.replace("-", " ")]],
            limit=50,
            offset=0,
        )
        for row in results:
            if cls._slugify(row.get("name", "")) == slug_value:
                return cls._attach_slug(row)

        # Fallback: match slug against all active catalogs (handles symbols like "&").
        results = cls._catalog_search_read(
            [["active", "=", True]],
            limit=200,
            offset=0,
        )
        for row in results:
            if cls._slugify(row.get("name", "")) == slug_value:
                return cls._attach_slug(row)

        raise LookupError(f"Catalog slug {slug} not found")

    @staticmethod
    def list_products(catalog_id: int, limit=50, offset=0) -> list:
        rows = odoo.call(
            "product.template",
            "search_read",
            [[["catalog_id", "=", catalog_id]]],
            {
                "fields": PRODUCT_FIELDS,
                "limit": limit,
                "offset": offset,
                "context": {"bin_size": False},
            },
        ) or []
        for row in rows:
            if row.get("image_1920") and not row.get("image_url"):
                image_1920 = row.get("image_1920")
                if isinstance(image_1920, str) and not image_1920.isdigit():
                    row["image_url"] = f"data:image/*;base64,{image_1920}"
        return rows

    @classmethod
    def list_by_vendor(cls, partner_id: int, limit=50, offset=0) -> list:
        rows = odoo.call(
            "catalog.catalog",
            "search_read",
            [[["vendor_id", "=", partner_id]]],
            {
                "fields": CATALOG_FIELDS,
                "limit": limit,
                "offset": offset,
                "order": "id desc",
                "context": {"active_test": False},
            },
        ) or []
        return [cls._attach_slug(row) for row in rows]

    @classmethod
    def get_vendor_catalog(cls, partner_id: int, catalog_id: int) -> dict:
        rows = odoo.read("catalog.catalog", [catalog_id], CATALOG_DETAIL_FIELDS)
        if not rows:
            raise LookupError("Catalog not found for vendor")
        catalog = rows[0]

        vendor = catalog.get("vendor_id") or []
        vendor_id = int(vendor[0]) if vendor else None
        if vendor_id is None:
            # Try to bind to vendor if missing.
            odoo.write("catalog.catalog", [catalog_id], {"vendor_id": partner_id})
            refreshed = odoo.read("catalog.catalog", [catalog_id], CATALOG_DETAIL_FIELDS)
            if refreshed:
                catalog = refreshed[0]
                vendor = catalog.get("vendor_id") or []
                vendor_id = int(vendor[0]) if vendor else None

        if vendor_id != partner_id:
            raise LookupError("Catalog not found for vendor")

        return cls._attach_slug(catalog)

    @classmethod
    def create_vendor_catalog(cls, partner_id: int, values: dict) -> int:
        payload = {
            "name": values["name"].strip(),
            "description": values.get("description") or "",
            "image_url": values.get("image_url") or "",
            "vendor_id": partner_id,
            "active": values.get("active", True),
        }
        image_1920 = cls._extract_image(values)
        if image_1920 is not None:
            payload["image_1920"] = image_1920 or False
        return odoo.create("catalog.catalog", payload)

    @classmethod
    def update_vendor_catalog(cls, partner_id: int, catalog_id: int, values: dict) -> bool:
        cls.get_vendor_catalog(partner_id, catalog_id)
        payload = {}
        for key in ("name", "description", "image_url", "active"):
            if key in values:
                payload[key] = values[key]
        image_1920 = cls._extract_image(values)
        if image_1920 is not None:
            payload["image_1920"] = image_1920 or False
        if "name" in payload and payload["name"] is not None:
            payload["name"] = str(payload["name"]).strip()
        if payload:
            return odoo.write("catalog.catalog", [catalog_id], payload)
        return True

    @classmethod
    def delete_vendor_catalog(cls, partner_id: int, catalog_id: int) -> bool:
        cls.get_vendor_catalog(partner_id, catalog_id)
        # Delete associated products first
        products = odoo.call("product.template", "search_read", [[["catalog_id", "=", catalog_id]]], {"fields": ["id"]}) or []
        product_ids = [int(p["id"]) for p in products if p.get("id")]
        if product_ids:
            try:
                odoo.call("product.template", "unlink", [product_ids])
            except Exception:
                odoo.call("product.template", "write", [product_ids, {"active": False}])
        return odoo.call("catalog.catalog", "unlink", [[catalog_id]])

    @classmethod
    def set_catalog_products(cls, catalog_id: int, product_ids: list[int], replace: bool = True) -> None:
        ids = [int(pid) for pid in product_ids if int(pid) > 0]
        if replace:
            current = odoo.search_read(
                "product.template",
                [["catalog_id", "=", catalog_id]],
                ["id"],
                limit=1000,
            )
            current_ids = {int(row["id"]) for row in current if row.get("id")}
            remove_ids = list(current_ids.difference(ids))
            if remove_ids:
                odoo.write("product.template", remove_ids, {"catalog_id": False})

        if ids:
            odoo.write("product.template", ids, {"catalog_id": catalog_id})


# Backwards-compatible helpers (used by store API)
def get_catalogs(limit=20, offset=0) -> list:
    return CatalogService.list_public(limit=limit, offset=offset)


def get_catalog_by_id(catalog_id: int) -> dict:
    return CatalogService.get_public_by_id(catalog_id)


def get_catalog_by_slug(slug: str) -> dict:
    return CatalogService.get_public_by_slug(slug)


def get_products_by_catalog(catalog_id: int, limit=50, offset=0) -> list:
    return CatalogService.list_products(catalog_id, limit=limit, offset=offset)
