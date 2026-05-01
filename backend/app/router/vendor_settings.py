from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.vendor_settings import get_vendor_settings, update_vendor_settings
from ..utils.response import error, success

bp = Blueprint("vendor_settings", __name__)


class VendorSettingsAPI(MethodView):
    decorators = [jwt_required]

    def _uid(self):
        payload = getattr(request, "jwt_payload", None) or {}
        uid = payload.get("uid")
        return int(uid) if uid else None

    def get(self):
        uid = self._uid()
        if not uid:
            return error("Missing or invalid token", 401)
        try:
            return success(get_vendor_settings(uid))
        except Exception as exc:
            return error(str(exc), 500)

    def put(self):
        uid = self._uid()
        if not uid:
            return error("Missing or invalid token", 401)
        data = request.get_json() or {}
        try:
            updated = update_vendor_settings(uid, data)
            return success(updated)
        except Exception as exc:
            return error(str(exc), 500)

    def patch(self):
        return self.put()


bp.add_url_rule("", view_func=VendorSettingsAPI.as_view("vendor_settings"))
