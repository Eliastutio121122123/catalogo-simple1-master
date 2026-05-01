from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.vendor_profile import get_vendor_profile, update_vendor_profile
from ..utils.response import error, success

bp = Blueprint("vendor_profile", __name__)


class VendorProfileAPI(MethodView):
    decorators = [jwt_required]

    def get(self):
        payload = getattr(request, "jwt_payload", None) or {}
        uid = payload.get("uid")
        if not uid:
            return error("Missing or invalid token", 401)
        try:
            return success(get_vendor_profile(int(uid)))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

    def patch(self):
        payload = getattr(request, "jwt_payload", None) or {}
        uid = payload.get("uid")
        if not uid:
            return error("Missing or invalid token", 401)
        data = request.get_json() or {}
        try:
            return success(update_vendor_profile(int(uid), data))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

    def put(self):
        return self.patch()


bp.add_url_rule("", view_func=VendorProfileAPI.as_view("vendor_profile"))
