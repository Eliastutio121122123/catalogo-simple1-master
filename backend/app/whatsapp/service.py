from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import requests
from flask import current_app


class WhatsAppError(RuntimeError):
    pass


@dataclass(frozen=True)
class WhatsAppCloudConfig:
    access_token: str
    phone_number_id: str
    graph_version: str = "v19.0"
    base_url: str = "https://graph.facebook.com"

    def messages_url(self) -> str:
        version = (self.graph_version or "v19.0").strip().lstrip("/")
        return f"{self.base_url.rstrip('/')}/{version}/{self.phone_number_id}/messages"


class PhoneNumber:
    def __init__(self, raw: str | None, *, default_country_code: str = ""):
        self._raw = str(raw or "").strip()
        self._default_country_code = self._digits(default_country_code)

    @staticmethod
    def _digits(value: str) -> str:
        return "".join(ch for ch in (value or "") if ch.isdigit())

    def as_whatsapp_to(self) -> str:
        digits = self._digits(self._raw)
        if not digits:
            raise ValueError("NÃºmero de telÃ©fono requerido.")

        if digits.startswith("00"):
            digits = digits[2:]

        if self._default_country_code and len(digits) <= 10:
            digits = f"{self._default_country_code}{digits}"

        if len(digits) < 9:
            raise ValueError("NÃºmero de telÃ©fono invÃ¡lido.")
        return digits


class WhatsAppCloudClient:
    def __init__(self, config: WhatsAppCloudConfig, session: requests.Session | None = None):
        self._config = config
        self._session = session or requests.Session()

    def send(self, payload: dict[str, Any]) -> dict[str, Any]:
        url = self._config.messages_url()
        headers = {
            "Authorization": f"Bearer {self._config.access_token}",
            "Content-Type": "application/json",
        }
        response = self._session.post(url, json=payload, headers=headers, timeout=20)
        try:
            data = response.json()
        except Exception:
            data = {"raw": response.text}

        if response.status_code >= 400:
            message = self._extract_error(data) or f"WhatsApp API error ({response.status_code})"
            raise WhatsAppError(message)
        if not isinstance(data, dict):
            raise WhatsAppError("Respuesta invÃ¡lida de WhatsApp.")
        return data

    @staticmethod
    def _extract_error(data: Any) -> str | None:
        if not isinstance(data, dict):
            return None
        err = data.get("error")
        if not isinstance(err, dict):
            return None
        msg = err.get("message")
        if isinstance(msg, str) and msg.strip():
            return msg.strip()
        return None


@dataclass(frozen=True)
class WhatsAppTextMessage:
    to: str
    body: str
    preview_url: bool = False

    def to_payload(self) -> dict[str, Any]:
        body = str(self.body or "").strip()
        if not body:
            raise ValueError("El mensaje no puede estar vacÃ­o.")
        return {
            "messaging_product": "whatsapp",
            "to": self.to,
            "type": "text",
            "text": {"body": body, "preview_url": bool(self.preview_url)},
        }


@dataclass(frozen=True)
class WhatsAppTemplateMessage:
    to: str
    name: str
    language: str = "es"
    components: list[dict[str, Any]] | None = None

    def to_payload(self) -> dict[str, Any]:
        name = str(self.name or "").strip()
        if not name:
            raise ValueError("Template requerido.")
        lang = str(self.language or "es").strip() or "es"
        payload: dict[str, Any] = {
            "messaging_product": "whatsapp",
            "to": self.to,
            "type": "template",
            "template": {
                "name": name,
                "language": {"code": lang},
            },
        }
        if self.components:
            payload["template"]["components"] = self.components
        return payload


class WhatsAppService:
    PROVIDER_META_CLOUD = "meta_cloud"

    def __init__(self):
        self._session: requests.Session | None = None

    def send_text(self, *, to: str, body: str, preview_url: bool = False) -> dict[str, Any]:
        normalized = self._normalize_phone(to)
        message = WhatsAppTextMessage(to=normalized, body=body, preview_url=preview_url)
        return self._client().send(message.to_payload())

    def send_template(
        self,
        *,
        to: str,
        name: str,
        language: str = "es",
        components: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        normalized = self._normalize_phone(to)
        message = WhatsAppTemplateMessage(
            to=normalized,
            name=name,
            language=language,
            components=components,
        )
        return self._client().send(message.to_payload())

    def _normalize_phone(self, raw: str) -> str:
        country = str(current_app.config.get("WHATSAPP_DEFAULT_COUNTRY_CODE") or "").strip()
        return PhoneNumber(raw, default_country_code=country).as_whatsapp_to()

    def _client(self) -> WhatsAppCloudClient:
        provider = str(current_app.config.get("WHATSAPP_PROVIDER") or self.PROVIDER_META_CLOUD).strip().lower()
        if provider != self.PROVIDER_META_CLOUD:
            raise RuntimeError(f"Proveedor de WhatsApp no soportado: {provider}")
        cfg = self._cloud_config()
        return WhatsAppCloudClient(cfg, session=self._get_session())

    def _cloud_config(self) -> WhatsAppCloudConfig:
        token = str(current_app.config.get("WHATSAPP_ACCESS_TOKEN") or "").strip()
        phone_number_id = str(current_app.config.get("WHATSAPP_PHONE_NUMBER_ID") or "").strip()
        graph_version = str(current_app.config.get("WHATSAPP_GRAPH_VERSION") or "v19.0").strip() or "v19.0"

        if not token or not phone_number_id:
            raise RuntimeError(
                "WhatsApp no estÃ¡ configurado (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID)."
            )
        return WhatsAppCloudConfig(
            access_token=token,
            phone_number_id=phone_number_id,
            graph_version=graph_version,
        )

    def _get_session(self) -> requests.Session:
        if self._session is None:
            self._session = requests.Session()
        return self._session


whatsapp_service = WhatsAppService()

