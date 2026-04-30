from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.admin_settings import get_settings, update_settings
from ..utils.response import error, success

bp = Blueprint("admin_settings", __name__)


class AdminSettingsAPI(MethodView):
    decorators = [jwt_required]

    def get(self):
        try:
            return success(get_settings())
        except Exception as exc:
            return error(str(exc), 500)

    def put(self):
        data = request.get_json() or {}
        try:
            updated = update_settings(data)
            return success(updated)
        except Exception as exc:
            return error(str(exc), 500)

    # Allow PATCH as alias for PUT (partial update works the same way)
    def patch(self):
        return self.put()


bp.add_url_rule("", view_func=AdminSettingsAPI.as_view("admin_settings"))
