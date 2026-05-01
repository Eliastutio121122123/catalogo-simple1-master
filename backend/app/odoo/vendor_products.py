from .client import odoo
from .inventory import set_onhand_for_template
from .variant_options import attach_variant_options
import base64
import binascii

_PRODUCT_TYPE_FIELD = None


def _product_type_field_name() -> str | None:
    global _PRODUCT_TYPE_FIELD
    if _PRODUCT_TYPE_FIELD:
        return _PRODUCT_TYPE_FIELD
    try:
        fields = odoo.call("product.template", "fields_get", [], {}) or {}
    except Exception:
        fields = {}

    if "detailed_type" in fields:
        _PRODUCT_TYPE_FIELD = "detailed_type"
    elif "type" in fields:
        selection = fields.get("type", {}).get("selection") or []
        values = {val for val, _ in selection}
        if "product" in values:
            _PRODUCT_TYPE_FIELD = "type"
        else:
            _PRODUCT_TYPE_FIELD = None
    else:
        _PRODUCT_TYPE_FIELD = None
    return _PRODUCT_TYPE_FIELD


def _ensure_storable_values(values: dict) -> None:
    field_name = _product_type_field_name()
    if field_name and not values.get(field_name):
        values[field_name] = "product"

PRODUCT_FIELDS = [
    "id",
    "name",
    "list_price",
    "description_sale",
    "categ_id",
    "image_1920",
    "qty_available",
    "catalog_stock_qty",
    "catalog_id",
    "default_code",
    "active",
    "standard_price",
    "min_stock",
    "currency_id",
    "attribute_line_ids",
]


