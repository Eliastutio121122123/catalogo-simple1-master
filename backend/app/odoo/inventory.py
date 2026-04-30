from __future__ import annotations

from .client import odoo
from .users import get_user_by_id, UserService

DEFAULT_MIN_STOCK = 5
_PRODUCT_TYPE_FIELD = None
_PRODUCT_TYPE_FIELD_VARIANT = None

INVENTORY_FIELDS = [
    "id",
    "name",
    "default_code",
    "categ_id",
    "catalog_id",
    "qty_available",
    "catalog_stock_qty",
    "active",
    "write_date",
    "product_variant_id",
    "min_stock",
]

MOVEMENT_FIELDS = [
    "id",
    "vendor_id",
    "product_id",
    "sku",
    "type",
    "quantity",
    "before_stock",
    "after_stock",
    "note",
    "reference",
    "user_id",
    "create_date",
]


def _product_risk(stock: float, min_stock: float) -> str:
    if stock <= 0:
        return "out"
    if stock <= min_stock:
        return "low"
    return "ok"


def _catalog_name(catalog_val) -> str:
    if isinstance(catalog_val, list) and len(catalog_val) > 1:
        return str(catalog_val[1])
    return ""


def _category_name(categ_val) -> str:
    if isinstance(categ_val, list) and len(categ_val) > 1:
        return str(categ_val[1])
    return ""


def _normalize_inventory_row(product: dict, min_stock: int = DEFAULT_MIN_STOCK) -> dict:
    if product.get("catalog_stock_qty") is not None:
        stock = float(product.get("catalog_stock_qty") or 0)
    else:
        stock = float(product.get("qty_available") or 0)
    min_value = product.get("min_stock")
    if min_value is not None:
        try:
            min_stock = int(float(min_value))
        except Exception:
            min_stock = DEFAULT_MIN_STOCK
    status = "inactive" if product.get("active") is False else "active"
    return {
        "id": int(product.get("id")),
        "name": product.get("name") or "",
        "sku": product.get("default_code") or f"PROD-{product.get('id')}",
        "catalog": _catalog_name(product.get("catalog_id")),
        "category": _category_name(product.get("categ_id")),
        "stock": stock,
        "minStock": int(min_stock),
        "status": status,
        "risk": _product_risk(stock, min_stock),
        "updatedAt": product.get("write_date"),
    }


def list_vendor_inventory(
    partner_id: int,
    limit: int = 200,
    offset: int = 0,
    q: str | None = None,
) -> list[dict]:
    catalog_ids = odoo.search("catalog.catalog", [["vendor_id", "=", partner_id]])
    if catalog_ids:
        domain = [["catalog_id", "in", catalog_ids]]
    else:
        domain = [["catalog_id.vendor_id", "=", partner_id]]

    query = (q or "").strip()
    if query:
        domain = ["|", ["name", "ilike", query], ["default_code", "ilike", query]] + domain

    rows = odoo.search_read(
        "product.template",
        domain,
        INVENTORY_FIELDS,
        limit=limit,
        offset=offset,
        order="id desc",
    )
    return [_normalize_inventory_row(row, DEFAULT_MIN_STOCK) for row in rows]


def _default_stock_location_id() -> int | None:
    rows = odoo.search_read(
        "stock.location",
        [["usage", "=", "internal"], ["name", "ilike", "Stock"]],
        ["id"],
        limit=1,
    )
    if rows:
        return int(rows[0]["id"])
    rows = odoo.search_read(
        "stock.location",
        [["usage", "=", "internal"]],
        ["id"],
        limit=1,
    )
    if rows:
        return int(rows[0]["id"])
    return None


def _set_onhand_qty(product_id: int, quantity: float) -> None:
    location_id = _default_stock_location_id()
    if not location_id:
        raise RuntimeError("No internal stock location found")

    try:
        wizard_id = odoo.create(
            "stock.change.product.qty",
            {
                "product_id": product_id,
                "new_quantity": float(quantity),
                "location_id": location_id,
            },
        )
        odoo.call("stock.change.product.qty", "change_product_qty", [[wizard_id]])
        return
    except Exception:
        # Fallback to stock.quant adjustment.
        pass

    quant_rows = odoo.search_read(
        "stock.quant",
        [["product_id", "=", product_id], ["location_id", "=", location_id]],
        ["id"],
        limit=1,
    )
    if quant_rows:
        quant_id = int(quant_rows[0]["id"])
    else:
        quant_id = odoo.create(
            "stock.quant",
            {"product_id": product_id, "location_id": location_id, "inventory_quantity": float(quantity)},
        )
    odoo.write("stock.quant", [quant_id], {"inventory_quantity": float(quantity)})
    odoo.call("stock.quant", "action_apply_inventory", [[quant_id]])


def _resolve_variant_id(template_id: int) -> int | None:
    rows = odoo.read("product.template", [template_id], ["product_variant_id"])
    if rows:
        variant = rows[0].get("product_variant_id") or []
        if isinstance(variant, list) and variant:
            return int(variant[0])
    vrows = odoo.search_read(
        "product.product",
        [["product_tmpl_id", "=", template_id]],
        ["id"],
        limit=1,
    )
    if vrows:
        return int(vrows[0]["id"])
    return None


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


