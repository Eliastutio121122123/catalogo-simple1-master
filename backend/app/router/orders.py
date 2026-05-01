from flask import Blueprint, request
from ..odoo.orders import create_order, get_orders_by_partner, get_order_by_id, confirm_order
from ..utils.response import success, error
from ..utils.validators import require_fields
from ..middleware.auth_guard import jwt_required

bp = Blueprint("orders", __name__)


@bp.post("/")
@jwt_required
def new_order():
    data = request.get_json() or {}
    err  = require_fields(data, ["partner_id", "lines"])
    if err: return error(err, 400)
    try:
        order_id = create_order(data["partner_id"], data["lines"])
        return success({"order_id": order_id}, 201)
    except Exception as e:
        return error(str(e), 500)


@bp.get("/partner/<int:partner_id>")
@jwt_required
def partner_orders(partner_id):
    try:
        return success(get_orders_by_partner(partner_id))
    except Exception as e:
        return error(str(e), 500)


@bp.get("/<int:order_id>")
@jwt_required
def order_detail(order_id):
    try:
        return success(get_order_by_id(order_id))
    except LookupError as e:
        return error(str(e), 404)


@bp.post("/<int:order_id>/confirm")
@jwt_required
def confirm(order_id):
    try:
        confirm_order(order_id)
        return success({"message": "Order confirmed"})
    except Exception as e:
        return error(str(e), 500)
