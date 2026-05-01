from flask import Blueprint, request
from flask.views import MethodView
from xmlrpc.client import Fault

from ..middleware.auth_guard import jwt_required
from ..odoo.vendor_dashboard import vendor_dashboard_service
from ..utils.response import error, success


class VendorDashboardBase(MethodView):
    decorators = [jwt_required]

    def __init__(self, service):
        self._service = service

    @staticmethod
    def _uid() -> int:
        return int(request.jwt_payload.get("uid"))

    @staticmethod
    def _is_model_missing(exc: Exception) -> bool:
        if not isinstance(exc, Fault):
            return False
        msg = str(exc).lower()
        return "catalog" in msg and ("does not exist" in msg or "invalid" in msg or "model" in msg)

    @staticmethod
    def _model_missing_response():
        return error(
            "Required Odoo models are missing. Install/update the custom module 'Catalogix Digital' in Odoo Apps.",
            503,
        )


class VendorDashboardAPI(VendorDashboardBase):
    def get(self):
        period = request.args.get("period")
        try:
            data = self._service.build_dashboard(self._uid(), period=period)
            return success(data)
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)


bp = Blueprint("vendor_dashboard", __name__)
bp.add_url_rule("", view_func=VendorDashboardAPI.as_view("vendor_dashboard", service=vendor_dashboard_service))
