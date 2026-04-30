from flask import Blueprint, request

from ..middleware.auth_guard import jwt_required
from ..odoo.pricing import (
    create_vendor_pricing_rule,
    delete_vendor_pricing_rule,
    get_vendor_pricing_settings,
    list_vendor_pricing_rules,
    save_vendor_pricing_settings,
    toggle_vendor_pricing_rule_status,
    update_vendor_pricing_rule,
)
from ..odoo.users import UserService
from ..utils.response import error, success
from ..utils.validators import require_fields

bp = Blueprint("vendor_pricing", __name__)


def _current_partner_id() -> int | None:
    payload = getattr(request, "jwt_payload", {}) or {}
    partner_id = payload.get("partner_id")
    if partner_id:
        return int(partner_id)
    uid = payload.get("uid")
    if not uid:
        return None
    return UserService.resolve_vendor_partner_id(int(uid))


def _is_pricing_model_missing(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "catalog.pricing" in msg and ("does not exist" in msg or "invalid" in msg or "model" in msg)


def _model_missing_response():
    return error(
        "Odoo pricing models are missing. Install/update the custom module 'Catalogix Digital' in Odoo Apps.",
        503,
    )


@bp.get("/settings")
@jwt_required
def get_settings():
    partner_id = _current_partner_id()
    if not partner_id:
        return error("No partner linked to this user", 400)
    try:
        return success(get_vendor_pricing_settings(partner_id))
    except Exception as exc:
        if _is_pricing_model_missing(exc):
            return _model_missing_response()
        return error(str(exc), 500)


@bp.patch("/settings")
@jwt_required
def save_settings():
    partner_id = _current_partner_id()
    if not partner_id:
        return error("No partner linked to this user", 400)
    data = request.get_json() or {}
    try:
        return success(save_vendor_pricing_settings(partner_id, data))
    except Exception as exc:
        if _is_pricing_model_missing(exc):
            return _model_missing_response()
        return error(str(exc), 500)


@bp.get("/rules")
@jwt_required
def list_rules():
    partner_id = _current_partner_id()
    if not partner_id:
        return error("No partner linked to this user", 400)
    try:
        return success(list_vendor_pricing_rules(partner_id))
    except Exception as exc:
        if _is_pricing_model_missing(exc):
            return _model_missing_response()
        return error(str(exc), 500)


@bp.post("/rules")
@jwt_required
def create_rule():
    partner_id = _current_partner_id()
    if not partner_id:
        return error("No partner linked to this user", 400)
    data = request.get_json() or {}
    err = require_fields(data, ["name"])
    if err:
        return error(err, 400)
    try:
        return success(create_vendor_pricing_rule(partner_id, data), 201)
    except Exception as exc:
        if _is_pricing_model_missing(exc):
            return _model_missing_response()
        return error(str(exc), 500)


@bp.put("/rules/<int:rule_id>")
@jwt_required
def update_rule(rule_id: int):
    partner_id = _current_partner_id()
    if not partner_id:
        return error("No partner linked to this user", 400)
    data = request.get_json() or {}
    err = require_fields(data, ["name"])
    if err:
        return error(err, 400)
    try:
        return success(update_vendor_pricing_rule(partner_id, rule_id, data))
    except LookupError as exc:
        return error(str(exc), 404)
    except Exception as exc:
        if _is_pricing_model_missing(exc):
            return _model_missing_response()
        return error(str(exc), 500)


@bp.patch("/rules/<int:rule_id>")
@jwt_required
def patch_rule(rule_id: int):
    partner_id = _current_partner_id()
    if not partner_id:
        return error("No partner linked to this user", 400)
    data = request.get_json() or {}
    try:
        return success(update_vendor_pricing_rule(partner_id, rule_id, data))
    except LookupError as exc:
        return error(str(exc), 404)
    except Exception as exc:
        if _is_pricing_model_missing(exc):
            return _model_missing_response()
        return error(str(exc), 500)


@bp.patch("/rules/<int:rule_id>/status")
@jwt_required
def toggle_rule_status(rule_id: int):
    partner_id = _current_partner_id()
    if not partner_id:
        return error("No partner linked to this user", 400)
    try:
        return success(toggle_vendor_pricing_rule_status(partner_id, rule_id))
    except LookupError as exc:
        return error(str(exc), 404)
    except Exception as exc:
        if _is_pricing_model_missing(exc):
            return _model_missing_response()
        return error(str(exc), 500)


@bp.delete("/rules/<int:rule_id>")
@jwt_required
def delete_rule(rule_id: int):
    partner_id = _current_partner_id()
    if not partner_id:
        return error("No partner linked to this user", 400)
    try:
        delete_vendor_pricing_rule(partner_id, rule_id)
        return success({"message": "Pricing rule deleted"})
    except LookupError as exc:
        return error(str(exc), 404)
    except Exception as exc:
        if _is_pricing_model_missing(exc):
            return _model_missing_response()
        return error(str(exc), 500)
