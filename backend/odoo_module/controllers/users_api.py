from odoo import http
from odoo.http import request

from .api_base import error, get_json, ok, require_jwt, serialize_user


class CatalogixUsersController(http.Controller):
    @http.route("/api/users/me", type="http", auth="none", csrf=False, cors="*")
    def me(self, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        user = request.env["res.users"].sudo().browse(uid)
        if not user.exists():
            return error("User not found", 404)
        return ok(serialize_user(user))

    @http.route("/api/users/me", type="http", auth="none", csrf=False, cors="*", methods=["PUT"])
    def update_me(self, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        data = get_json()
        user = request.env["res.users"].sudo().browse(uid)
        if not user.exists():
            return error("User not found", 404)

        vals = {}
        if "name" in data:
            vals["name"] = str(data.get("name") or "").strip()
        if "email" in data:
            vals["email"] = str(data.get("email") or "").strip().lower()
            vals["login"] = vals["email"]
        if "phone" in data:
            vals["phone"] = str(data.get("phone") or "").strip()
        if "password" in data and data.get("password"):
            vals["password"] = str(data.get("password"))

        try:
            if vals:
                user.write(vals)
            return ok({"message": "Profile updated"})
        except Exception as exc:
            return error(str(exc), 500)

