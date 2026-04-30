from flask import Blueprint, request
from flask.views import MethodView
from xmlrpc.client import Fault

from ..middleware.auth_guard import jwt_required
from ..odoo.admin_orders import admin_order_service
from ..utils.response import error, success


class AdminOrdersBase(MethodView):
    decorators = [jwt_required]

    def __init__(self, service):
        self._service = service

    @staticmethod
    def _is_model_missing(exc: Exception) -> bool:
        if not isinstance(exc, Fault):
            return False
        msg = str(exc).lower()
        return "sale.order" in msg and ("does not exist" in msg or "invalid" in msg or "model" in msg)


class AdminOrdersAPI(AdminOrdersBase):
    def get(self):
        try:
            payload = self._service.list_orders(
                q=request.args.get("q"),
                status=request.args.get("status"),
                channel=request.args.get("channel"),
                limit=int(request.args.get("limit", 200)),
                offset=int(request.args.get("offset", 0)),
            )
            return success(payload)
        except Exception as exc:
            if self._is_model_missing(exc):
                return error("Odoo model sale.order missing.", 503)
            return error(str(exc), 500)


bp = Blueprint("admin_orders", __name__)
bp.add_url_rule("", view_func=AdminOrdersAPI.as_view("admin_orders", service=admin_order_service))
