from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from flask import current_app
import hashlib
import hmac


@dataclass(frozen=True)
class WhatsAppWebhookVerification:
    challenge: str


class WhatsAppWebhookVerifier:
    def verify(self, query_params: dict[str, Any]) -> WhatsAppWebhookVerification | None:
        mode = str(query_params.get("hub.mode") or "").strip()
        token = str(query_params.get("hub.verify_token") or "").strip()
        challenge = str(query_params.get("hub.challenge") or "").strip()

        expected = str(current_app.config.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") or "").strip()
        if not expected:
            return None

        if mode == "subscribe" and token and token == expected and challenge:
            return WhatsAppWebhookVerification(challenge=challenge)
        return None


class WhatsAppWebhookHandler:
    def handle(self, payload: dict[str, Any] | None) -> dict[str, Any]:
        data = payload or {}
        events: list[dict[str, Any]] = []

        for entry in data.get("entry") or []:
            changes = (entry or {}).get("changes") or []
            for change in changes:
                value = (change or {}).get("value") or {}
                for msg in value.get("messages") or []:
                    events.append(self._message_event(value, msg))
                for status in value.get("statuses") or []:
                    events.append(self._status_event(value, status))

        if events:
            try:
                current_app.logger.info("whatsapp:webhook events=%s", len(events))
            except Exception:
                pass

        return {"events": events, "count": len(events)}

    @staticmethod
    def _message_event(value: dict[str, Any], msg: dict[str, Any]) -> dict[str, Any]:
        return {
            "type": "message",
            "from": msg.get("from"),
            "id": msg.get("id"),
            "timestamp": msg.get("timestamp"),
            "message_type": msg.get("type"),
            "text": (msg.get("text") or {}).get("body"),
            "contacts": value.get("contacts") or [],
        }

    @staticmethod
    def _status_event(value: dict[str, Any], status: dict[str, Any]) -> dict[str, Any]:
        return {
            "type": "status",
            "id": status.get("id"),
            "status": status.get("status"),
            "timestamp": status.get("timestamp"),
            "recipient_id": status.get("recipient_id"),
            "errors": status.get("errors") or [],
            "conversation": status.get("conversation") or {},
            "pricing": status.get("pricing") or {},
        }


class WhatsAppWebhookSignatureVerifier:
    HEADER = "X-Hub-Signature-256"

    def verify(self, *, raw_body: bytes, signature_header: str | None, app_secret: str | None) -> bool:
        secret = str(app_secret or "").strip()
        if not secret:
            return True

        header = str(signature_header or "").strip()
        if not header:
            return False

        prefix = "sha256="
        if not header.lower().startswith(prefix):
            return False

        received = header[len(prefix):].strip()
        if not received:
            return False

        digest = hmac.new(secret.encode("utf-8"), raw_body or b"", hashlib.sha256).hexdigest()
        expected = digest
        return hmac.compare_digest(expected, received)


whatsapp_webhook_verifier = WhatsAppWebhookVerifier()
whatsapp_webhook_handler = WhatsAppWebhookHandler()
whatsapp_webhook_signature_verifier = WhatsAppWebhookSignatureVerifier()
