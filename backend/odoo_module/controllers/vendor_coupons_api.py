from datetime import date

from odoo import http
from odoo.http import request

from .api_base import error, get_json, ok, require_fields, require_jwt


COUPON_FIELDS = [
    "id",
    "code",
    "description",
    "discount_type",
    "value",
    "min_order_amount",
    "max_discount_amount",
    "max_uses",
    "max_uses_per_user",
    "expires_at",
    "status",
    "catalog_ids",
    "one_per_customer",
    "new_customers_only",
    "usage_count",
    "vendor_partner_id",
]


def _partner_id_from_user(uid: int) -> int:
    user = request.env["res.users"].sudo().browse(uid)
    if not user.exists() or not user.partner_id:
        raise LookupError(f"User {uid} has no partner")
    return int(user.partner_id.id)


def _to_api(rec: dict) -> dict:
    expires_at = rec.get("expires_at")
    status = rec.get("status") or "inactive"
    if status == "active" and expires_at:
        try:
            if date.fromisoformat(expires_at) < date.today():
                status = "expired"
        except Exception:
            pass

    vendor_partner = rec.get("vendor_partner_id")
    return {
        "id": rec.get("id"),
        "code": rec.get("code"),
        "description": rec.get("description") or "",
        "type": rec.get("discount_type") or "percent",
        "value": rec.get("value") or 0,
        "minOrder": rec.get("min_order_amount"),
        "maxDiscount": rec.get("max_discount_amount"),
        "maxUses": rec.get("max_uses"),
        "maxUsesPerUser": rec.get("max_uses_per_user") or 1,
        "expiresAt": expires_at,
        "status": status,
        "catalogs": rec.get("catalog_ids") or [],
        "onePerCustomer": bool(rec.get("one_per_customer")),
        "newCustomersOnly": bool(rec.get("new_customers_only")),
        "uses": rec.get("usage_count") or 0,
        "vendorPartnerId": vendor_partner[0] if isinstance(vendor_partner, list) else vendor_partner,
    }


def _to_odoo(payload: dict, include_partner_id: int | None = None) -> dict:
    values = {
        "code": str(payload.get("code", "")).strip().upper(),
        "description": payload.get("description") or "",
        "discount_type": payload.get("type") or "percent",
        "value": float(payload.get("value") or 0),
        "min_order_amount": float(payload["minOrder"]) if payload.get("minOrder") not in (None, "") else False,
        "max_discount_amount": float(payload["maxDiscount"]) if payload.get("maxDiscount") not in (None, "") else False,
        "max_uses": int(payload["maxUses"]) if payload.get("maxUses") not in (None, "") else False,
        "max_uses_per_user": int(payload.get("maxUsesPerUser") or 1),
        "expires_at": payload.get("expiresAt") or False,
        "status": payload.get("status") or "active",
        "one_per_customer": bool(payload.get("onePerCustomer", True)),
        "new_customers_only": bool(payload.get("newCustomersOnly", False)),
    }
    if "catalogs" in payload:
        values["catalog_ids"] = [(6, 0, payload.get("catalogs") or [])]
    if include_partner_id:
        values["vendor_partner_id"] = include_partner_id
    return values


def _get_owned_record(uid: int, coupon_id: int) -> dict:
    partner_id = _partner_id_from_user(uid)
    rows = (
        request.env["catalog.coupon"]
        .sudo()
        .search_read(
            [("id", "=", int(coupon_id)), ("vendor_partner_id", "=", partner_id)],
            COUPON_FIELDS,
            limit=1,
        )
    )
    if not rows:
        raise LookupError(f"Coupon {coupon_id} not found")
    return rows[0]


class CatalogixVendorCouponsController(http.Controller):
    @http.route("/api/vendor/coupons", type="http", auth="none", csrf=False, cors="*")
    def list_coupons(self, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        partner_id = _partner_id_from_user(uid)
        rows = (
            request.env["catalog.coupon"]
            .sudo()
            .search_read([("vendor_partner_id", "=", partner_id)], COUPON_FIELDS, order="id desc", limit=500)
        )
        return ok([_to_api(row) for row in rows])

    @http.route("/api/vendor/coupons/<int:coupon_id>", type="http", auth="none", csrf=False, cors="*")
    def get_coupon(self, coupon_id, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        try:
            return ok(_to_api(_get_owned_record(uid, coupon_id)))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

    @http.route("/api/vendor/coupons", type="http", auth="none", csrf=False, cors="*", methods=["POST"])
    def create_coupon(self, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        data = get_json()
        err = require_fields(data, ["code", "type", "value"])
        if err:
            return error(err, 400)

        try:
            partner_id = _partner_id_from_user(uid)
            coupon = request.env["catalog.coupon"].sudo().create(_to_odoo(data, include_partner_id=partner_id))
            return ok(_to_api(_get_owned_record(uid, coupon.id)), 201)
        except Exception as exc:
            return error(str(exc), 500)

    @http.route("/api/vendor/coupons/<int:coupon_id>", type="http", auth="none", csrf=False, cors="*", methods=["PUT"])
    def update_coupon(self, coupon_id, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        data = get_json()
        err = require_fields(data, ["code", "type", "value"])
        if err:
            return error(err, 400)

        try:
            _get_owned_record(uid, coupon_id)
            request.env["catalog.coupon"].sudo().browse(int(coupon_id)).write(_to_odoo(data))
            return ok(_to_api(_get_owned_record(uid, coupon_id)))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

    @http.route(
        "/api/vendor/coupons/<int:coupon_id>/status",
        type="http",
        auth="none",
        csrf=False,
        cors="*",
        methods=["PATCH"],
    )
    def toggle_coupon_status(self, coupon_id, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        try:
            coupon = _get_owned_record(uid, coupon_id)
            if coupon.get("status") == "expired":
                return ok(_to_api(coupon))
            new_status = "inactive" if coupon.get("status") == "active" else "active"
            request.env["catalog.coupon"].sudo().browse(int(coupon_id)).write({"status": new_status})
            return ok(_to_api(_get_owned_record(uid, coupon_id)))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

    @http.route(
        "/api/vendor/coupons/<int:coupon_id>/duplicate",
        type="http",
        auth="none",
        csrf=False,
        cors="*",
        methods=["POST"],
    )
    def duplicate_coupon(self, coupon_id, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        try:
            coupon = _to_api(_get_owned_record(uid, coupon_id))
            coupon["id"] = None
            coupon["code"] = f"{coupon['code']}_COPIA"
            coupon["status"] = "inactive"
            coupon["uses"] = 0
            partner_id = _partner_id_from_user(uid)
            created = request.env["catalog.coupon"].sudo().create(_to_odoo(coupon, include_partner_id=partner_id))
            return ok(_to_api(_get_owned_record(uid, created.id)), 201)
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

    @http.route("/api/vendor/coupons/<int:coupon_id>", type="http", auth="none", csrf=False, cors="*", methods=["DELETE"])
    def delete_coupon(self, coupon_id, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        try:
            _get_owned_record(uid, coupon_id)
            request.env["catalog.coupon"].sudo().browse(int(coupon_id)).unlink()
            return ok({"message": "Coupon deleted"})
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

