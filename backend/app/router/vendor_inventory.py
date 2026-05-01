from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.inventory import (
    adjust_vendor_stock,
    list_inventory_movements,
    list_vendor_inventory,
)
from ..odoo.users import UserService
from ..utils.response import error, success

bp = Blueprint("vendor_inventory", __name__)


class VendorInventoryBase(MethodView):
    decorators = [jwt_required]

    def _partner_id(self):
        payload = getattr(request, "jwt_payload", None) or {}
        uid = payload.get("uid")
        if not uid:
            return None, None
        return int(uid), UserService.resolve_vendor_partner_id(int(uid))


class VendorInventoryListAPI(VendorInventoryBase):
    def get(self):
        uid, partner_id = self._partner_id()
        if not uid or not partner_id:
            return error("Missing or invalid token", 401)
        limit = int(request.args.get("limit") or 200)
        offset = int(request.args.get("offset") or 0)
        q = request.args.get("q") or ""
        try:
            rows = list_vendor_inventory(partner_id, limit=limit, offset=offset, q=q)
            return success(rows)
        except Exception as exc:
            return error(str(exc), 500)


class VendorInventoryMovementsAPI(VendorInventoryBase):
    def get(self):
        uid, partner_id = self._partner_id()
        if not uid or not partner_id:
            return error("Missing or invalid token", 401)
        limit = int(request.args.get("limit") or 200)
        offset = int(request.args.get("offset") or 0)
        try:
            rows = list_inventory_movements(partner_id, limit=limit, offset=offset)
            return success(rows)
        except Exception as exc:
            return error(str(exc), 500)

    def post(self):
        uid, partner_id = self._partner_id()
        if not uid or not partner_id:
            return error("Missing or invalid token", 401)
        data = request.get_json() or {}
        try:
            movement = adjust_vendor_stock(uid, partner_id, data)
            return success(movement, 201)
        except ValueError as exc:
            return error(str(exc), 400)
        except Exception as exc:
            return error(str(exc), 500)


bp.add_url_rule("", view_func=VendorInventoryListAPI.as_view("vendor_inventory"))
bp.add_url_rule("/movements", view_func=VendorInventoryMovementsAPI.as_view("vendor_inventory_movements"))
