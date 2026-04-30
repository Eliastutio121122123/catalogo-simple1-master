from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.payments import payment_service
from ..stripe.service import stripe_service
from ..utils.response import error, success
from ..utils.validators import require_fields

bp = Blueprint("payments", __name__)


class PaymentsCheckoutAPI(MethodView):
    decorators = [jwt_required]

    def post(self):
        data = request.get_json() or {}
        err = require_fields(data, ["lines"])
        if err:
            return error(err, 400)

        payload = getattr(request, "jwt_payload", {}) or {}
        uid = payload.get("uid")
        if not uid:
            return error("Invalid token", 401)

        try:
            response = payment_service.checkout(int(uid), data)
            return success(response)
        except PermissionError as exc:
            return error(str(exc), 403)
        except LookupError as exc:
            return error(str(exc), 404)
        except ValueError as exc:
            return error(str(exc), 400)
        except Exception as exc:
            return error(str(exc), 500)


class PaymentsWebhookAPI(MethodView):
    def post(self):
        payload = request.get_data() or b""
        signature = request.headers.get("Stripe-Signature")
        try:
            event = stripe_service.verify_webhook(payload, signature)
        except Exception as exc:
            return error(str(exc), 400)

        handled = payment_service.handle_stripe_event(event)
        return success({"received": True, "result": handled})


bp.add_url_rule("/checkout", view_func=PaymentsCheckoutAPI.as_view("payments_checkout"))
bp.add_url_rule("/webhook", view_func=PaymentsWebhookAPI.as_view("payments_webhook"))
