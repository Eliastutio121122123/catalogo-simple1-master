from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.users import get_user_by_id, update_user
from ..utils.response import error, success

bp = Blueprint("users", __name__)


class UserMeAPI(MethodView):
    decorators = [jwt_required]

    def get(self):
        payload = getattr(request, "jwt_payload", None) or {}
        uid = payload.get("uid")
        if not uid:
            return error("Missing or invalid token", 401)
        try:
            return success(get_user_by_id(uid))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

    def put(self):
        payload = getattr(request, "jwt_payload", None) or {}
        uid = payload.get("uid")
        if not uid:
            return error("Missing or invalid token", 401)
        data = request.get_json() or {}
        try:
            update_user(uid, data)
            return success({"message": "Profile updated"})
        except Exception as exc:
            return error(str(exc), 500)


bp.add_url_rule("/me", view_func=UserMeAPI.as_view("user_me"))
