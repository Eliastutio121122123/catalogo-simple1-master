from __future__ import annotations

from dataclasses import dataclass

from .delivery import DeliveryRequest
from .delivery_service import build_delivery_service, DeliveryApplyResult


@dataclass(frozen=True)
class CheckoutDeliveryResult:
    order_id: int
    applied: bool
    delivery: DeliveryApplyResult | None = None


class CheckoutDeliveryService:
    ORDER_FIELDS = ["id", "partner_id", "state"]

    def __init__(self, client):
        self._client = client
        self._delivery = build_delivery_service(client)

    def apply_delivery_to_cart(
        self,
        *,
        partner_id: int,
        cart_id: int,
        delivery_payload: dict | None,
    ) -> CheckoutDeliveryResult:
        order = self._read_order(cart_id)
        self._assert_ownership(order, partner_id)

        req = DeliveryRequest(delivery_payload)
        if req.is_empty():
            return CheckoutDeliveryResult(order_id=int(cart_id), applied=False, delivery=None)

        delivery = req.parse()
        result = self._delivery.apply_to_order(order_id=int(cart_id), partner_id=int(partner_id), delivery=delivery)
        return CheckoutDeliveryResult(order_id=int(cart_id), applied=True, delivery=result)

    def _read_order(self, order_id: int) -> dict:
        rows = self._client.read("sale.order", [int(order_id)], self.ORDER_FIELDS)
        if not rows:
            raise LookupError(f"Order {order_id} not found")
        return rows[0]

    @staticmethod
    def _assert_ownership(order: dict, partner_id: int) -> None:
        partner = order.get("partner_id") or []
        owner_id = None
        if isinstance(partner, (list, tuple)) and partner:
            owner_id = int(partner[0])
        elif isinstance(partner, int):
            owner_id = int(partner)
        if not owner_id or int(owner_id) != int(partner_id):
            raise PermissionError("Not authorized for this order")


def build_checkout_delivery_service(client) -> CheckoutDeliveryService:
    return CheckoutDeliveryService(client)

