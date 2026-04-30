from odoo import http
from odoo.http import request

from .api_base import error, ok


CATALOG_FIELDS = ["id", "name", "description", "image_url", "image_1920", "vendor_id", "active"]
PRODUCT_FIELDS = ["id", "name", "list_price", "description", "image_1920", "categ_id", "qty_available", "catalog_id"]


def _attach_image(row: dict) -> dict:
    out = dict(row or {})
    image_1920 = out.get("image_1920")
    if image_1920 and not out.get("image_url"):
        if isinstance(image_1920, str) and not image_1920.isdigit():
            out["image_url"] = f"data:image/*;base64,{image_1920}"
    return out


class CatalogixCatalogsController(http.Controller):
    @http.route("/api/catalogs", type="http", auth="none", csrf=False, cors="*")
    def list_catalogs(self, **kwargs):
        try:
            limit = int(request.httprequest.args.get("limit", 20))
            offset = int(request.httprequest.args.get("offset", 0))
        except Exception:
            limit, offset = 20, 0

        try:
            rows = (
                request.env["catalog.catalog"]
                .sudo()
                .search_read([("active", "=", True)], CATALOG_FIELDS, limit=limit, offset=offset)
            )
            return ok([_attach_image(row) for row in rows])
        except Exception as exc:
            return error(str(exc), 500)

    @http.route("/api/catalogs/<int:catalog_id>", type="http", auth="none", csrf=False, cors="*")
    def get_catalog(self, catalog_id, **kwargs):
        rows = (
            request.env["catalog.catalog"]
            .sudo()
            .search_read([("id", "=", int(catalog_id))], CATALOG_FIELDS, limit=1)
        )
        if not rows:
            return error(f"Catalog {catalog_id} not found", 404)
        return ok(_attach_image(rows[0]))

    @http.route("/api/catalogs/<int:catalog_id>/products", type="http", auth="none", csrf=False, cors="*")
    def catalog_products(self, catalog_id, **kwargs):
        try:
            limit = int(request.httprequest.args.get("limit", 50))
            offset = int(request.httprequest.args.get("offset", 0))
        except Exception:
            limit, offset = 50, 0

        try:
            rows = (
                request.env["product.template"]
                .sudo()
                .search_read([("catalog_id", "=", int(catalog_id))], PRODUCT_FIELDS, limit=limit, offset=offset)
            )
            return ok([_attach_image(row) for row in rows])
        except Exception as exc:
            return error(str(exc), 500)
