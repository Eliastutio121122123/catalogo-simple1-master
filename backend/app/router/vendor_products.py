from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.users import UserService
from ..odoo.vendor_products import VendorProductService
from ..utils.response import error, success
from ..utils.validators import require_fields

bp = Blueprint("vendor_products", __name__)


class VendorProductsBase(MethodView):
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


class VendorProductsListAPI(VendorProductsBase):
    def get(self):
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)

        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))
        try:
            rows = VendorProductService.list_vendor_products(partner_id, limit=limit, offset=offset)
            return success(rows)
        except Exception as exc:
            return error(str(exc), 500)

    def post(self):
        auth_header = request.headers.get("Authorization", "")
        has_token = auth_header.startswith("Bearer ")
        partner_id = self._current_partner_id()
        if not partner_id:
            from flask import current_app
            current_app.logger.warning(
                "vendor_products.post: no partner_id (has_token=%s, uid=%s)",
                has_token,
                (getattr(request, "jwt_payload", {}) or {}).get("uid"),
            )
            return error("No partner linked to this user", 400)

        data = request.get_json() or {}
        err = require_fields(data, ["name"])
        if err:
            return error(err, 400)

        try:
            product = VendorProductService.create_vendor_product(partner_id, data)
            return success(product, 201)
        except ValueError as exc:
            return error(str(exc), 400)
        except Exception as exc:
            from flask import current_app
            current_app.logger.exception(
                "vendor_products.post failed (partner_id=%s, keys=%s)",
                partner_id,
                list(data.keys()),
            )
            return error(str(exc), 500)


class VendorProductDetailAPI(VendorProductsBase):
    def get(self, product_id: int):
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)
        try:
            return success(VendorProductService.get_vendor_product(partner_id, product_id))
        except LookupError as exc:
            return error(str(exc), 404)
        except PermissionError as exc:
            return error(str(exc), 403)
        except Exception as exc:
            return error(str(exc), 500)

    def put(self, product_id: int):
        return self._update(product_id, request.get_json() or {})

    def patch(self, product_id: int):
        return self._update(product_id, request.get_json() or {})

    def _update(self, product_id: int, data: dict):
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)
        try:
            product = VendorProductService.update_vendor_product(partner_id, product_id, data)
            return success(product)
        except ValueError as exc:
            return error(str(exc), 400)
        except LookupError as exc:
            return error(str(exc), 404)
        except PermissionError as exc:
            return error(str(exc), 403)
        except Exception as exc:
            return error(str(exc), 500)

    def delete(self, product_id: int):
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)
        try:
            VendorProductService.delete_vendor_product(partner_id, product_id)
            return success({"message": "Product deleted"})
        except LookupError as exc:
            return error(str(exc), 404)
        except PermissionError as exc:
            return error(str(exc), 403)
        except Exception as exc:
            return error(str(exc), 500)


bp.add_url_rule("", view_func=VendorProductsListAPI.as_view("vendor_products"))
bp.add_url_rule("/<int:product_id>", view_func=VendorProductDetailAPI.as_view("vendor_product_detail"))
