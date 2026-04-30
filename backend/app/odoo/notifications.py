from __future__ import annotations

from .client import odoo
from .users import UserService


class NotificationService:
    FIELDS = ["id", "title", "body", "notif_type", "is_read", "create_date", "vendor_partner_id"]

    def __init__(self, client):
        self._client = client

    def list_vendor_notifications(self, uid: int) -> list[dict]:
        partner_id = self._partner_id_from_user(uid)
        rows = self._client.search_read(
            "catalog.notification",
            [["vendor_partner_id", "=", partner_id]],
            self.FIELDS,
            limit=200,
            offset=0,
        )
        if self._sync_from_data(partner_id, rows):
            rows = self._client.search_read(
                "catalog.notification",
                [["vendor_partner_id", "=", partner_id]],
                self.FIELDS,
                limit=200,
                offset=0,
            )
        return [self._to_api(row) for row in rows]

    def mark_read(self, uid: int, notification_id: int) -> dict:
        rec = self._get_owned_record(uid, notification_id)
        self._client.write("catalog.notification", [notification_id], {"is_read": True})
        rec["is_read"] = True
        return self._to_api(rec)

    def mark_all_read(self, uid: int) -> bool:
        partner_id = self._partner_id_from_user(uid)
        ids = self._client.search("catalog.notification", [["vendor_partner_id", "=", partner_id], ["is_read", "=", False]])
        if ids:
            self._client.write("catalog.notification", ids, {"is_read": True})
        return True

    def delete(self, uid: int, notification_id: int) -> bool:
        self._get_owned_record(uid, notification_id)
        return self._client.unlink("catalog.notification", [notification_id])

    def _sync_from_data(self, partner_id: int, existing_rows: list[dict]) -> bool:
        existing_keys = {
            f"{row.get('notif_type')}::{row.get('title')}"
            for row in (existing_rows or [])
            if row.get("title")
        }
        product_ids = self._vendor_product_ids(partner_id)
        payloads: list[dict] = []

        for order in self._latest_orders(product_ids, limit=3):
            name = order.get("name") or "Pedido"
            total = float(order.get("amount_total") or 0)
            title = f"Nuevo pedido {name} recibido"
            key = f"order::{title}"
            if key in existing_keys:
                continue
            payloads.append({
                "vendor_partner_id": partner_id,
                "title": title,
                "body": f"Monto RD${total:,.2f}",
                "notif_type": "order",
                "is_read": False,
            })

        for prod in self._low_stock_products(product_ids, limit=3):
            name = prod.get("name") or "Producto"
            qty = float(prod.get("catalog_stock_qty") or 0)
            title = f"Stock bajo: {name}"
            key = f"inventory::{title}"
            if key in existing_keys:
                continue
            payloads.append({
                "vendor_partner_id": partner_id,
                "title": title,
                "body": f"Quedan {qty:.0f} unidades",
                "notif_type": "inventory",
                "is_read": False,
            })

        if payloads:
            for values in payloads:
                self._client.create("catalog.notification", values)
            return True
        return False

    def _partner_id_from_user(self, uid: int) -> int:
        partner_id = UserService.resolve_vendor_partner_id(uid)
        if not partner_id:
            raise LookupError(f"User {uid} has no vendor partner")
        return int(partner_id)

    def _vendor_product_ids(self, partner_id: int) -> list[int]:
        catalog_ids = self._client.search("catalog.catalog", [["vendor_id", "=", partner_id]])
        if not catalog_ids:
            return []
        return self._client.search("product.template", [["catalog_id", "in", catalog_ids]])

    def _latest_orders(self, product_ids: list[int], limit: int = 3) -> list[dict]:
        if not product_ids:
            return []
        lines = self._client.search_read(
            "sale.order.line",
            [["product_id", "in", product_ids]],
            ["order_id", "create_date"],
            limit=50,
            offset=0,
            order="create_date desc",
        )
        order_ids = []
        seen = set()
        for line in lines:
            order = line.get("order_id") or []
            if not order:
                continue
            oid = int(order[0])
            if oid in seen:
                continue
            seen.add(oid)
            order_ids.append(oid)
            if len(order_ids) >= limit:
                break
        if not order_ids:
            return []
        return self._client.read("sale.order", order_ids, ["name", "amount_total", "date_order"]) or []

    def _low_stock_products(self, product_ids: list[int], limit: int = 3) -> list[dict]:
        if not product_ids:
            return []
        rows = self._client.search_read(
            "product.template",
            [["id", "in", product_ids]],
            ["name", "catalog_stock_qty", "qty_available", "min_stock"],
            limit=200,
        )
        low = []
        for row in rows:
            min_stock = float(row.get("min_stock") or 0)
            qty = row.get("catalog_stock_qty")
            if qty is None:
                qty = row.get("qty_available")
            qty = float(qty or 0)
            if qty <= 0:
                low.append(row)
                continue
            if min_stock > 0 and qty <= min_stock:
                low.append(row)
        return low[:limit]

    def _get_owned_record(self, uid: int, notification_id: int) -> dict:
        partner_id = self._partner_id_from_user(uid)
        rows = self._client.search_read(
            "catalog.notification",
            [["id", "=", notification_id], ["vendor_partner_id", "=", partner_id]],
            self.FIELDS,
            limit=1,
        )
        if not rows:
            raise LookupError(f"Notification {notification_id} not found")
        return rows[0]

    @staticmethod
    def _to_api(rec: dict) -> dict:
        return {
            "id": rec.get("id"),
            "title": rec.get("title") or "",
            "body": rec.get("body") or "",
            "type": rec.get("notif_type") or "system",
            "read": bool(rec.get("is_read")),
            "createdAt": rec.get("create_date"),
        }


notification_service = NotificationService(odoo)
