from flask import Blueprint, request
from flask.views import MethodView
from xmlrpc.client import Fault

from ..middleware.auth_guard import jwt_required
from ..odoo.admin_users import admin_user_service
from ..utils.response import error, success


class AdminUsersBase(MethodView):
    decorators = [jwt_required]

    def __init__(self, service):
        self._service = service

    @staticmethod
    def _is_model_missing(exc: Exception) -> bool:
        if not isinstance(exc, Fault):
            return False
        msg = str(exc).lower()
        return "res.users" in msg and ("does not exist" in msg or "invalid" in msg or "model" in msg)


class AdminUsersAPI(AdminUsersBase):
    def get(self):
        try:
            payload = self._service.list_users(
                q=request.args.get("q"),
                role=request.args.get("role"),
                status=request.args.get("status"),
                limit=int(request.args.get("limit", 200)),
                offset=int(request.args.get("offset", 0)),
            )
            return success(payload)
        except Exception as exc:
            if self._is_model_missing(exc):
                return error("Odoo model res.users missing.", 503)
            return error(str(exc), 500)


bp = Blueprint("admin_users", __name__)
bp.add_url_rule("", view_func=AdminUsersAPI.as_view("admin_users", service=admin_user_service))
