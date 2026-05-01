from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.customers import VendorCustomerService
from ..odoo.users import UserService
from ..utils.response import error, success

bp = Blueprint("vendor_customers", __name__)


class VendorCustomersBase(MethodView):
    decorators = [jwt_required]

    @staticmethod
    def _current_partner_id() -> int | None:
        payload = getattr(request, "jwt_payload", {}) or {}
        uid = payload.get("uid")
        if uid:
            vendor_partner_id = UserService.resolve_vendor_partner_id(int(uid))
            if vendor_partner_id:
                return int(vendor_partner_id)
        partner_id = payload.get("partner_id")
        if partner_id:
            return int(partner_id)
        return None


class VendorCustomersListAPI(VendorCustomersBase):
    def get(self):
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)

        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))
        search = request.args.get("q")
        try:
            customers = VendorCustomerService.list_vendor_customers(
                partner_id,
                limit=limit,
                offset=offset,
                search=search,
            )
            return success(customers)
        except Exception as exc:
            return error(str(exc), 500)


class VendorCustomerDetailAPI(VendorCustomersBase):
    def get(self, customer_id: int):
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)
        try:
            return success(VendorCustomerService.get_vendor_customer(partner_id, customer_id))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)


bp.add_url_rule("", view_func=VendorCustomersListAPI.as_view("vendor_customers"))
bp.add_url_rule("/<int:customer_id>", view_func=VendorCustomerDetailAPI.as_view("vendor_customer_detail"))