def _product_type_field_name_variant() -> str | None:
    global _PRODUCT_TYPE_FIELD_VARIANT
    if _PRODUCT_TYPE_FIELD_VARIANT:
        return _PRODUCT_TYPE_FIELD_VARIANT
    try:
        fields = odoo.call("product.product", "fields_get", [], {}) or {}
    except Exception:
        fields = {}
    if "detailed_type" in fields:
        _PRODUCT_TYPE_FIELD_VARIANT = "detailed_type"
    elif "type" in fields:
        selection = fields.get("type", {}).get("selection") or []
        values = {val for val, _ in selection}
        if "product" in values:
            _PRODUCT_TYPE_FIELD_VARIANT = "type"
        else:
            _PRODUCT_TYPE_FIELD_VARIANT = None
    else:
        _PRODUCT_TYPE_FIELD_VARIANT = None
    return _PRODUCT_TYPE_FIELD_VARIANT


def _ensure_storable_template(template_id: int) -> None:
    field_name = _product_type_field_name()
    if not field_name:
        return
    try:
        odoo.write("product.template", [int(template_id)], {field_name: "product"})
    except Exception:
        # Don't block stock adjustments if type update fails.
        pass


def _ensure_storable_variant(variant_id: int) -> None:
    field_name = _product_type_field_name_variant()
    if not field_name:
        return
    try:
        odoo.write("product.product", [int(variant_id)], {field_name: "product"})
    except Exception:
        pass


def set_onhand_for_template(template_id: int, quantity: float) -> None:
    _ensure_storable_template(template_id)
    variant_id = _resolve_variant_id(template_id)
    if not variant_id:
        raise RuntimeError("No product variant found")
    _ensure_storable_variant(variant_id)
    _set_onhand_qty(variant_id, quantity)


def list_inventory_movements(partner_id: int, limit: int = 200, offset: int = 0) -> list[dict]:
    rows = odoo.search_read(
        "catalog.inventory.movement",
        [["vendor_id", "=", partner_id]],
        MOVEMENT_FIELDS,
        limit=limit,
        offset=offset,
        order="id desc",
    )
    out = []
    for row in rows:
        product = row.get("product_id") or []
        user = row.get("user_id") or []
        out.append({
            "id": row.get("id"),
            "productId": product[0] if isinstance(product, list) and product else row.get("product_id"),
            "productName": product[1] if isinstance(product, list) and len(product) > 1 else "",
            "sku": row.get("sku") or "",
            "type": row.get("type"),
            "quantity": row.get("quantity"),
            "beforeStock": row.get("before_stock"),
            "afterStock": row.get("after_stock"),
            "note": row.get("note") or "",
            "reference": row.get("reference") or "",
            "user": user[1] if isinstance(user, list) and len(user) > 1 else "",
            "createdAt": row.get("create_date"),
        })
    return out


def adjust_vendor_stock(uid: int, partner_id: int, payload: dict) -> dict:
    from .vendor_products import VendorProductService

    product_id = payload.get("product_id") or payload.get("productId")
    if not product_id:
        raise ValueError("product_id is required")

    movement_type = (payload.get("type") or "").strip().lower()
    if movement_type not in {"in", "out", "adjust"}:
        raise ValueError("Invalid movement type")

    quantity = float(payload.get("quantity") or 0)
    if movement_type != "adjust" and quantity <= 0:
        raise ValueError("Quantity must be greater than 0")

    product = VendorProductService.get_vendor_product(partner_id, int(product_id))
    # The vendor UI uses `catalog_stock_qty` when available, so movements should
    # track and update the same source of truth.
    if product.get("catalog_stock_qty") is not None:
        before_stock = float(product.get("catalog_stock_qty") or 0)
        stock_field = "catalog_stock_qty"
    else:
        before_stock = float(product.get("qty_available") or 0)
        stock_field = "qty_available"

    if movement_type == "in":
        target = before_stock + quantity
    elif movement_type == "out":
        target = max(0.0, before_stock - quantity)
    else:
        target = max(0.0, before_stock + quantity)

    # Update custom catalog stock first (best-effort), then try to keep Odoo
    # on-hand stock in sync (also best-effort).
    if stock_field == "catalog_stock_qty":
        try:
            odoo.write("product.template", [int(product_id)], {"catalog_stock_qty": float(target)})
        except Exception:
            pass

    try:
        set_onhand_for_template(int(product_id), float(target))
    except Exception:
        pass

    refreshed = odoo.read("product.template", [int(product_id)], INVENTORY_FIELDS)
    if refreshed:
        if refreshed[0].get("catalog_stock_qty") is not None:
            after_stock = float(refreshed[0].get("catalog_stock_qty") or 0)
        else:
            after_stock = float(refreshed[0].get("qty_available") or 0)
    else:
        after_stock = target

    user = get_user_by_id(int(uid))
    movement_vals = {
        "vendor_id": partner_id,
        "product_id": int(product_id),
        "sku": product.get("default_code") or "",
        "type": movement_type,
        "quantity": quantity,
        "before_stock": before_stock,
        "after_stock": after_stock,
        "note": payload.get("note") or "",
        "reference": payload.get("reference") or "",
        "user_id": int(uid),
    }
    movement_id = odoo.create("catalog.inventory.movement", movement_vals)
    rows = odoo.read("catalog.inventory.movement", [movement_id], MOVEMENT_FIELDS)
    if rows:
        return list_inventory_movements(partner_id, limit=1, offset=0)[0]
    return {
        "id": movement_id,
        "productId": int(product_id),
        "productName": product.get("name") or "",
        "sku": product.get("default_code") or "",
        "type": movement_type,
        "quantity": quantity,
        "beforeStock": before_stock,
        "afterStock": after_stock,
        "note": payload.get("note") or "",
        "reference": payload.get("reference") or "",
        "user": user.get("name") if user else "",
        "createdAt": None,
    }
