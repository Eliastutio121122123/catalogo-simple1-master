from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.catalogs import CatalogService
from ..odoo.orders import (
    create_order,
    create_or_update_cart,
    get_draft_cart_by_partner,
    get_order_by_id,
    get_orders_by_partner,
)
from ..odoo.products import get_product_by_id, get_products, search_products
from ..odoo.storefront import get_storefront_stats, list_popular_categories
from ..odoo.store_coupons import CouponError, store_coupon_service
from ..odoo.store_promotions import store_promotion_service
from ..odoo.users import UserService
from ..utils.response import error, success
from ..utils.validators import require_fields

bp = Blueprint("store", __name__)


class StoreBase(MethodView):
    @staticmethod
    def _current_partner_id() -> int | None:
        payload = getattr(request, "jwt_payload", {}) or {}
        partner_id = payload.get("partner_id")
        if partner_id:
            return int(partner_id)
        uid = payload.get("uid")
        if not uid:
            return None
        return UserService.resolve_partner_id(int(uid))

    @staticmethod
    def _parse_lines(lines: list) -> list:
        parsed = []
        for line in lines:
            product_id = int(line.get("product_id") or 0)
            qty = float(line.get("qty") or 0)
            price = float(line.get("price") or 0)
            if product_id <= 0 or qty <= 0:
                raise ValueError("Each line must include product_id and qty > 0")
            parsed.append({"product_id": product_id, "qty": qty, "price": price})
        return parsed


class StoreProductsAPI(StoreBase):
    def get(self):
        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))
        query = (request.args.get("q") or "").strip()
        filters = {
            "category": request.args.get("category"),
            "min_price": request.args.get("min_price"),
            "max_price": request.args.get("max_price"),
        }
        try:
            if query or any(filters.values()):
                return success(search_products(query, filters, limit, offset))
            return success(get_products(limit=limit, offset=offset))
        except Exception as exc:
            return error(str(exc), 500)


class StoreProductDetailAPI(StoreBase):
    def get(self, product_id: int):
        try:
            return success(get_product_by_id(product_id))
        except LookupError as exc:
            return error(str(exc), 404)


class StoreCatalogsAPI(StoreBase):
    def get(self):
        limit = int(request.args.get("limit", 20))
        offset = int(request.args.get("offset", 0))
        try:
            return success(CatalogService.list_public(limit=limit, offset=offset))
        except Exception as exc:
            return error(str(exc), 500)


class StoreCatalogDetailAPI(StoreBase):
    def get(self, slug: str):
        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))
        try:
            catalog = CatalogService.get_public_by_slug(slug)
            products = CatalogService.list_products(catalog["id"], limit=limit, offset=offset)
            return success({"catalog": catalog, "products": products})
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)


class StoreCartAPI(StoreBase):
    decorators = [jwt_required]

    def get(self):
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)
        try:
            cart = get_draft_cart_by_partner(partner_id)
            return success({"cart": cart})
        except Exception as exc:
            return error(str(exc), 500)

    def post(self):
        data = request.get_json() or {}
        err = require_fields(data, ["lines"])
        if err:
            return error(err, 400)
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)
        try:
            lines = self._parse_lines(data["lines"])
            cart_id = data.get("cart_id")
            order_id = create_or_update_cart(partner_id, lines, int(cart_id) if cart_id else None)
            return success({"cart_id": order_id})
        except Exception as exc:
            return error(str(exc), 500)


class StoreOrdersAPI(StoreBase):
    decorators = [jwt_required]

    def get(self):
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)
        try:
            return success(get_orders_by_partner(partner_id))
        except Exception as exc:
            return error(str(exc), 500)

    def post(self):
        data = request.get_json() or {}
        err = require_fields(data, ["lines"])
        if err:
            return error(err, 400)
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)
        try:
            lines = self._parse_lines(data["lines"])
            order_id = create_order(partner_id, lines)
            return success({"order_id": order_id}, 201)
        except Exception as exc:
            return error(str(exc), 500)


