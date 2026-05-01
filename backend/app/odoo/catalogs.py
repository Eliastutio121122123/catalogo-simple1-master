from .client import odoo
from .products import _attach_promotions, _attach_reviews

BASE_CATALOG_FIELDS = [
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
    def _attach_catalog_ratings(rows: list[dict]) -> list[dict]:
        """
        Attach real rating/reviews to catalog rows, based on approved product reviews.

        Adds:
          - rating: float (avg 1..5)
          - reviews: int  (count)
        """
        if not rows:
            return []

        catalog_ids: list[int] = []
        for r in rows:
            cid = (r or {}).get("id")
            if not cid:
                continue
            try:
                catalog_ids.append(int(cid))
            except Exception:
                continue

        if not catalog_ids:
            return rows

        try:
            products = odoo.call(
                "product.template",
                "search_read",
                [[["catalog_id", "in", catalog_ids]]],
                {"fields": ["id", "catalog_id"], "limit": 5000, "context": {"active_test": False}},
            ) or []
        except Exception:
            products = []

        tmpl_to_catalog: dict[int, int] = {}
        tmpl_ids: list[int] = []
        for p in products or []:
            pid = (p or {}).get("id")
            cat = (p or {}).get("catalog_id") or []
            if not pid or not cat:
                continue
            try:
                tid = int(pid)
                cid = int(cat[0]) if isinstance(cat, (list, tuple)) and cat else int(cat)
            except Exception:
                continue
            tmpl_to_catalog[tid] = cid
            tmpl_ids.append(tid)

        tmpl_ids = list(dict.fromkeys(tmpl_ids))
        if not tmpl_ids:
            for r in rows:
                r["rating"] = float(r.get("rating") or 0)
                r["reviews"] = int(r.get("reviews") or 0)
            return rows

        try:
            reviews = odoo.call(
                "catalog.review",
                "search_read",
                [[["product_tmpl_id", "in", tmpl_ids], ["state", "=", "approved"]]],
                {"fields": ["product_tmpl_id", "rating"], "limit": 5000, "context": {"active_test": False}},
            ) or []
        except Exception:
            reviews = []

        agg: dict[int, dict] = {}
        for rv in reviews or []:
            pid = (rv or {}).get("product_tmpl_id") or []
            rating = int((rv or {}).get("rating") or 0)
            if isinstance(pid, (list, tuple)) and pid:
                pid = pid[0]
            if not pid:
                continue
            try:
                tid = int(pid)
            except Exception:
                continue
            cid = tmpl_to_catalog.get(tid)
            if not cid:
                continue
            entry = agg.setdefault(int(cid), {"total": 0, "sum": 0})
            entry["total"] += 1
            entry["sum"] += rating

        for r in rows:
            cid = (r or {}).get("id")
            try:
                cid = int(cid)
            except Exception:
                cid = None
            stat = agg.get(cid) if cid else None
            if stat and stat["total"]:
                r["rating"] = round(stat["sum"] / stat["total"], 2)
                r["reviews"] = int(stat["total"])
            else:
                r["rating"] = 0
                r["reviews"] = 0
        return rows

    @classmethod
    def _catalog_fields(cls) -> list[str]:
        # Always request the custom field; callers fall back if Odoo rejects it.
        fields = list(BASE_CATALOG_FIELDS)
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

    @classmethod
    def _catalog_detail_fields(cls) -> list[str]:
        return cls._catalog_fields() + ["product_ids"]

    @classmethod
    def _safe_catalog_search_read(
        cls,
        domain: list,
        fields: list[str],
        *,
        limit: int,
        offset: int,
        order: str | None,
        context: dict | None,
    ) -> list:
        kwargs: dict = {"fields": fields, "limit": limit, "offset": offset, "context": context or {}}
        if order:
            kwargs["order"] = order
        try:
            return odoo.call("catalog.catalog", "search_read", [domain], kwargs) or []
        except Exception as exc:
            if "category" in fields and (
                cls._is_invalid_field_error(exc, "category") or cls._is_missing_column_error(exc, "category")
            ):
                safe_fields = [f for f in fields if f != "category"]
                kwargs["fields"] = safe_fields
                return odoo.call("catalog.catalog", "search_read", [domain], kwargs) or []
            raise

    @classmethod
    def _safe_catalog_read(cls, ids: list[int], fields: list[str], *, context: dict | None) -> list:
        try:
            return odoo.call("catalog.catalog", "read", [ids], {"fields": fields, "context": context or {}}) or []
        except Exception as exc:
            if "category" in fields and (
                cls._is_invalid_field_error(exc, "category") or cls._is_missing_column_error(exc, "category")
            ):
                safe_fields = [f for f in fields if f != "category"]
                return odoo.call("catalog.catalog", "read", [ids], {"fields": safe_fields, "context": context or {}}) or []
            raise

    @staticmethod
    def _catalog_search_read(domain: list, limit=20, offset=0) -> list:
        return CatalogService._safe_catalog_search_read(
            domain,
            CatalogService._catalog_fields(),
            limit=int(limit or 20),
            offset=int(offset or 0),
            order=None,
            context={"bin_size": False},
        )

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
        items = [cls._attach_slug(row) for row in rows]
        return cls._attach_catalog_ratings(items)

    @classmethod
    def get_public_by_id(cls, catalog_id: int) -> dict:
        results = cls._catalog_search_read([["id", "=", catalog_id]], limit=1, offset=0)
        if not results:
            raise LookupError(f"Catalog {catalog_id} not found")
        item = cls._attach_slug(results[0])
        cls._attach_catalog_ratings([item])
        return item

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
                item = cls._attach_slug(row)
                cls._attach_catalog_ratings([item])
                return item

        # Fallback: match slug against all active catalogs (handles symbols like "&").
        results = cls._catalog_search_read(
            [["active", "=", True]],
            limit=200,
            offset=0,
        )
        for row in results:
            if cls._slugify(row.get("name", "")) == slug_value:
                item = cls._attach_slug(row)
                cls._attach_catalog_ratings([item])
                return item

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
        # Attach review stats and promotions so product cards show real stars/prices.
        return _attach_promotions(_attach_reviews(rows))

    @classmethod
    def list_by_vendor(cls, partner_id: int, limit=50, offset=0) -> list:
        fields = cls._catalog_fields()
        rows = cls._safe_catalog_search_read(
            [["vendor_id", "=", partner_id]],
            fields,
            limit=int(limit or 50),
            offset=int(offset or 0),
            order="id desc",
            context={"active_test": False},
        )
        return [cls._attach_slug(row) for row in rows]

    @classmethod
    def get_vendor_catalog(cls, partner_id: int, catalog_id: int) -> dict:
        rows = cls._safe_catalog_read(
            [catalog_id],
            cls._catalog_detail_fields(),
            context={"active_test": False},
        )
        if not rows:
            raise LookupError("Catalog not found for vendor")
        catalog = rows[0]

        vendor = catalog.get("vendor_id") or []
        vendor_id = int(vendor[0]) if vendor else None
        if vendor_id is None:
            # Try to bind to vendor if missing.
            odoo.write("catalog.catalog", [catalog_id], {"vendor_id": partner_id})
            refreshed = cls._safe_catalog_read(
                [catalog_id],
                cls._catalog_detail_fields(),
                context={"active_test": False},
            )
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
        if "category" in values and "category" in cls._catalog_fields():
            category = str(values.get("category") or "").strip()
            payload["category"] = category or False
        image_1920 = cls._extract_image(values)
        if image_1920 is not None:
            payload["image_1920"] = image_1920 or False
        try:
            return odoo.create("catalog.catalog", payload)
        except Exception as exc:
            # Backwards-compat: some DBs may not have the custom field.
            if "category" in payload and (
                cls._is_invalid_field_error(exc, "category") or cls._is_missing_column_error(exc, "category")
            ):
                payload.pop("category", None)
                return odoo.create("catalog.catalog", payload)
            raise

    @classmethod
    def update_vendor_catalog(cls, partner_id: int, catalog_id: int, values: dict) -> bool:
        cls.get_vendor_catalog(partner_id, catalog_id)
        payload = {}
        for key in ("name", "description", "image_url", "active"):
            if key in values:
                payload[key] = values[key]
        if "category" in values and "category" in cls._catalog_fields():
            category = str(values.get("category") or "").strip()
            payload["category"] = category or False
        image_1920 = cls._extract_image(values)
        if image_1920 is not None:
            payload["image_1920"] = image_1920 or False
        if "name" in payload and payload["name"] is not None:
            payload["name"] = str(payload["name"]).strip()
        if payload:
            try:
                return odoo.write("catalog.catalog", [catalog_id], payload)
            except Exception as exc:
                if "category" in payload and (
                    cls._is_invalid_field_error(exc, "category") or cls._is_missing_column_error(exc, "category")
                ):
                    payload.pop("category", None)
                    if not payload:
                        return True
                    return odoo.write("catalog.catalog", [catalog_id], payload)
                raise
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
