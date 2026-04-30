from .client import odoo

ORDER_FIELDS = [
    "id",
    "name",
    "state",
    "amount_total",
    "partner_id",
    "date_order",
    "order_line",
]
LINE_FIELDS = ["id", "product_id", "product_uom_qty", "price_unit", "price_subtotal"]
PRODUCT_IMAGE_FIELDS = ["id", "image_1920"]


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

    rows = odoo.read("product.product", list(set(product_ids)), PRODUCT_IMAGE_FIELDS)
    image_map = {int(r["id"]): r.get("image_1920") for r in rows if r.get("id")}

    for line in lines:
        prod = line.get("product_id")
        prod_id = None
        if isinstance(prod, (list, tuple)) and prod:
            prod_id = int(prod[0])
        elif isinstance(prod, int):
            prod_id = prod
        if not prod_id:
            continue
        img = image_map.get(prod_id)
        if isinstance(img, str) and img and not img.isdigit():
            line["image_url"] = f"data:image/*;base64,{img}"
    return lines


def create_order(partner_id: int, lines: list) -> int:
    """Crea un sale.order en Odoo. lines = [{"product_id": x, "qty": y, "price": z}]"""
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
    order["lines"] = _attach_line_images(
        odoo.read("sale.order.line", order["order_line"], LINE_FIELDS)
    )
    return order


def create_or_update_cart(partner_id: int, lines: list, cart_id: int | None = None) -> int:
    if cart_id:
        _replace_order_lines(cart_id, lines)
        return cart_id

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
    order["lines"] = _attach_line_images(
        odoo.read("sale.order.line", order["order_line"], LINE_FIELDS)
    )
    return order


def confirm_order(order_id: int) -> bool:
    return odoo.call("sale.order", "action_confirm", [[order_id]])
