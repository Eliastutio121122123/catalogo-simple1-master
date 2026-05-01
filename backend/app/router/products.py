from flask import Blueprint, request
from flask.views import MethodView

from ..odoo.products import ProductService
from ..utils.response import error, success

bp = Blueprint("products", __name__)


class ProductsBase(MethodView):
    @staticmethod
    def _filters_from_request() -> dict:
        return {
            "category": request.args.get("category"),
            "min_price": request.args.get("min_price"),
            "max_price": request.args.get("max_price"),
        }


class ProductsListAPI(ProductsBase):
    def get(self):
        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))
        try:
            products = ProductService.list_products(limit=limit, offset=offset)
            return success(products)
        except Exception as exc:
            return error(str(exc), 500)


class ProductsSearchAPI(ProductsBase):
    def get(self):
        query = request.args.get("q", "")
        filters = self._filters_from_request()
        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))
        try:
            return success(ProductService.search(query, filters, limit, offset))
        except Exception as exc:
            return error(str(exc), 500)


class ProductDetailAPI(ProductsBase):
    def get(self, product_id: int):
        try:
            return success(ProductService.get_by_id(product_id))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)


bp.add_url_rule("", view_func=ProductsListAPI.as_view("products_list"), strict_slashes=False)
bp.add_url_rule("/search", view_func=ProductsSearchAPI.as_view("products_search"))
bp.add_url_rule("/<int:product_id>", view_func=ProductDetailAPI.as_view("product_detail"))
