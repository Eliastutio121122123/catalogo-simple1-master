from .client import odoo

ORDER_FIELDS = [
    "id",
    "name",
    "state",
    "client_order_ref",
    "amount_total",
    "currency_id",
    "partner_id",
    "date_order",
    "order_line",
]
LINE_FIELDS = ["id", "product_id", "product_uom_qty", "price_unit", "price_subtotal"]
PRODUCT_IMAGE_FIELDS = ["id", "image_1920"]


def _read_order_meta(order_id: int) -> dict | None:
    try:
        rows = odoo.search_read(
            "sale.order",
            [["id", "=", int(order_id)]],
            ["id", "partner_id", "state"],
            limit=1,
        )
        return rows[0] if rows else None
    except Exception:
        return None


def _attach_line_images(lines: list) -> list:
    if not lines:
        return lines
    product_ids = []
    for line in lines:
        prod = line.get("product_id")
        if isinstance(prod, (list, tuple)) and prod:
            product_ids.append(int(prod[0]))
        elif isinstance(prod, int):
            product_ids.append(prod)

    if not product_ids:
        return lines

    rows = odoo.read("product.product", list(set(product_ids)), ["id", "image_1920", "product_tmpl_id"])
    image_map = {int(r["id"]): r.get("image_1920") for r in rows if r.get("id")}
    tmpl_map = {}
    for r in rows:
        tid = r.get("product_tmpl_id")
        if tid:
            tmpl_map[int(r["id"])] = int(tid[0]) if isinstance(tid, list) else int(tid)

    for line in lines:
        prod = line.get("product_id")
        prod_id = None
        orig_name = ""
        if isinstance(prod, (list, tuple)) and prod:
            prod_id = int(prod[0])
            if len(prod) > 1:
                orig_name = prod[1]
        elif isinstance(prod, int):
            prod_id = prod

        if not prod_id:
            continue
            
        img = image_map.get(prod_id)
        if isinstance(img, str) and img and not img.isdigit():
            line["image_url"] = f"data:image/*;base64,{img}"
            
        tmpl_id = tmpl_map.get(prod_id)
        if tmpl_id:
            line["product_id"] = [tmpl_id, orig_name]
            
    return lines


def _resolve_product_variants(lines: list) -> list:
    if not lines:
        return lines

    template_ids = list({int(l["product_id"]) for l in lines})
    try:
        templates = odoo.read(
            "product.template",
            template_ids,
            ["id", "product_variant_id", "product_variant_ids"]
        )
    except Exception:
        return lines

    tmpl_map = {}
    for t in templates:
        vid = t.get("product_variant_id")
        if vid:
            tmpl_map[t["id"]] = int(vid[0]) if isinstance(vid, list) else int(vid)
        else:
            vids = t.get("product_variant_ids")
            if vids:
                tmpl_map[t["id"]] = int(vids[0])

    for line in lines:
        variant_id = tmpl_map.get(int(line["product_id"]))
        if variant_id:
            line["product_id"] = variant_id
    return lines


def create_order(partner_id: int, lines: list) -> int:
    """Crea un sale.order en Odoo. lines = [{"product_id": x, "qty": y, "price": z}]"""
    lines = _resolve_product_variants(lines)
    order_id = odoo.create("sale.order", {"partner_id": partner_id})
    for line in lines:
        odoo.create("sale.order.line", {
            "order_id":        order_id,
            "product_id":      line["product_id"],
            "product_uom_qty": line["qty"],
            "price_unit":      line["price"],
        })
    return order_id


def _replace_order_lines(order_id: int, lines: list) -> None:
    lines = _resolve_product_variants(lines)
    order_rows = odoo.read("sale.order", [order_id], ["order_line"])
    if order_rows:
        line_ids = order_rows[0].get("order_line") or []
        if line_ids:
            odoo.unlink("sale.order.line", line_ids)

    for line in lines:
        odoo.create("sale.order.line", {
            "order_id": order_id,
            "product_id": line["product_id"],
            "product_uom_qty": line["qty"],
            "price_unit": line["price"],
        })


def get_draft_cart_by_partner(partner_id: int) -> dict | None:
    results = odoo.search_read(
        "sale.order",
        [["partner_id", "=", partner_id], ["state", "=", "draft"]],
        ORDER_FIELDS,
        limit=1,
        order="id desc",
    )
    if not results:
        return None
    order = results[0]
    currency = order.get("currency_id") or [None, "DOP"]
    if isinstance(currency, list) and len(currency) > 1:
        order["currency"] = currency[1] or "DOP"
    order["lines"] = _attach_line_images(
        odoo.read("sale.order.line", order["order_line"], LINE_FIELDS)
    )
    return order


def create_or_update_cart(partner_id: int, lines: list, cart_id: int | None = None) -> int:
    if cart_id:
        meta = _read_order_meta(int(cart_id))
        order_partner = (meta or {}).get("partner_id") or []
        order_partner_id = int(order_partner[0]) if order_partner else None
        state = (meta or {}).get("state") or ""

        # Never allow writing to a cart/order that doesn't belong to the current partner.
        # If a stale cart_id is provided (e.g., from a previous session), create a new cart instead.
        if order_partner_id == int(partner_id) and state == "draft":
            _replace_order_lines(int(cart_id), lines)
            return int(cart_id)

    draft = get_draft_cart_by_partner(partner_id)
    if draft:
        _replace_order_lines(draft["id"], lines)
        return draft["id"]

    order_id = odoo.create("sale.order", {"partner_id": partner_id})
    _replace_order_lines(order_id, lines)
    return order_id


def get_orders_by_partner(partner_id: int) -> list:
    return odoo.search_read("sale.order",
                            [["partner_id", "=", partner_id]],
                            ORDER_FIELDS)


def get_order_by_id(order_id: int) -> dict:
    results = odoo.search_read("sale.order", [["id", "=", order_id]],
                               ORDER_FIELDS, limit=1)
    if not results:
        raise LookupError(f"Order {order_id} not found")
    order = results[0]
    currency = order.get("currency_id") or [None, "DOP"]
    if isinstance(currency, list) and len(currency) > 1:
        order["currency"] = currency[1] or "DOP"
    order["lines"] = _attach_line_images(
        odoo.read("sale.order.line", order["order_line"], LINE_FIELDS)
    )
    return order


def confirm_order(order_id: int) -> bool:
    return odoo.call("sale.order", "action_confirm", [[order_id]])