class VendorProductService:
    @staticmethod
    def _normalize_images(values) -> list[str]:
        if not values:
            return []
        if isinstance(values, str):
            values = [values]
        out = []
        for val in values:
            if not val:
                continue
            text = str(val).strip()
            if text.startswith("data:") and "base64," in text:
                text = text.split("base64,", 1)[1].strip()
            # remove whitespace/newlines that can break strict base64 validation
            text = "".join(text.split())
            if text:
                out.append(text)
        return out

    @staticmethod
    def _detect_image_format(blob: bytes) -> str | None:
        if not blob:
            return None
        if blob.startswith(b"\x89PNG\r\n\x1a\n"):
            return "png"
        if blob.startswith(b"\xff\xd8\xff"):
            return "jpeg"
        if blob.startswith(b"GIF87a") or blob.startswith(b"GIF89a"):
            return "gif"
        if blob.startswith(b"RIFF") and len(blob) >= 12 and blob[8:12] == b"WEBP":
            return "webp"
        head = blob.lstrip()[:256].lower()
        if head.startswith(b"<?xml") or head.startswith(b"<svg"):
            return "svg"
        return None

    @classmethod
    def _validate_images(cls, images: list[str]) -> None:
        if not images:
            return

        max_bytes = 5 * 1024 * 1024  # 5MB (matches UI hint)
        allowed = {"png", "jpeg", "gif"}

        for idx, b64 in enumerate(images, start=1):
            if not b64 or not isinstance(b64, str):
                raise ValueError(f"Imagen {idx}: vacía o inválida")
            try:
                blob = base64.b64decode(b64, validate=True)
            except (binascii.Error, ValueError):
                raise ValueError(f"Imagen {idx}: no es base64 válido")
            if len(blob) <= 16:
                raise ValueError(f"Imagen {idx}: contenido inválido")
            if len(blob) > max_bytes:
                raise ValueError(f"Imagen {idx}: supera el tamaño máximo de 5 MB")
            fmt = cls._detect_image_format(blob)
            if fmt == "webp":
                raise ValueError("Formato WEBP no soportado. Usa JPG o PNG.")
            if fmt == "svg":
                raise ValueError("Formato SVG no soportado. Usa JPG o PNG.")
            if fmt not in allowed:
                raise ValueError(f"Imagen {idx}: formato no soportado. Usa JPG o PNG.")

    @classmethod
    def _apply_images(cls, product_id: int, images_base64) -> None:
        images = cls._normalize_images(images_base64)
        main = images[0] if images else False
        odoo.write("product.template", [product_id], {"image_1920": main or False})

        # Replace extra images
        extra_ids = odoo.search("product.image", [["product_tmpl_id", "=", product_id]]) or []
        if extra_ids:
            odoo.unlink("product.image", extra_ids)

        for idx, img in enumerate(images[1:], start=2):
            odoo.create(
                "product.image",
                {
                    "product_tmpl_id": product_id,
                    "image_1920": img,
                    "name": f"Imagen {idx}",
                    "sequence": idx,
                },
            )

    @classmethod
    def _attach_images(cls, product: dict) -> dict:
        out = dict(product)
        images = []
        if out.get("id"):
            pid = int(out["id"])
            main_rows = odoo.call(
                "product.template",
                "read",
                [[pid]],
                {"fields": ["image_1920"], "context": {"bin_size": False}},
            ) or []
            if main_rows and main_rows[0].get("image_1920"):
                images.append(main_rows[0]["image_1920"])

            rows = odoo.call(
                "product.image",
                "search_read",
                [[["product_tmpl_id", "=", pid]]],
                {
                    "fields": ["image_1920", "sequence"],
                    "limit": 50,
                    "order": "sequence asc, id asc",
                    "context": {"bin_size": False},
                },
            ) or []
            for row in rows:
                if row.get("image_1920"):
                    images.append(row["image_1920"])
        if images:
            out["images_base64"] = images
        return out
    @staticmethod
    def _normalize_variant_values(values) -> list[str]:
        if not values:
            return []
        if isinstance(values, str):
            values = [values]
        out = []
        for val in values:
            if val is None:
                continue
            text = str(val).strip()
            if text and text not in out:
                out.append(text)
        return out

    @classmethod
    def _resolve_attribute_value_ids(cls, attribute_name: str, values: list[str]) -> tuple[int | None, list[int]]:
        """Ensure attribute and values exist; return (attribute_id, value_ids)."""
        normalized = cls._normalize_variant_values(values)
        if not normalized:
            return None, []

        rows = odoo.search_read(
            "product.attribute",
            [["name", "ilike", attribute_name]],
            ["id", "name"],
            limit=1,
        )
        if rows:
            attribute_id = int(rows[0]["id"])
        else:
            attribute_id = odoo.create("product.attribute", {"name": attribute_name})

        value_ids: list[int] = []
        for val in normalized:
            vrows = odoo.search_read(
                "product.attribute.value",
                [["attribute_id", "=", attribute_id], ["name", "=", val]],
                ["id"],
                limit=1,
            )
            if vrows:
                value_ids.append(int(vrows[0]["id"]))
            else:
                value_ids.append(
                    odoo.create("product.attribute.value", {"name": val, "attribute_id": attribute_id})
                )

        return attribute_id, value_ids

    @staticmethod
    def _vendor_catalog_ids(partner_id: int) -> list[int]:
        return odoo.call("catalog.catalog", "search", [[["vendor_id", "=", partner_id]]], {"context": {"active_test": False}}) or []

    @staticmethod
    def _resolve_category_id(name: str | None) -> int | None:
        if not name:
            return None
        name = str(name).strip()
        if not name:
            return None
        rows = odoo.search_read("product.category", [["name", "=", name]], ["id"], limit=1)
        if rows:
            return int(rows[0]["id"])
        return odoo.create("product.category", {"name": name})

    @classmethod
    def _resolve_catalog_id(cls, partner_id: int, payload: dict) -> int | None:
        catalog_id = payload.get("catalog_id")
        if catalog_id:
            cid = int(catalog_id)
            rows = odoo.call(
                "catalog.catalog",
                "search_read",
                [[["id", "=", cid], ["vendor_id", "=", partner_id]]],
                {"fields": ["id"], "limit": 1, "context": {"active_test": False}},
            )
            return int(rows[0]["id"]) if rows else None

        catalog_name = payload.get("catalog") or payload.get("catalog_name")
        if not catalog_name:
            # No catalog provided: if vendor has one, use it; otherwise create a default.
            existing = cls._vendor_catalog_ids(partner_id)
            if existing:
                return int(existing[0])

            vendor_rows = odoo.call(
                "catalog.vendor",
                "search_read",
                [[["partner_id", "=", partner_id]]],
                {"fields": ["store_name"], "limit": 1, "context": {"active_test": False}},
            )
            store_name = vendor_rows[0].get("store_name") if vendor_rows else None
            default_name = store_name or "Catalogo principal"
            return odoo.create(
                "catalog.catalog",
                {
                    "name": default_name,
                    "description": "Catalogo creado automaticamente",
                    "vendor_id": partner_id,
                    "active": True,
                },
            )
        rows = odoo.call(
            "catalog.catalog",
            "search_read",
            [[["vendor_id", "=", partner_id], ["name", "ilike", str(catalog_name).strip()]]],
            {"fields": ["id", "name"], "limit": 1, "context": {"active_test": False}},
        )
        if rows:
            return int(rows[0]["id"])
        # If vendor provided a name that doesn't exist yet, create it.
        return odoo.create(
            "catalog.catalog",
            {
                "name": str(catalog_name).strip(),
                "description": "Catalogo creado automaticamente",
                "vendor_id": partner_id,
                "active": True,
            },
        )

    @classmethod
    def list_vendor_products(cls, partner_id: int, limit=50, offset=0) -> list[dict]:
        catalog_ids = cls._vendor_catalog_ids(partner_id)
        if catalog_ids:
            rows = odoo.call(
                "product.template",
                "search_read",
                [[["catalog_id", "in", catalog_ids]]],
                {
                    "fields": PRODUCT_FIELDS,
                    "limit": limit,
                    "offset": offset,
                    "context": {"active_test": False, "bin_size": False},
                },
            ) or []
            if rows:
                return rows
        # Fallback: try relational domain directly (covers edge cases where catalog_ids lookup fails)
        return odoo.call(
            "product.template",
            "search_read",
            [[["catalog_id.vendor_id", "=", partner_id]]],
            {
                "fields": PRODUCT_FIELDS,
                "limit": limit,
                "offset": offset,
                "context": {"active_test": False, "bin_size": False},
            },
        ) or []

    @classmethod
    def get_vendor_product(cls, partner_id: int, product_id: int) -> dict:
        rows = odoo.read("product.template", [product_id], PRODUCT_FIELDS)
        if not rows:
            raise LookupError("Product not found")
        product = attach_variant_options(cls._attach_images(rows[0]))
        catalog = product.get("catalog_id") or []
        if not catalog:
            raise LookupError("Product is not assigned to a catalog")
        catalog_id = int(catalog[0])
        owner = odoo.search_read(
            "catalog.catalog",
            [["id", "=", catalog_id], ["vendor_id", "=", partner_id]],
            ["id"],
            limit=1,
        )
        if not owner:
            raise PermissionError("Product not owned by vendor")
        return product

    @classmethod
    def create_vendor_product(cls, partner_id: int, payload: dict) -> dict:
        images_normalized = None
        if "images_base64" in payload:
            images_normalized = cls._normalize_images(payload.get("images_base64"))
            cls._validate_images(images_normalized)

        name = str(payload.get("name") or "").strip()
        if not name:
            raise ValueError("Product name is required")

        catalog_id = cls._resolve_catalog_id(partner_id, payload)
        if not catalog_id:
            raise ValueError("Valid catalog is required")

        currency_str = payload.get("currency")
        currency_id = None
        if currency_str:
            currency_code = "DOP" if currency_str == "RD$" else currency_str
            cur_rows = odoo.call("res.currency", "search_read", [[["name", "=", currency_code]]], {"fields": ["id"], "limit": 1})
            if cur_rows:
                currency_id = cur_rows[0]["id"]

        category_id = cls._resolve_category_id(payload.get("category"))
        values = {
            "name": name,
            "list_price": float(payload.get("price") or payload.get("list_price") or 0),
            "description_sale": payload.get("description") or payload.get("description_sale") or "",
            "default_code": payload.get("sku") or payload.get("default_code") or "",
            "standard_price": float(payload.get("cost") or payload.get("standard_price") or 0),
            "catalog_id": catalog_id,
            "active": True,
            "sale_ok": True,
        }
        if currency_id:
            values["currency_id"] = currency_id
        if payload.get("minStock") is not None or payload.get("min_stock") is not None:
            values["min_stock"] = float(payload.get("minStock") or payload.get("min_stock") or 0)
        if category_id:
            values["categ_id"] = category_id

        # Ensure product is storable when stock is used.
        if payload.get("stock") is not None:
            _ensure_storable_values(values)
            values["catalog_stock_qty"] = float(payload.get("stock") or 0)

        status = (payload.get("status") or "").strip().lower()
        if status in {"inactive", "draft"}:
            values["active"] = False

        # Variants (colors/sizes) -> product attribute lines
        colors = cls._normalize_variant_values(payload.get("colors"))
        sizes = cls._normalize_variant_values(payload.get("sizes"))
        attribute_lines = []
        if colors:
            attr_id, value_ids = cls._resolve_attribute_value_ids("Color", colors)
            if attr_id and value_ids:
                attribute_lines.append((0, 0, {"attribute_id": attr_id, "value_ids": [(6, 0, value_ids)]}))
        if sizes:
            attr_id, value_ids = cls._resolve_attribute_value_ids("Size", sizes)
            if attr_id and value_ids:
                attribute_lines.append((0, 0, {"attribute_id": attr_id, "value_ids": [(6, 0, value_ids)]}))
        if attribute_lines:
            values["attribute_line_ids"] = attribute_lines

        product_id = odoo.create("product.template", values)
        if not product_id:
            raise RuntimeError("Odoo did not return product id")

        if images_normalized is not None:
            cls._apply_images(int(product_id), images_normalized)

        if payload.get("stock") is not None:
            try:
                set_onhand_for_template(int(product_id), float(payload.get("stock") or 0))
            except Exception:
                # Fallback: keep custom stock field and avoid failing creation.
                pass

        # First try direct read by id (more reliable than search_read).
        rows = odoo.read("product.template", [product_id], PRODUCT_FIELDS)
        if not rows:
            # Fallback: locate by sku/name and catalog.
            domain = []
            if values.get("default_code"):
                domain.append(["default_code", "=", values["default_code"]])
            if catalog_id:
                domain.append(["catalog_id", "=", int(catalog_id)])
            if values.get("name"):
                domain.append(["name", "=", values["name"]])
            if domain:
                rows = odoo.search_read("product.template", domain, PRODUCT_FIELDS, limit=1, order="id desc")

        if not rows:
            raise LookupError("Product not found after creation")

        product = attach_variant_options(cls._attach_images(rows[0]))
        # Ensure catalog_id is set (defensive).
        if catalog_id:
            assigned = product.get("catalog_id") or []
            assigned_id = int(assigned[0]) if assigned else None
            if assigned_id != int(catalog_id):
                odoo.write("product.template", [product_id], {"catalog_id": int(catalog_id)})
                refreshed = odoo.read("product.template", [product_id], PRODUCT_FIELDS)
                if refreshed:
                    product = refreshed[0]

        # Validate ownership
        catalog = product.get("catalog_id") or []
        if catalog:
            catalog_id = int(catalog[0])
            owner = odoo.search_read(
                "catalog.catalog",
                [["id", "=", catalog_id], ["vendor_id", "=", partner_id]],
                ["id"],
                limit=1,
            )
            if not owner:
                raise PermissionError("Product not owned by vendor")

        return product

    @classmethod
    def update_vendor_product(cls, partner_id: int, product_id: int, payload: dict) -> dict:
        cls.get_vendor_product(partner_id, product_id)

        values = {}
        if "name" in payload and payload.get("name"):
            values["name"] = str(payload["name"]).strip()
        if "price" in payload or "list_price" in payload:
            values["list_price"] = float(payload.get("price") or payload.get("list_price") or 0)
        if "description" in payload or "description_sale" in payload:
            values["description_sale"] = payload.get("description") or payload.get("description_sale") or ""
        if "sku" in payload or "default_code" in payload:
            values["default_code"] = payload.get("sku") or payload.get("default_code") or ""
        if "cost" in payload or "standard_price" in payload:
            values["standard_price"] = float(payload.get("cost") or payload.get("standard_price") or 0)
        if "minStock" in payload or "min_stock" in payload:
            values["min_stock"] = float(payload.get("minStock") or payload.get("min_stock") or 0)
        if "category" in payload:
            category_id = cls._resolve_category_id(payload.get("category"))
            if category_id:
                values["categ_id"] = category_id
        if "catalog" in payload or "catalog_id" in payload or "catalog_name" in payload:
            catalog_id = cls._resolve_catalog_id(partner_id, payload)
            if not catalog_id:
                raise ValueError("Valid catalog is required")
            values["catalog_id"] = catalog_id
        
        currency_str = payload.get("currency")
        if currency_str:
            currency_code = "DOP" if currency_str == "RD$" else currency_str
            cur_rows = odoo.call("res.currency", "search_read", [[["name", "=", currency_code]]], {"fields": ["id"], "limit": 1})
            if cur_rows:
                values["currency_id"] = cur_rows[0]["id"]
                
        if "status" in payload:
            status = (payload.get("status") or "").strip().lower()
            if status in {"active", "inactive", "draft"}:
                values["active"] = status == "active"

        if "stock" in payload or "qty_available" in payload:
            _ensure_storable_values(values)
            if "stock" in payload:
                values["catalog_stock_qty"] = float(payload.get("stock") or 0)

        if values:
            odoo.write("product.template", [product_id], values)

        if "images_base64" in payload:
            images_normalized = cls._normalize_images(payload.get("images_base64"))
            cls._validate_images(images_normalized)
            cls._apply_images(int(product_id), images_normalized)

        if "stock" in payload or "qty_available" in payload:
            try:
                qty = payload.get("stock", payload.get("qty_available") or 0)
                set_onhand_for_template(int(product_id), float(qty))
            except Exception:
                # Keep custom stock field and do not fail the update.
                pass
        return cls.get_vendor_product(partner_id, product_id)

    @classmethod
    def delete_vendor_product(cls, partner_id: int, product_id: int) -> bool:
        cls.get_vendor_product(partner_id, product_id)
        return odoo.unlink("product.template", [product_id])
