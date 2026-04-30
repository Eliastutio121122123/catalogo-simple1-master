from odoo import http
from odoo.http import request

from .api_base import error, get_json, ok, require_fields, require_jwt


ORDER_FIELDS = [
    "id",
    "name",
    "state",
    "amount_total",
    "partner_id",
    "date_order",
    "order_line",
]
LINE_FIELDS = [
    "id",
    "product_id",
    "product_uom_qty",
    "price_unit",
    "price_subtotal",
]


class CatalogixOrdersController(http.Controller):
    @http.route("/api/orders", type="http", auth="none", csrf=False, cors="*", methods=["POST"])
    def new_order(self, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        data = get_json()
        err = require_fields(data, ["partner_id", "lines"])
        if err:
            return error(err, 400)

        try:
            partner_id = int(data.get("partner_id"))
            lines = data.get("lines") or []
            order = request.env["sale.order"].sudo().create({"partner_id": partner_id})
            for line in lines:
                request.env["sale.order.line"].sudo().create({
                    "order_id": order.id,
                    "product_id": int(line.get("product_id")),
                    "product_uom_qty": float(line.get("qty") or 0),
                    "price_unit": float(line.get("price") or 0),
                })
            return ok({"order_id": order.id}, 201)
        except Exception as exc:
            return error(str(exc), 500)

    @http.route("/api/orders/partner/<int:partner_id>", type="http", auth="none", csrf=False, cors="*")
    def partner_orders(self, partner_id, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        try:
            rows = (
                request.env["sale.order"]
                .sudo()
                .search_read([("partner_id", "=", int(partner_id))], ORDER_FIELDS)
            )
            return ok(rows)
        except Exception as exc:
            return error(str(exc), 500)

    @http.route("/api/orders/<int:order_id>", type="http", auth="none", csrf=False, cors="*")
    def order_detail(self, order_id, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        rows = (
            request.env["sale.order"]
            .sudo()
            .search_read([("id", "=", int(order_id))], ORDER_FIELDS, limit=1)
        )
        if not rows:
            return error(f"Order {order_id} not found", 404)
        order = rows[0]
        line_ids = order.get("order_line") or []
        order["lines"] = (
            request.env["sale.order.line"].sudo().read(line_ids, LINE_FIELDS) if line_ids else []
        )
        return ok(order)

    @http.route("/api/orders/<int:order_id>/confirm", type="http", auth="none", csrf=False, cors="*", methods=["POST"])
    def confirm(self, order_id, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        try:
            order = request.env["sale.order"].sudo().browse(int(order_id))
            if not order.exists():
                return error(f"Order {order_id} not found", 404)
            order.action_confirm()
            return ok({"message": "Order confirmed"})
        except Exception as exc:
            return error(str(exc), 500)

