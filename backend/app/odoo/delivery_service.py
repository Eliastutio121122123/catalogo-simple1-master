from __future__ import annotations

from dataclasses import dataclass

from .delivery import DeliveryData


@dataclass(frozen=True)
class DeliveryApplyResult:
    partner_updated: bool
    shipping_partner_id: int | None
    order_updated: bool


class DeliveryService:
    PARTNER_FIELDS = ["id", "name", "email", "phone"]
    SHIP_FIELDS = ["id", "name", "parent_id", "type", "street", "street2", "city", "state_id", "phone"]

    def __init__(self, client):
        self._client = client

    def apply_to_order(self, *, order_id: int, partner_id: int, delivery: DeliveryData) -> DeliveryApplyResult:
        partner_updated = self._maybe_update_partner(partner_id, delivery)
        shipping_id = self._ensure_shipping_contact(partner_id, delivery)
        order_updated = self._update_order_addresses(order_id, partner_id, shipping_id, delivery)
        return DeliveryApplyResult(
            partner_updated=partner_updated,
            shipping_partner_id=shipping_id,
            order_updated=order_updated,
        )

    def _maybe_update_partner(self, partner_id: int, delivery: DeliveryData) -> bool:
        rows = self._client.read("res.partner", [partner_id], self.PARTNER_FIELDS)
        if not rows:
            raise LookupError(f"Partner {partner_id} not found")
        partner = rows[0]

        values: dict = {}
        if not str(partner.get("name") or "").strip():
            values["name"] = delivery.full_name()
        if not str(partner.get("email") or "").strip() and delivery.email:
            values["email"] = delivery.email
        if not str(partner.get("phone") or "").strip() and delivery.phone:
            values["phone"] = delivery.phone

        if not values:
            return False
        self._client.write("res.partner", [partner_id], values)
        return True

    def _ensure_shipping_contact(self, partner_id: int, delivery: DeliveryData) -> int:
        existing = self._client.search_read(
            "res.partner",
            [["parent_id", "=", partner_id], ["type", "=", "delivery"], ["active", "=", True]],
            self.SHIP_FIELDS,
            limit=1,
            order="id desc",
        )
        values = self._shipping_values(partner_id, delivery)
        if existing:
            ship_id = int(existing[0]["id"])
            self._client.write("res.partner", [ship_id], values)
            return ship_id

        ship_id = int(self._client.create("res.partner", values))
        return ship_id

    def _shipping_values(self, partner_id: int, delivery: DeliveryData) -> dict:
        state_id = self._state_id_from_province(delivery.province)
        street2 = (delivery.reference or "").strip()
        if not state_id:
            street2 = self._with_province_suffix(street2, delivery.province)

        values: dict = {
            "name": delivery.full_name(),
            "parent_id": int(partner_id),
            "type": "delivery",
            "street": delivery.address,
            "street2": street2,
            "city": delivery.city,
            "phone": delivery.phone,
        }
        if state_id:
            values["state_id"] = int(state_id)
        return values

    def _update_order_addresses(
        self,
        order_id: int,
        partner_id: int,
        shipping_partner_id: int,
        delivery: DeliveryData,
    ) -> bool:
        values: dict = {
            "partner_shipping_id": int(shipping_partner_id),
            "partner_invoice_id": int(partner_id),
        }
        if (delivery.reference or "").strip():
            values["client_order_ref"] = (delivery.reference or "").strip()[:256]
        self._client.write("sale.order", [int(order_id)], values)
        return True

    def _state_id_from_province(self, province: str) -> int | None:
        name = str(province or "").strip()
        if not name:
            return None
        rows = self._client.search_read(
            "res.country.state",
            [["name", "ilike", name]],
            ["id", "name"],
            limit=1,
            order="id asc",
        )
        if not rows:
            return None
        try:
            return int(rows[0]["id"])
        except Exception:
            return None

    @staticmethod
    def _with_province_suffix(street2: str, province: str) -> str:
        province = str(province or "").strip()
        street2 = str(street2 or "").strip()
        if not province:
            return street2
        if not street2:
            return f"Provincia: {province}"
        if province.lower() in street2.lower():
            return street2
        return f"{street2} | Provincia: {province}"


def build_delivery_service(client) -> DeliveryService:
    return DeliveryService(client)

