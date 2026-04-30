from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Any
from urllib.parse import quote

import stripe
from flask import current_app


LATEST_STRIPE_API_VERSION = "2026-02-25.clover"


@dataclass
class StripeLineItem:
    name: str
    unit_amount: int
    quantity: int


class StripeService:
    def _configure(self) -> None:
        api_key = current_app.config.get("STRIPE_SECRET_KEY") or ""
        if not api_key:
            raise RuntimeError("Stripe no está configurado (STRIPE_SECRET_KEY).")
        stripe.api_key = api_key
        stripe.api_version = LATEST_STRIPE_API_VERSION

    @staticmethod
    def _to_cents(value: float | str | Decimal) -> int:
        amount = Decimal(str(value))
        return int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    @staticmethod
    def _expand_url(template: str, order_ref: str, order_id: int) -> str:
        url = template or ""
        if "{ORDER}" in url:
            url = url.replace("{ORDER}", quote(order_ref))
        if "{ORDER_ID}" in url:
            url = url.replace("{ORDER_ID}", str(order_id))
        return url

    def create_checkout_session(
        self,
        *,
        order_id: int,
        order_ref: str,
        invoice_id: int,
        currency: str,
        line_items: list[StripeLineItem],
        customer_email: str | None,
        success_url: str,
        cancel_url: str,
        metadata: dict[str, Any] | None = None,
    ) -> stripe.checkout.Session:
        self._configure()

        if not line_items:
            raise ValueError("Stripe requiere al menos un artículo.")

        expanded_success = self._expand_url(success_url, order_ref, order_id)
        expanded_cancel = self._expand_url(cancel_url, order_ref, order_id)

        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[
                {
                    "quantity": int(item.quantity),
                    "price_data": {
                        "currency": currency.lower(),
                        "unit_amount": int(item.unit_amount),
                        "product_data": {
                            "name": item.name,
                        },
                    },
                }
                for item in line_items
            ],
            success_url=expanded_success,
            cancel_url=expanded_cancel,
            customer_email=customer_email or None,
            client_reference_id=str(order_id),
            metadata=metadata or {},
            payment_intent_data={"metadata": metadata or {}},
        )
        return session

    def verify_webhook(self, payload: bytes, signature: str | None) -> stripe.Event:
        self._configure()
        secret = current_app.config.get("STRIPE_WEBHOOK_SECRET") or ""
        if not secret:
            raise RuntimeError("Stripe webhook no está configurado (STRIPE_WEBHOOK_SECRET).")
        if not signature:
            raise ValueError("Falta la firma de Stripe.")
        return stripe.Webhook.construct_event(payload, signature, secret)

    def retrieve_payment_intent(self, payment_intent_id: str) -> stripe.PaymentIntent:
        self._configure()
        return stripe.PaymentIntent.retrieve(payment_intent_id, expand=["charges.data.payment_method_details"])


stripe_service = StripeService()
