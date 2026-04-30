from __future__ import annotations

from flask import Blueprint, Response, current_app, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..utils.response import error, success
from ..utils.validators import require_fields
from ..whatsapp.service import WhatsAppError, whatsapp_service
from ..whatsapp.webhook import (
    whatsapp_webhook_handler,
    whatsapp_webhook_signature_verifier,
    whatsapp_webhook_verifier,
)


bp = Blueprint("whatsapp", __name__)


class WhatsAppSendTextAPI(MethodView):
    decorators = [jwt_required]

    def post(self):
        data = request.get_json() or {}
        err = require_fields(data, ["to", "body"])
        if err:
            return error(err, 400)

        try:
            result = whatsapp_service.send_text(
                to=str(data.get("to") or ""),
                body=str(data.get("body") or ""),
                preview_url=bool(data.get("preview_url") or data.get("previewUrl") or False),
            )
            return success(result)
        except ValueError as exc:
            return error(str(exc), 400)
        except WhatsAppError as exc:
            return error(str(exc), 502)
        except Exception as exc:
            return error(str(exc), 500)


class WhatsAppSendTemplateAPI(MethodView):
    decorators = [jwt_required]

    def post(self):
        data = request.get_json() or {}
        err = require_fields(data, ["to", "name"])
        if err:
            return error(err, 400)

        components = data.get("components")
        if components is not None and not isinstance(components, list):
            return error("components must be a list", 400)

        try:
            result = whatsapp_service.send_template(
                to=str(data.get("to") or ""),
                name=str(data.get("name") or ""),
                language=str(data.get("language") or data.get("lang") or "es"),
                components=components,
            )
            return success(result)
        except ValueError as exc:
            return error(str(exc), 400)
        except WhatsAppError as exc:
            return error(str(exc), 502)
        except Exception as exc:
            return error(str(exc), 500)


class WhatsAppWebhookAPI(MethodView):
    def get(self):
        verification = whatsapp_webhook_verifier.verify(request.args.to_dict() or {})
        if not verification:
            return error("Invalid verification token", 403)
        return Response(verification.challenge, status=200, mimetype="text/plain")

    def post(self):
        app_secret = str(current_app.config.get("WHATSAPP_APP_SECRET") or "").strip()
        signature = request.headers.get(whatsapp_webhook_signature_verifier.HEADER)
        raw_body = request.get_data(cache=True) or b""
        if not whatsapp_webhook_signature_verifier.verify(
            raw_body=raw_body,
            signature_header=signature,
            app_secret=app_secret,
        ):
            return error("Invalid webhook signature", 403)

        payload = request.get_json(silent=True) or {}
        try:
            result = whatsapp_webhook_handler.handle(payload)
            return success(result)
        except Exception as exc:
            return error(str(exc), 500)


bp.add_url_rule("/messages/text", view_func=WhatsAppSendTextAPI.as_view("whatsapp_send_text"))
bp.add_url_rule("/messages/template", view_func=WhatsAppSendTemplateAPI.as_view("whatsapp_send_template"))
bp.add_url_rule("/webhook", view_func=WhatsAppWebhookAPI.as_view("whatsapp_webhook"))
