from flask import Blueprint, request
from flask.views import MethodView
from xmlrpc.client import Fault

from ..middleware.auth_guard import jwt_required
from ..odoo.promotions import promotion_service
from ..utils.response import error, success


class PromotionPayloadValidator:
    @staticmethod
    def validate(payload: dict) -> str | None:
        name = str(payload.get("name") or "").strip()
        if not name:
            return "Missing required fields: name"
        promo_type = payload.get("type") or "percent"
        if promo_type not in {"percent", "fixed", "shipping"}:
            return "Invalid promotion type"
        if promo_type != "shipping":
            try:
                if float(payload.get("value") or 0) <= 0:
                    return "Promotion value must be greater than 0"
            except (TypeError, ValueError):
                return "Promotion value must be a number"
        return None


class VendorPromotionBase(MethodView):
    decorators = [jwt_required]

    def __init__(self, service):
        self._service = service

    @staticmethod
    def _is_model_missing(exc: Exception) -> bool:
        if not isinstance(exc, Fault):
            return False
        msg = str(exc).lower()
        return "catalog.promotion" in msg and ("does not exist" in msg or "invalid" in msg or "model" in msg)

    @staticmethod
    def _model_missing_response():
        return error(
            "Odoo model catalog.promotion is missing. Install/update the custom module 'Catalogix Digital' in Odoo Apps.",
            503,
        )

    @staticmethod
    def _uid() -> int:
        return int(request.jwt_payload.get("uid"))


class VendorPromotionsAPI(VendorPromotionBase):
    def get(self):
        try:
            return success(self._service.list_vendor_promotions(self._uid()))
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)

    def post(self):
        data = request.get_json() or {}
        err = PromotionPayloadValidator.validate(data)
        if err:
            return error(err, 400)

        try:
            return success(self._service.create_vendor_promotion(self._uid(), data), 201)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)


class VendorPromotionDetailAPI(VendorPromotionBase):
    def get(self, promotion_id: int):
        try:
            return success(self._service.get_vendor_promotion(self._uid(), promotion_id))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)

    def put(self, promotion_id: int):
        data = request.get_json() or {}
        err = PromotionPayloadValidator.validate(data)
        if err:
            return error(err, 400)

        try:
            return success(self._service.update_vendor_promotion(self._uid(), promotion_id, data))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)

    def delete(self, promotion_id: int):
        try:
            self._service.delete_vendor_promotion(self._uid(), promotion_id)
            return success({"message": "Promotion deleted"})
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)


class VendorPromotionStatusAPI(VendorPromotionBase):
    def patch(self, promotion_id: int):
        try:
            return success(self._service.toggle_vendor_promotion_status(self._uid(), promotion_id))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)


bp = Blueprint("vendor_promotions", __name__)
bp.add_url_rule("", view_func=VendorPromotionsAPI.as_view("vendor_promotions", service=promotion_service))
bp.add_url_rule(
    "/<int:promotion_id>",
    view_func=VendorPromotionDetailAPI.as_view("vendor_promotion_detail", service=promotion_service),
)
bp.add_url_rule(
    "/<int:promotion_id>/status",
    view_func=VendorPromotionStatusAPI.as_view("vendor_promotion_status", service=promotion_service),
)