class StoreOrderDetailAPI(StoreBase):
    decorators = [jwt_required]

    def get(self, order_id: int):
        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)
        try:
            order = get_order_by_id(order_id)
            order_partner = order.get("partner_id") or []
            if not order_partner or int(order_partner[0]) != int(partner_id):
                return error("Not authorized for this order", 403)
            return success(order)
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)


class StoreHomeAPI(StoreBase):
    def get(self):
        limit_catalogs = int(request.args.get("limit_catalogs", 8))
        limit_products = int(request.args.get("limit_products", 12))
        try:
            stats = get_storefront_stats()
        except Exception:
            stats = {"products": 0, "catalogs": 0, "vendors": 0}
        try:
            categories = list_popular_categories(limit=8)
        except Exception:
            categories = []
        try:
            catalogs = CatalogService.list_public(limit=limit_catalogs, offset=0)
        except Exception:
            catalogs = []
        try:
            products = get_products(limit=limit_products, offset=0)
        except Exception:
            products = []
        return success({
            "stats": stats,
            "categories": categories,
            "catalogs": catalogs,
            "products": products,
        })


class StorePromotionsQuoteAPI(StoreBase):
    decorators = [jwt_required]

    def post(self):
        data = request.get_json() or {}
        err = require_fields(data, ["lines"])
        if err:
            return error(err, 400)
        try:
            lines = self._parse_lines(data["lines"])
            quote = store_promotion_service.quote(lines=lines)
            return success(quote)
        except ValueError as exc:
            return error(str(exc), 400)
        except Exception as exc:
            return error(str(exc), 500)


class StoreCouponValidateAPI(StoreBase):
    """POST /store/coupons/validate — validate a coupon code against the cart lines."""
    decorators = [jwt_required]

    def post(self):
        data = request.get_json() or {}
        code = (data.get("code") or "").strip()
        lines_raw = data.get("lines") or []

        if not code:
            return error("El campo 'code' es requerido", 400)

        partner_id = self._current_partner_id()
        if not partner_id:
            return error("No partner linked to this user", 400)

        try:
            lines = self._parse_lines(lines_raw) if lines_raw else []
            quote = store_coupon_service.quote(
                partner_id=partner_id,
                code=code,
                lines=lines,
            )
            return success({
                "coupon_id":           quote.coupon_id,
                "code":                quote.code,
                "description":         quote.description,
                "discount_type":       quote.discount_type,
                "value":               quote.value,
                "discount_amount":     quote.discount_amount,
                "subtotal":            quote.subtotal,
                "eligible_subtotal":   quote.eligible_subtotal,
                "min_order_amount":    quote.min_order_amount,
                "max_discount_amount": quote.max_discount_amount,
                "expires_at":          quote.expires_at,
                "status":              quote.status,
            })
        except CouponError as exc:
            return error(str(exc), 422)
        except ValueError as exc:
            return error(str(exc), 400)
        except Exception as exc:
            return error(str(exc), 500)


# ── URL rules ──────────────────────────────────────────────────────────────────
bp.add_url_rule("/home",     view_func=StoreHomeAPI.as_view("store_home"))
bp.add_url_rule("/products", view_func=StoreProductsAPI.as_view("store_products"))
bp.add_url_rule(
    "/products/<int:product_id>",
    view_func=StoreProductDetailAPI.as_view("store_product_detail"),
)
bp.add_url_rule("/catalogs", view_func=StoreCatalogsAPI.as_view("store_catalogs"))
bp.add_url_rule(
    "/catalogs/<string:slug>",
    view_func=StoreCatalogDetailAPI.as_view("store_catalog_detail"),
)
bp.add_url_rule("/cart",   view_func=StoreCartAPI.as_view("store_cart"))
bp.add_url_rule("/orders", view_func=StoreOrdersAPI.as_view("store_orders"))
bp.add_url_rule(
    "/orders/<int:order_id>",
    view_func=StoreOrderDetailAPI.as_view("store_order_detail"),
)
bp.add_url_rule("/promotions/quote",  view_func=StorePromotionsQuoteAPI.as_view("store_promotions_quote"))
bp.add_url_rule("/coupons/validate",  view_func=StoreCouponValidateAPI.as_view("store_coupons_validate"))
