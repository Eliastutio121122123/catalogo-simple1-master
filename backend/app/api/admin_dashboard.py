from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.admin_dashboard import admin_dashboard_service
from ..utils.response import error, success


class AdminDashboardAPI(MethodView):
    decorators = [jwt_required]

    def __init__(self, service):
        self._service = service

    def get(self):
        try:
            range_key = request.args.get("range", "7d")
            payload = self._service.summary(range_key=range_key)
            return success(payload)
        except Exception as exc:
            return error(str(exc), 500)


bp = Blueprint("admin_dashboard", __name__)
bp.add_url_rule("", view_func=AdminDashboardAPI.as_view("admin_dashboard", service=admin_dashboard_service))
