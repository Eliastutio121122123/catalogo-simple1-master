from flask import Blueprint, request
from flask.views import MethodView
from xmlrpc.client import Fault

from ..middleware.auth_guard import jwt_required
from ..odoo.admin_catalogs import admin_catalog_service
from ..utils.response import error, success


class AdminCatalogsBase(MethodView):
    decorators = [jwt_required]

    def __init__(self, service):
        self._service = service

    @staticmethod
    def _is_model_missing(exc: Exception) -> bool:
        if not isinstance(exc, Fault):
            return False
        msg = str(exc).lower()
        return "catalog.catalog" in msg and ("does not exist" in msg or "invalid" in msg or "model" in msg)


class AdminCatalogsAPI(AdminCatalogsBase):
    def get(self):
        try:
            payload = self._service.list_catalogs(
                q=request.args.get("q"),
                status=request.args.get("status"),
                visibility=request.args.get("visibility"),
                limit=int(request.args.get("limit", 200)),
                offset=int(request.args.get("offset", 0)),
            )
            return success(payload)
        except Exception as exc:
            if self._is_model_missing(exc):
                return error("Odoo model catalog.catalog missing.", 503)
            return error(str(exc), 500)


class AdminCatalogDetailAPI(AdminCatalogsBase):
    """GET  /api/admin/catalogs/<int:catalog_id>  — retrieve single catalog
       PUT  /api/admin/catalogs/<int:catalog_id>  — update editable fields
    """

    def get(self, catalog_id: int):
        try:
            catalog = self._service.get_catalog(catalog_id)
            if not catalog:
                return error("Catalogo no encontrado.", 404)
            return success(catalog)
        except Exception as exc:
            if self._is_model_missing(exc):
                return error("Odoo model catalog.catalog missing.", 503)
            return error(str(exc), 500)

    def put(self, catalog_id: int):
        try:
            data = request.get_json(force=True, silent=True) or {}
            updated = self._service.update_catalog(catalog_id, data)
            if not updated:
                return error("Catalogo no encontrado.", 404)
            return success(updated)
        except Exception as exc:
            if self._is_model_missing(exc):
                return error("Odoo model catalog.catalog missing.", 503)
            return error(str(exc), 500)


bp = Blueprint("admin_catalogs", __name__)
bp.add_url_rule(
    "",
    view_func=AdminCatalogsAPI.as_view("admin_catalogs", service=admin_catalog_service),
)
bp.add_url_rule(
    "/<int:catalog_id>",
    view_func=AdminCatalogDetailAPI.as_view(
        "admin_catalog_detail", service=admin_catalog_service
    ),
)
