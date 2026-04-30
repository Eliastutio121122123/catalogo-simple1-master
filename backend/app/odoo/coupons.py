from __future__ import annotations

from datetime import date

from .client import odoo


class CouponService:
    FIELDS = [
        "id",
        "code",
        "description",
        "discount_type",
        "value",
        "min_order_amount",
        "max_discount_amount",
        "max_uses",
        "max_uses_per_user",
        "expires_at",
        "status",
        "catalog_ids",
        "one_per_customer",
        "new_customers_only",
        "usage_count",
        "vendor_partner_id",
    ]

    def __init__(self, client):
        self._client = client

    def list_vendor_coupons(self, uid: int) -> list[dict]:
        partner_id = self._partner_id_from_user(uid)
        rows = self._client.call(
            "catalog.coupon",
            "search_read",
            [[["vendor_partner_id", "=", partner_id]]],
            {"fields": self.FIELDS, "order": "id desc", "limit": 500},
        )
        return [self._to_api(row) for row in rows]

    def get_vendor_coupon(self, uid: int, coupon_id: int) -> dict:
        return self._to_api(self._get_owned_record(uid, coupon_id))

    def create_vendor_coupon(self, uid: int, payload: dict) -> dict:
        partner_id = self._partner_id_from_user(uid)
        coupon_id = self._client.create("catalog.coupon", self._to_odoo(payload, include_partner_id=partner_id))
        return self.get_vendor_coupon(uid, coupon_id)

    def update_vendor_coupon(self, uid: int, coupon_id: int, payload: dict) -> dict:
        self._get_owned_record(uid, coupon_id)
        self._client.write("catalog.coupon", [coupon_id], self._to_odoo(payload))
        return self.get_vendor_coupon(uid, coupon_id)

    def delete_vendor_coupon(self, uid: int, coupon_id: int) -> bool:
        self._get_owned_record(uid, coupon_id)
        return self._client.unlink("catalog.coupon", [coupon_id])

    def toggle_vendor_coupon_status(self, uid: int, coupon_id: int) -> dict:
        coupon = self._get_owned_record(uid, coupon_id)
        if coupon.get("status") == "expired":
            return self._to_api(coupon)
        new_status = "inactive" if coupon.get("status") == "active" else "active"
        self._client.write("catalog.coupon", [coupon_id], {"status": new_status})
        return self.get_vendor_coupon(uid, coupon_id)

    def duplicate_vendor_coupon(self, uid: int, coupon_id: int) -> dict:
        coupon = self._get_owned_record(uid, coupon_id)
        payload = self._to_api(coupon)
        payload["id"] = None
        payload["code"] = f"{payload['code']}_COPIA"
        payload["status"] = "inactive"
        payload["uses"] = 0
        return self.create_vendor_coupon(uid, payload)

    def _partner_id_from_user(self, uid: int) -> int:
        users = self._client.search_read("res.users", [["id", "=", uid]], ["partner_id"], limit=1)
        if not users:
            raise LookupError(f"User {uid} not found")
        partner = users[0].get("partner_id")
        if not partner:
            raise LookupError(f"User {uid} has no partner")
        return partner[0] if isinstance(partner, list) else int(partner)

    def _to_api(self, rec: dict) -> dict:
        expires_at = rec.get("expires_at")
        status = rec.get("status") or "inactive"
        if status == "active" and expires_at:
            try:
                if date.fromisoformat(expires_at) < date.today():
                    status = "expired"
            except ValueError:
                pass

        vendor_partner = rec.get("vendor_partner_id")
        return {
            "id": rec.get("id"),
            "code": rec.get("code"),
            "description": rec.get("description") or "",
            "type": rec.get("discount_type") or "percent",
            "value": rec.get("value") or 0,
            "minOrder": rec.get("min_order_amount"),
            "maxDiscount": rec.get("max_discount_amount"),
            "maxUses": rec.get("max_uses"),
            "maxUsesPerUser": rec.get("max_uses_per_user") or 1,
            "expiresAt": expires_at,
            "status": status,
            "catalogs": rec.get("catalog_ids") or [],
            "onePerCustomer": bool(rec.get("one_per_customer")),
            "newCustomersOnly": bool(rec.get("new_customers_only")),
            "uses": rec.get("usage_count") or 0,
            "vendorPartnerId": vendor_partner[0] if isinstance(vendor_partner, list) else vendor_partner,
        }

    def _to_odoo(self, payload: dict, include_partner_id: int | None = None) -> dict:
        values = {
            "code": str(payload.get("code", "")).strip().upper(),
            "description": payload.get("description") or "",
            "discount_type": payload.get("type") or "percent",
            "value": float(payload.get("value") or 0),
            "min_order_amount": float(payload["minOrder"]) if payload.get("minOrder") not in (None, "") else False,
            "max_discount_amount": float(payload["maxDiscount"]) if payload.get("maxDiscount") not in (None, "") else False,
            "max_uses": int(payload["maxUses"]) if payload.get("maxUses") not in (None, "") else False,
            "max_uses_per_user": int(payload.get("maxUsesPerUser") or 1),
            "expires_at": payload.get("expiresAt") or False,
            "status": payload.get("status") or "active",
            "one_per_customer": bool(payload.get("onePerCustomer", True)),
            "new_customers_only": bool(payload.get("newCustomersOnly", False)),
        }
        if "catalogs" in payload:
            values["catalog_ids"] = [(6, 0, payload.get("catalogs") or [])]
        if include_partner_id:
            values["vendor_partner_id"] = include_partner_id
        return values

    def _get_owned_record(self, uid: int, coupon_id: int) -> dict:
        partner_id = self._partner_id_from_user(uid)
        rows = self._client.search_read(
            "catalog.coupon",
            [["id", "=", coupon_id], ["vendor_partner_id", "=", partner_id]],
            self.FIELDS,
            limit=1,
        )
        if not rows:
            raise LookupError(f"Coupon {coupon_id} not found")
        return rows[0]


coupon_service = CouponService(odoo)
