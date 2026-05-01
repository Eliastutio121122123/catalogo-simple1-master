from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.payments import payment_service
from ..stripe.service import stripe_service
from ..utils.response import error, success
from ..utils.validators import require_fields
from ..utils.audit_writer import log_event

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
            log_event(
                "CHECKOUT_INITIATED",
                target=f"order:{response.get('order_id', 'new')}",
                actor_name=f"uid:{uid}",
                actor_role="customer",
                severity="low",
                status="ok",
            )
            return success(response)
        except PermissionError as exc:
            log_event(
                "CHECKOUT_BLOCKED",
                target=f"uid:{uid}",
                actor_name=f"uid:{uid}",
                actor_role="customer",
                severity="high",
                status="blocked",
            )
            return error(str(exc), 403)
        except LookupError as exc:
            return error(str(exc), 404)
        except ValueError as exc:
            log_event(
                "CHECKOUT_INVALID",
                target=f"uid:{uid}",
                actor_name=f"uid:{uid}",
                actor_role="customer",
                severity="medium",
                status="warn",
            )
            return error(str(exc), 400)
        except Exception as exc:
            log_event(
                "CHECKOUT_ERROR",
                target=f"uid:{uid}",
                actor_name=f"uid:{uid}",
                actor_role="customer",
                severity="high",
                status="warn",
            )
            return error(str(exc), 500)


class PaymentsWebhookAPI(MethodView):
    def post(self):
        payload = request.get_data() or b""
        signature = request.headers.get("Stripe-Signature")
        try:
            event = stripe_service.verify_webhook(payload, signature)
        except Exception as exc:
            log_event(
                "STRIPE_WEBHOOK_INVALID",
                target="stripe_webhook",
                actor_name="Stripe",
                actor_role="system",
                severity="high",
                status="blocked",
            )
            return error(str(exc), 400)

        handled = payment_service.handle_stripe_event(event)
        log_event(
            f"STRIPE_EVENT_{event.get('type', 'unknown').upper().replace('.', '_')}",
            target=f"stripe:{event.get('id', '-')}",
            actor_name="Stripe",
            actor_role="system",
            severity="low",
            status="ok",
        )
        return success({"received": True, "result": handled})


bp.add_url_rule("/checkout", view_func=PaymentsCheckoutAPI.as_view("payments_checkout"))
bp.add_url_rule("/webhook", view_func=PaymentsWebhookAPI.as_view("payments_webhook"))
