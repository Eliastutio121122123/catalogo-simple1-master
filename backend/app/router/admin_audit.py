from flask import Blueprint, request
from flask.views import MethodView
from xmlrpc.client import Fault

from ..middleware.auth_guard import jwt_required
from ..odoo.audit import audit_log_service
from ..utils.response import error, success


class AdminAuditBase(MethodView):
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
        return "catalog.audit.log" in msg and ("does not exist" in msg or "invalid" in msg or "model" in msg)

    @staticmethod
    def _model_missing_response():
        return error(
            "Odoo model catalog.audit.log is missing. Install/update the custom module 'Catalogix Digital' in Odoo Apps.",
            503,
        )


class AdminAuditAPI(AdminAuditBase):
    def get(self):
        try:
            payload = self._service.list_logs(
                q=request.args.get("q"),
                action=request.args.get("action"),
                actor=request.args.get("actor"),
                severity=request.args.get("severity"),
                range_key=request.args.get("range"),
                limit=int(request.args.get("limit", 200)),
                offset=int(request.args.get("offset", 0)),
            )
            return success(payload)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)

    def post(self):
        data = request.get_json() or {}
        try:
            created = self._service.create_log(data, actor_uid=self._uid())
            return success(created, 201)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)


bp = Blueprint("admin_audit", __name__)
bp.add_url_rule("", view_func=AdminAuditAPI.as_view("admin_audit", service=audit_log_service))
