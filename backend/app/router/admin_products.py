from flask import Blueprint, request
from flask.views import MethodView
from xmlrpc.client import Fault

from ..middleware.auth_guard import jwt_required
from ..odoo.admin_products import admin_product_service
from ..utils.response import error, success
from ..utils.audit_writer import log_event


class AdminProductsBase(MethodView):
    decorators = [jwt_required]

    def __init__(self, service):
        self._service = service

    @staticmethod
    def _is_model_missing(exc: Exception) -> bool:
        if not isinstance(exc, Fault):
            return False
        msg = str(exc).lower()
        return "product.template" in msg and (
            "does not exist" in msg or "invalid" in msg or "model" in msg
        )


class AdminProductsAPI(AdminProductsBase):
    def get(self):
        try:
            payload = self._service.list_products(
                q=request.args.get("q"),
                status=request.args.get("status"),
                limit=int(request.args.get("limit", 200)),
                offset=int(request.args.get("offset", 0)),
            )
            return success(payload)
        except Exception as exc:
            if self._is_model_missing(exc):
                return error("Odoo model product.template missing.", 503)
            return error(str(exc), 500)


class AdminProductDetailAPI(AdminProductsBase):
    """GET  /api/admin/products/<int:product_id>  — retrieve single product
       PUT  /api/admin/products/<int:product_id>  — update editable fields
    """

    def get(self, product_id: int):
        try:
            product = self._service.get_product(product_id)
            if not product:
                return error("Producto no encontrado.", 404)
            return success(product)
        except Exception as exc:
            if self._is_model_missing(exc):
                return error("Odoo model product.template missing.", 503)
            return error(str(exc), 500)

    def put(self, product_id: int):
        uid = getattr(request, "jwt_payload", {}).get("uid", "unknown")
        try:
            data = request.get_json(force=True, silent=True) or {}
            updated = self._service.update_product(product_id, data)
            if not updated:
                return error("Producto no encontrado.", 404)
            log_event(
                "ADMIN_PRODUCT_UPDATED",
                target=f"product:{product_id}",
                actor_name=f"uid:{uid}",
                actor_role="admin",
                severity="medium",
                status="ok",
            )
            return success(updated)
        except Exception as exc:
            if self._is_model_missing(exc):
                return error("Odoo model product.template missing.", 503)
            log_event(
                "ADMIN_PRODUCT_UPDATE_FAILED",
                target=f"product:{product_id}",
                actor_name=f"uid:{uid}",
                actor_role="admin",
                severity="high",
                status="warn",
            )
            return error(str(exc), 500)


bp = Blueprint("admin_products", __name__)
bp.add_url_rule(
    "",
    view_func=AdminProductsAPI.as_view("admin_products", service=admin_product_service),
)
bp.add_url_rule(
    "/<int:product_id>",
    view_func=AdminProductDetailAPI.as_view(
        "admin_product_detail", service=admin_product_service
    ),
)
