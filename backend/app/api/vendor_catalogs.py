from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.catalogs import CatalogService
from ..odoo.users import UserService
from ..utils.response import error, success
from ..utils.validators import require_fields

bp = Blueprint("vendor_catalogs", __name__)


class VendorCatalogBase(MethodView):
    decorators = [jwt_required]

    @staticmethod
    def _current_partner_id() -> int | None:
        payload = getattr(request, "jwt_payload", {}) or {}
        partner_id = payload.get("partner_id")
        if partner_id:
            return int(partner_id)
        uid = payload.get("uid")
        if not uid:
            return None
        return UserService.resolve_vendor_partner_id(int(uid))

    @staticmethod
    def _status_to_active(status: str | None) -> bool | None:
        if status is None:
            return None
        normalized = str(status).strip().lower()
        if normalized == "active":
            return True
        if normalized in {"inactive", "draft"}:
            return False
        return None


class VendorCatalogListAPI(VendorCatalogBase):
    def get(self):
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)

        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))
        try:
            catalogs = CatalogService.list_by_vendor(partner_id, limit=limit, offset=offset)
            return success(catalogs)
        except Exception as exc:
            return error(str(exc), 500)

    def post(self):
        data = request.get_json() or {}
        err = require_fields(data, ["name", "description"])
        if err:
            return error(err, 400)

        partner_id = self._current_partner_id()
        if not partner_id:
            from flask import current_app
            auth_header = request.headers.get("Authorization", "")
            current_app.logger.warning(
                "vendor_catalogs.post: no partner_id (has_token=%s, uid=%s)",
                auth_header.startswith("Bearer "),
                (getattr(request, "jwt_payload", {}) or {}).get("uid"),
            )
            return error("No partner linked to this user", 400)

        status = data.get("status")
        active = self._status_to_active(status)
        values = {
            "name": str(data.get("name") or "").strip(),
            "description": str(data.get("description") or "").strip(),
            "image_url": str(data.get("image_url") or "").strip(),
        }
        if "image_base64" in data:
            values["image_base64"] = data.get("image_base64")
        if "image_1920" in data:
            values["image_1920"] = data.get("image_1920")
        if active is not None:
            values["active"] = active

        try:
            catalog_id = CatalogService.create_vendor_catalog(partner_id, values)
            product_ids = data.get("product_ids") or data.get("selectedProducts") or []
            if isinstance(product_ids, list) and product_ids:
                CatalogService.set_catalog_products(catalog_id, product_ids, replace=True)
            catalog = CatalogService.get_vendor_catalog(partner_id, catalog_id)
            return success(catalog, 201)
        except Exception as exc:
            from flask import current_app
            current_app.logger.exception(
                "vendor_catalogs.post failed (partner_id=%s, keys=%s)",
                partner_id,
                list(data.keys()),
            )
            return error(str(exc), 500)


class VendorCatalogDetailAPI(VendorCatalogBase):
    def get(self, catalog_id: int):
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)
        try:
            return success(CatalogService.get_vendor_catalog(partner_id, catalog_id))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

    def put(self, catalog_id: int):
        data = request.get_json() or {}
        err = require_fields(data, ["name", "description"])
        if err:
            return error(err, 400)
        return self._update(catalog_id, data)

    def patch(self, catalog_id: int):
        data = request.get_json() or {}
        return self._update(catalog_id, data)

    def _update(self, catalog_id: int, data: dict):
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)

        status = data.get("status")
        active = self._status_to_active(status)
        values = {}
        for key in ("name", "description", "image_url"):
            if key in data:
                values[key] = data.get(key)
        if "image_base64" in data:
            values["image_base64"] = data.get("image_base64")
        if "image_1920" in data:
            values["image_1920"] = data.get("image_1920")
        if active is not None:
            values["active"] = active

        try:
            CatalogService.update_vendor_catalog(partner_id, catalog_id, values)
            product_ids = data.get("product_ids") or data.get("selectedProducts")
            if isinstance(product_ids, list):
                # Avoid wiping products if the client sends an empty list unintentionally.
                if product_ids or data.get("replace_products"):
                    CatalogService.set_catalog_products(catalog_id, product_ids, replace=True)
            catalog = CatalogService.get_vendor_catalog(partner_id, catalog_id)
            return success(catalog)
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

    def delete(self, catalog_id: int):
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)
        try:
            CatalogService.delete_vendor_catalog(partner_id, catalog_id)
            return success({"message": "Catalog deleted"})
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)


bp.add_url_rule("", view_func=VendorCatalogListAPI.as_view("vendor_catalogs"))
bp.add_url_rule("/<int:catalog_id>", view_func=VendorCatalogDetailAPI.as_view("vendor_catalog_detail"))
