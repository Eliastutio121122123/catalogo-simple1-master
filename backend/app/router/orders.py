from flask import Blueprint, request
from ..odoo.orders import create_order, get_orders_by_partner, get_order_by_id, confirm_order
from ..utils.response import success, error
from ..utils.validators import require_fields
from ..middleware.auth_guard import jwt_required
from ..utils.audit_writer import log_event

bp = Blueprint("orders", __name__)


@bp.post("/")
@jwt_required
def new_order():
    data = request.get_json() or {}
    err  = require_fields(data, ["partner_id", "lines"])
    if err: return error(err, 400)
    uid = getattr(request, "jwt_payload", {}).get("uid", "unknown")
    try:
        order_id = create_order(data["partner_id"], data["lines"])
        log_event(
            "ORDER_CREATED",
            target=f"order:{order_id}",
            actor_name=f"uid:{uid}",
            actor_role="customer",
            severity="low",
            status="ok",
        )
        return success({"order_id": order_id}, 201)
    except Exception as e:
        log_event(
            "ORDER_CREATION_FAILED",
            target=f"partner:{data.get('partner_id')}",
            actor_name=f"uid:{uid}",
            actor_role="customer",
            severity="medium",
            status="warn",
        )
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
    uid = getattr(request, "jwt_payload", {}).get("uid", "unknown")
    try:
        confirm_order(order_id)
        log_event(
            "ORDER_CONFIRMED",
            target=f"order:{order_id}",
            actor_name=f"uid:{uid}",
            actor_role="customer",
            severity="low",
            status="ok",
        )
        return success({"message": "Order confirmed"})
    except Exception as e:
        log_event(
            "ORDER_CONFIRM_FAILED",
            target=f"order:{order_id}",
            actor_name=f"uid:{uid}",
            actor_role="customer",
            severity="medium",
            status="warn",
        )
        return error(str(e), 500)
