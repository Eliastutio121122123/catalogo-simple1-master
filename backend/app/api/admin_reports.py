from flask import Blueprint
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.admin_reports import admin_report_service
from ..utils.response import error, success


class AdminReportsAPI(MethodView):
    decorators = [jwt_required]

    def __init__(self, service):
        self._service = service

    def get(self):
        try:
            items = self._service.list_reports()
            return success(items)
        except Exception as exc:
            return error(str(exc), 500)


bp = Blueprint("admin_reports", __name__)
bp.add_url_rule("", view_func=AdminReportsAPI.as_view("admin_reports", service=admin_report_service))

