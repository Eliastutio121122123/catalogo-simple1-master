from flask import Blueprint, request
from ..odoo.catalogs import get_catalogs, get_catalog_by_id, get_products_by_catalog
from ..utils.response import success, error

bp = Blueprint("catalogs", __name__)


@bp.get("/")
def list_catalogs():
    limit  = int(request.args.get("limit", 20))
    offset = int(request.args.get("offset", 0))
    try:
        return success(get_catalogs(limit, offset))
    except Exception as e:
        return error(str(e), 500)


@bp.get("/<int:catalog_id>")
def get_catalog(catalog_id):
    try:
        return success(get_catalog_by_id(catalog_id))
    except LookupError as e:
        return error(str(e), 404)


@bp.get("/<int:catalog_id>/products")
def catalog_products(catalog_id):
    limit  = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    try:
        return success(get_products_by_catalog(catalog_id, limit, offset))
    except Exception as e:
        return error(str(e), 500)
