from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.vendor_reports import vendor_report_service
from ..utils.response import error, success

bp = Blueprint("vendor_reports", __name__)


class VendorReportsAPI(MethodView):
    decorators = [jwt_required]

    def get(self):
        payload = getattr(request, "jwt_payload", {}) or {}
        uid = payload.get("uid")
        if not uid:
            return error("Invalid token", 401)

        range_key = request.args.get("range") or request.args.get("period") or "7d"
        start = request.args.get("start")
        end = request.args.get("end")
        try:
            data = vendor_report_service.build_report(int(uid), range_key=range_key, start=start, end=end)
            return success(data)
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)


bp.add_url_rule("", view_func=VendorReportsAPI.as_view("vendor_reports"))
