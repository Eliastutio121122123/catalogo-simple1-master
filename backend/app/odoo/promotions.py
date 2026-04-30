from datetime import date

from .client import odoo


class PromotionService:
    MODEL = "catalog.promotion"
    FIELDS = [
        "id",
        "name",
        "code",
        "description",
        "promotion_type",
        "value",
        "min_order_amount",
        "max_discount_amount",
        "applies_to",
        "start_date",
        "end_date",
        "usage_limit",
        "used_count",
        "status",
        "vendor_partner_id",
        "active",
    ]

    def __init__(self, client):
        self._client = client

    def _partner_id_from_user(self, uid: int) -> int:
        users = self._client.search_read("res.users", [["id", "=", uid]], ["partner_id"], limit=1)
        if not users:
            raise LookupError(f"User {uid} not found")
        partner = users[0].get("partner_id")
        if not partner:
            raise LookupError(f"User {uid} has no partner")
        return partner[0] if isinstance(partner, list) else int(partner)

    def _to_api(self, rec: dict) -> dict:
        end_date = rec.get("end_date")
        status = rec.get("status") or "inactive"
        if status == "active" and end_date:
            try:
                if date.fromisoformat(end_date) < date.today():
                    status = "expired"
            except ValueError:
                pass

        vendor_partner = rec.get("vendor_partner_id")
        return {
            "id": rec.get("id"),
            "name": rec.get("name") or "",
            "code": rec.get("code") or "",
            "description": rec.get("description") or "",
            "type": rec.get("promotion_type") or "percent",
            "value": rec.get("value") or 0,
            "minOrder": rec.get("min_order_amount"),
            "maxDiscount": rec.get("max_discount_amount"),
            "appliesTo": rec.get("applies_to") or "all",
            "startDate": rec.get("start_date"),
            "endDate": rec.get("end_date"),
            "usageLimit": rec.get("usage_limit"),
            "usedCount": rec.get("used_count") or 0,
            "status": status,
            "vendorPartnerId": vendor_partner[0] if isinstance(vendor_partner, list) else vendor_partner,
        }

    def _to_odoo(self, payload: dict, include_partner_id: int | None = None) -> dict:
        values = {
            "name": str(payload.get("name") or "").strip(),
            "code": str(payload.get("code") or "").strip().upper() or False,
            "description": payload.get("description") or "",
            "promotion_type": payload.get("type") or "percent",
            "value": float(payload.get("value") or 0),
            "min_order_amount": float(payload["minOrder"]) if payload.get("minOrder") not in (None, "") else False,
            "max_discount_amount": float(payload["maxDiscount"]) if payload.get("maxDiscount") not in (None, "") else False,
            "applies_to": payload.get("appliesTo") or "all",
            "start_date": payload.get("startDate") or False,
            "end_date": payload.get("endDate") or False,
            "usage_limit": int(payload["usageLimit"]) if payload.get("usageLimit") not in (None, "") else False,
            "status": payload.get("status") or "active",
        }
        if include_partner_id:
            values["vendor_partner_id"] = include_partner_id
        return values

    def _get_owned_record(self, uid: int, promotion_id: int) -> dict:
        partner_id = self._partner_id_from_user(uid)
        rows = self._client.search_read(
            self.MODEL,
            [["id", "=", promotion_id], ["vendor_partner_id", "=", partner_id]],
            self.FIELDS,
            limit=1,
        )
        if not rows:
            raise LookupError(f"Promotion {promotion_id} not found")
        return rows[0]

    def list_vendor_promotions(self, uid: int) -> list[dict]:
        partner_id = self._partner_id_from_user(uid)
        rows = self._client.call(
            self.MODEL,
            "search_read",
            [[["vendor_partner_id", "=", partner_id]]],
            {"fields": self.FIELDS, "order": "id desc", "limit": 500},
        )
        return [self._to_api(row) for row in rows]

    def get_vendor_promotion(self, uid: int, promotion_id: int) -> dict:
        return self._to_api(self._get_owned_record(uid, promotion_id))

    def create_vendor_promotion(self, uid: int, payload: dict) -> dict:
        partner_id = self._partner_id_from_user(uid)
        promotion_id = self._client.create(self.MODEL, self._to_odoo(payload, include_partner_id=partner_id))
        return self.get_vendor_promotion(uid, promotion_id)

    def update_vendor_promotion(self, uid: int, promotion_id: int, payload: dict) -> dict:
        self._get_owned_record(uid, promotion_id)
        self._client.write(self.MODEL, [promotion_id], self._to_odoo(payload))
        return self.get_vendor_promotion(uid, promotion_id)

    def delete_vendor_promotion(self, uid: int, promotion_id: int) -> bool:
        self._get_owned_record(uid, promotion_id)
        return self._client.unlink(self.MODEL, [promotion_id])

    def toggle_vendor_promotion_status(self, uid: int, promotion_id: int) -> dict:
        promotion = self._get_owned_record(uid, promotion_id)
        if promotion.get("status") == "expired":
            return self._to_api(promotion)
        new_status = "inactive" if promotion.get("status") == "active" else "active"
        self._client.write(self.MODEL, [promotion_id], {"status": new_status})
        return self.get_vendor_promotion(uid, promotion_id)


promotion_service = PromotionService(odoo)
