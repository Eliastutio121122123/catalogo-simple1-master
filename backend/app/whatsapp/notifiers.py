from __future__ import annotations

from dataclasses import dataclass

from flask import current_app

from ..odoo.client import odoo
from .service import whatsapp_service


@dataclass(frozen=True)
class Money:
    amount: float
    currency: str

    def format(self) -> str:
        try:
            return f"{self.currency}{self.amount:,.2f}"
        except Exception:
            return f"{self.amount:.2f} {self.currency}"


class CurrencyService:
    def __init__(self, client):
        self._client = client

    def symbol_by_id(self, currency_id: int) -> str:
        if not currency_id:
            return ""
        rows = self._client.read("res.currency", [currency_id], ["symbol", "name"])
        if not rows:
            return ""
        sym = (rows[0].get("symbol") or "").strip()
        if sym:
            return sym
        return (rows[0].get("name") or "").strip()


class WhatsAppPaymentNotifier:
    INVOICE_FIELDS = ["id", "name", "amount_total", "currency_id", "partner_id"]

    def __init__(self, client):
        self._client = client
        self._currency = CurrencyService(client)
        self._partner_fields: list[str] | None = None

    def _get_partner_fields(self) -> list[str]:
        if self._partner_fields is not None:
            return self._partner_fields

        try:
            fields = self._client.call("res.partner", "fields_get", [], {}) or {}
        except Exception:
            fields = {}

        partner_fields = ["id", "name", "phone"]
        if "mobile" in fields:
            partner_fields.append("mobile")

        self._partner_fields = partner_fields
        return partner_fields

    def notify_invoice_paid(self, invoice_id: int) -> bool:
        if not current_app.config.get("WHATSAPP_NOTIFY_PAYMENTS"):
            return False

        invoice = self._read_invoice(invoice_id)
        partner_id = self._partner_id(invoice)
        phone = self._partner_phone(partner_id)
        if not phone:
            return False

        invoice_name = str(invoice.get("name") or f"Factura {invoice_id}").strip()
        amount = float(invoice.get("amount_total") or 0)
        currency_id = self._currency_id(invoice)
        symbol = self._currency.symbol_by_id(currency_id) or ""

        template = str(current_app.config.get("WHATSAPP_PAYMENT_TEMPLATE") or "").strip()
        language = str(current_app.config.get("WHATSAPP_PAYMENT_LANGUAGE") or "es").strip() or "es"

        if template:
            components = [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": invoice_name},
                        {"type": "text", "text": Money(amount=amount, currency=symbol).format()},
                    ],
                }
            ]
            whatsapp_service.send_template(
                to=phone,
                name=template,
                language=language,
                components=components,
            )
            return True

        body = f"Pago recibido. {invoice_name} por {Money(amount=amount, currency=symbol).format()}. Gracias por tu compra."
        whatsapp_service.send_text(to=phone, body=body, preview_url=False)
        return True

    def _read_invoice(self, invoice_id: int) -> dict:
        rows = self._client.read("account.move", [invoice_id], self.INVOICE_FIELDS)
        if not rows:
            raise LookupError(f"Invoice {invoice_id} not found")
        return rows[0]

    @staticmethod
    def _partner_id(invoice: dict) -> int:
        partner = invoice.get("partner_id") or []
        if isinstance(partner, (list, tuple)) and partner:
            return int(partner[0])
        if isinstance(partner, int):
            return int(partner)
        raise ValueError("Invoice has no partner")

    def _partner_phone(self, partner_id: int) -> str | None:
        rows = self._client.read("res.partner", [partner_id], self._get_partner_fields())
        if not rows:
            return None
        row = rows[0]
        phone = str(row.get("mobile") or row.get("phone") or "").strip()
        return phone or None

    @staticmethod
    def _currency_id(invoice: dict) -> int:
        currency = invoice.get("currency_id") or []
        if isinstance(currency, (list, tuple)) and currency:
            return int(currency[0])
        if isinstance(currency, int):
            return int(currency)
        return 0


whatsapp_payment_notifier = WhatsAppPaymentNotifier(odoo)
