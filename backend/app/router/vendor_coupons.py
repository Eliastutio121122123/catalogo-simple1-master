from flask import Blueprint, request
from flask.views import MethodView
from xmlrpc.client import Fault

from ..middleware.auth_guard import jwt_required
from ..odoo.coupons import coupon_service
from ..utils.response import error, success


class CouponPayloadValidator:
    @staticmethod
    def validate(payload: dict) -> str | None:
        code = str(payload.get("code") or "").strip()
        if not code:
            return "Missing required fields: code"
        coupon_type = payload.get("type") or "percent"
        if coupon_type not in {"percent", "fixed"}:
            return "Invalid coupon type"
        try:
            if float(payload.get("value") or 0) <= 0:
                return "Coupon value must be greater than 0"
        except (TypeError, ValueError):
            return "Coupon value must be a number"
        return None


class VendorCouponBase(MethodView):
    decorators = [jwt_required]

    def __init__(self, service):
        self._service = service

    @staticmethod
    def _is_model_missing(exc: Exception) -> bool:
        if not isinstance(exc, Fault):
            return False
        msg = str(exc).lower()
        return "catalog.coupon" in msg and ("does not exist" in msg or "invalid" in msg or "model" in msg)

    @staticmethod
    def _model_missing_response():
        return error(
            "Odoo model catalog.coupon is missing. Install/update the custom module 'Catalogix Digital' in Odoo Apps.",
            503,
        )

    @staticmethod
    def _uid() -> int:
        return int(request.jwt_payload.get("uid"))


class VendorCouponsAPI(VendorCouponBase):
    def get(self):
        try:
            return success(self._service.list_vendor_coupons(self._uid()))
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)

    def post(self):
        data = request.get_json() or {}
        err = CouponPayloadValidator.validate(data)
        if err:
            return error(err, 400)

        try:
            return success(self._service.create_vendor_coupon(self._uid(), data), 201)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)


class VendorCouponDetailAPI(VendorCouponBase):
    def get(self, coupon_id: int):
        try:
            return success(self._service.get_vendor_coupon(self._uid(), coupon_id))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)

    def put(self, coupon_id: int):
        data = request.get_json() or {}
        err = CouponPayloadValidator.validate(data)
        if err:
            return error(err, 400)

        try:
            return success(self._service.update_vendor_coupon(self._uid(), coupon_id, data))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)

    def delete(self, coupon_id: int):
        try:
            self._service.delete_vendor_coupon(self._uid(), coupon_id)
            return success({"message": "Coupon deleted"})
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)


class VendorCouponStatusAPI(VendorCouponBase):
    def patch(self, coupon_id: int):
        try:
            return success(self._service.toggle_vendor_coupon_status(self._uid(), coupon_id))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)


class VendorCouponDuplicateAPI(VendorCouponBase):
    def post(self, coupon_id: int):
        try:
            return success(self._service.duplicate_vendor_coupon(self._uid(), coupon_id), 201)
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)


bp = Blueprint("vendor_coupons", __name__)
bp.add_url_rule("", view_func=VendorCouponsAPI.as_view("vendor_coupons", service=coupon_service))
bp.add_url_rule(
    "/<int:coupon_id>",
    view_func=VendorCouponDetailAPI.as_view("vendor_coupon_detail", service=coupon_service),
)
bp.add_url_rule(
    "/<int:coupon_id>/status",
    view_func=VendorCouponStatusAPI.as_view("vendor_coupon_status", service=coupon_service),
)
bp.add_url_rule(
    "/<int:coupon_id>/duplicate",
    view_func=VendorCouponDuplicateAPI.as_view("vendor_coupon_duplicate", service=coupon_service),
)
