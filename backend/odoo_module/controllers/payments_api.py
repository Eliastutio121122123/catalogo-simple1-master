from odoo import http

from .api_base import get_json, ok, require_jwt


class CatalogixPaymentsController(http.Controller):
    @http.route("/api/payments/checkout", type="http", auth="none", csrf=False, cors="*", methods=["POST"])
    def checkout(self, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        data = get_json()
        return ok({"message": "Payment endpoint ready", "data": data})

    @http.route("/api/payments/webhook", type="http", auth="none", csrf=False, cors="*", methods=["POST"])
    def webhook(self, **kwargs):
        payload = get_json()
        return ok({"received": True, "payload": payload})

