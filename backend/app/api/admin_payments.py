from flask import Blueprint, request
from flask.views import MethodView
from xmlrpc.client import Fault

from ..middleware.auth_guard import jwt_required
from ..odoo.admin_payments import admin_payment_service
from ..utils.response import error, success


class AdminPaymentsBase(MethodView):
    decorators = [jwt_required]

    def __init__(self, service):
        self._service = service

    @staticmethod
    def _is_model_missing(exc: Exception) -> bool:
        if not isinstance(exc, Fault):
            return False
        msg = str(exc).lower()
        return "account.move" in msg and ("does not exist" in msg or "invalid" in msg or "model" in msg)

    @staticmethod
    def _model_missing_response():
        return error(
            "Odoo accounting models are missing. Install the Invoicing (account) app in Odoo.",
            503,
        )


class AdminPaymentsAPI(AdminPaymentsBase):
    def get(self):
        try:
            payload = self._service.list_payments(
                q=request.args.get("q"),
                status=request.args.get("status"),
                method=request.args.get("method"),
                limit=int(request.args.get("limit", 200)),
                offset=int(request.args.get("offset", 0)),
            )
            return success(payload)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)


bp = Blueprint("admin_payments", __name__)
bp.add_url_rule("", view_func=AdminPaymentsAPI.as_view("admin_payments", service=admin_payment_service))
