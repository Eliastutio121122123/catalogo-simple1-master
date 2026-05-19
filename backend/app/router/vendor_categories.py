"""
REST router for vendor category CRUD.
Endpoints:
  GET    /api/vendor/categories          → list all
  POST   /api/vendor/categories          → create
  PUT    /api/vendor/categories/<id>     → update
  DELETE /api/vendor/categories/<id>     → delete
"""
from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.categories import CategoryService
from ..utils.response import error, success
from ..utils.validators import require_fields

bp = Blueprint("vendor_categories", __name__)


class CategoryListAPI(MethodView):
    decorators = [jwt_required]

    def get(self):
        try:
            return success(CategoryService.list_all())
        except Exception as exc:
            return error(str(exc), 500)

    def post(self):
        data = request.get_json() or {}
        err = require_fields(data, ["name"])
        if err:
            return error(err, 400)
        try:
            cat = CategoryService.create(
                name=data["name"],
                parent_id=data.get("parentId") or None,
            )
            return success(cat, 201)
        except ValueError as exc:
            return error(str(exc), 400)
        except Exception as exc:
            return error(str(exc), 500)


class CategoryDetailAPI(MethodView):
    decorators = [jwt_required]

    def put(self, category_id: int):
        data = request.get_json() or {}
        err = require_fields(data, ["name"])
        if err:
            return error(err, 400)
        try:
            cat = CategoryService.update(
                category_id=category_id,
                name=data["name"],
                parent_id=data.get("parentId") or None,
            )
            return success(cat)
        except ValueError as exc:
            return error(str(exc), 400)
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

    def delete(self, category_id: int):
        try:
            CategoryService.delete(category_id)
            return success({"message": "Categoría eliminada"})
        except ValueError as exc:
            return error(str(exc), 400)
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)


bp.add_url_rule("", view_func=CategoryListAPI.as_view("vendor_categories"))
bp.add_url_rule("/<int:category_id>", view_func=CategoryDetailAPI.as_view("vendor_category_detail"))
