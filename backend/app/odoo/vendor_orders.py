from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from .client import odoo
from .users import UserService


@dataclass(frozen=True)
class VendorOrderStatus:
    key: str
    states: set[str]


class VendorOrderService:
    ORDER_FIELDS = [
        "id",
        "name",
        "state",
        "amount_total", "client_order_ref",
        "partner_id",
        "date_order",
    ]
    LINE_FIELDS = [
        "id",
        "order_id",
        "product_id",
        "product_uom_qty",
        "price_unit",
        "price_subtotal",
    ]
    PARTNER_FIELDS = [
        "id",
        "name",
        "email",
        "phone",
        "contact_address",
    ]
    PRODUCT_FIELDS = [
        "id",
        "display_name",
        "default_code",
        "image_1920",
    ]

    STATUS_MAP = [
        VendorOrderStatus("pending", {"draft"}),
        VendorOrderStatus("processing", {"sent"}),
        VendorOrderStatus("shipped", {"sale"}),
        VendorOrderStatus("delivered", {"done"}),
        VendorOrderStatus("cancelled", {"cancel"}),
    ]

    def __init__(self, client, user_service: type[UserService] = UserService):
        self._client = client
        self._users = user_service

    def list_orders(
        self,
        uid: int,
        status: str | None = None,
        query: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict]:
        partner_id = self._users.resolve_vendor_partner_id(uid) or self._users.resolve_partner_id(uid)
        if not partner_id:
            raise LookupError("Vendor partner not found")

        product_ids = self._vendor_product_ids(partner_id)
        if not product_ids:
            return []

        lines = self._client.search_read(
            "sale.order.line",
            [["product_id", "in", product_ids]],
            self.LINE_FIELDS,
            limit=5000,
            order="id desc",
        )
        if not lines:
            return []

        line_by_order: dict[int, list[dict]] = {}
        product_names: dict[int, str] = {}
        for line in lines:
            order = line.get("order_id") or []
            if not order:
                continue
            oid = int(order[0])
            line_by_order.setdefault(oid, []).append(line)

            prod = line.get("product_id") or []
            if isinstance(prod, (list, tuple)) and len(prod) > 1:
                product_names[int(prod[0])] = prod[1]

        order_ids = list(line_by_order.keys())
        orders = self._client.read("sale.order", order_ids, self.ORDER_FIELDS)

        results = []
        q = (query or "").strip().lower()
        for order in orders:
            oid = int(order.get("id") or 0)
            if oid not in line_by_order:
                continue

            status_key = self._order_status(order.get("state"), order.get("client_order_ref"))
            if status and status_key != status:
                continue

            partner = order.get("partner_id") or []
            customer = partner[1] if isinstance(partner, list) and len(partner) > 1 else ""

            if q:
                name = (order.get("name") or "").lower()
                if q not in name and q not in customer.lower():
                    continue

            lines_for_order = line_by_order[oid]
            amount = sum(float(l.get("price_subtotal") or 0) for l in lines_for_order)
            items = sum(float(l.get("product_uom_qty") or 0) for l in lines_for_order)

            top_line = max(lines_for_order, key=lambda l: float(l.get("product_uom_qty") or 0))
            prod = top_line.get("product_id") or []
            prod_name = ""
            if isinstance(prod, (list, tuple)) and len(prod) > 1:
                prod_name = prod[1]
            elif prod:
                prod_name = product_names.get(int(prod[0]), "")

            results.append(
                {
                    "id": oid,
                    "name": order.get("name") or f"SO{oid}",
                    "status": status_key,
                    "date": order.get("date_order"),
                    "amount": round(amount, 2),
                    "items": items,
                    "customer": customer,
                    "product": prod_name,
                }
            )

        results.sort(key=lambda r: r.get("date") or "", reverse=True)
        if offset or limit:
            return results[offset: offset + limit]
        return results

    def get_order(self, uid: int, order_id: int) -> dict:
        partner_id = self._users.resolve_vendor_partner_id(uid) or self._users.resolve_partner_id(uid)
        if not partner_id:
            raise LookupError("Vendor partner not found")

        product_ids = self._vendor_product_ids(partner_id)
        if not product_ids:
            raise LookupError("Vendor has no products")

        lines = self._client.search_read(
            "sale.order.line",
            [["order_id", "=", int(order_id)], ["product_id", "in", product_ids]],
            self.LINE_FIELDS,
            limit=5000,
        )
        if not lines:
            raise LookupError("Order not found for this vendor")

        orders = self._client.read("sale.order", [int(order_id)], self.ORDER_FIELDS)
        if not orders:
            raise LookupError("Order not found")
        order = orders[0]

        partner = order.get("partner_id") or []
        partner_id = int(partner[0]) if partner else 0
        partner_row = {}
        if partner_id:
            rows = self._client.read("res.partner", [partner_id], self.PARTNER_FIELDS)
            partner_row = rows[0] if rows else {}

        items = self._attach_product_data(lines)
        subtotal = sum(float(i.get("subtotal") or 0) for i in items)

        return {
            "id": int(order.get("id") or 0),
            "name": order.get("name") or f"SO{order_id}",
            "status": self._order_status(order.get("state")),
            "date": order.get("date_order"),
            "total": float(order.get("amount_total") or 0),
            "subtotal": subtotal,
            "customer": {
                "name": partner_row.get("name") or (partner[1] if isinstance(partner, list) and len(partner) > 1 else ""),
                "email": partner_row.get("email") or "",
                "phone": partner_row.get("phone") or "",
                "address": partner_row.get("contact_address") or "",
            },
            "items": items,
            "payment": "card",
            "paid": order.get("state") not in {"draft", "sent", "cancel"},
        }

    def update_order_status(self, uid: int, order_id: int, new_status: str) -> None:
        partner_id = self._users.resolve_vendor_partner_id(uid) or self._users.resolve_partner_id(uid)
        if not partner_id:
            raise LookupError("Vendor partner not found")

        product_ids = self._vendor_product_ids(partner_id)
        if not product_ids:
            raise LookupError("Vendor has no products")

        lines = self._client.search_read(
            "sale.order.line",
            [["order_id", "=", int(order_id)], ["product_id", "in", product_ids]],
            ["id"],
            limit=1,
        )
        if not lines:
            raise LookupError("Order not found for this vendor")

        odoo_state = ""
        for entry in self.STATUS_MAP:
            if entry.key == new_status:
                odoo_state = list(entry.states)[0]
                break
        
        if not odoo_state:
            raise ValueError(f"Invalid status: {new_status}")

        if odoo_state == "cancel":
            self._client.call("sale.order", "action_cancel", [[int(order_id)]])
        elif odoo_state == "done":
            try:
                self._client.call("sale.order", "action_lock", [[int(order_id)]])
            except Exception:
                pass
            self._client.write("sale.order", [int(order_id)], {"client_order_ref": "delivered"})
        elif odoo_state == "sale":
            self._client.call("sale.order", "action_confirm", [[int(order_id)]])
            self._client.write("sale.order", [int(order_id)], {"client_order_ref": "shipped"})
        else:
            self._client.write("sale.order", [int(order_id)], {"state": odoo_state, "client_order_ref": "processing"})

    def _vendor_product_ids(self, partner_id: int) -> list[int]:
        catalog_ids = self._client.search("catalog.catalog", [["vendor_id", "=", partner_id]])
        if not catalog_ids:
            return []
        template_ids = self._client.search("product.template", [["catalog_id", "in", catalog_ids]])
        if not template_ids:
            return []
        return self._client.search("product.product", [["product_tmpl_id", "in", template_ids]])

    def _order_status(self, state: str | None, ref: str | None = None) -> str:
        if ref in ("processing", "shipped", "delivered"):
            return ref
        for entry in self.STATUS_MAP:
            if state in entry.states:
                return entry.key
        return "pending"

    def _attach_product_data(self, lines: list[dict]) -> list[dict]:
        product_ids = []
        for line in lines:
            prod = line.get("product_id") or []
            if isinstance(prod, (list, tuple)) and prod:
                product_ids.append(int(prod[0]))
            elif isinstance(prod, int):
                product_ids.append(prod)

        product_rows = (
            self._client.read("product.product", list(set(product_ids)), self.PRODUCT_FIELDS)
            if product_ids
            else []
        )
        product_map = {int(r["id"]): r for r in product_rows if r.get("id")}

        out = []
        for line in lines:
            prod = line.get("product_id") or []
            prod_id = int(prod[0]) if isinstance(prod, (list, tuple)) and prod else int(prod or 0)
            prod_row = product_map.get(prod_id, {})
            img = prod_row.get("image_1920")
            image_url = ""
            if isinstance(img, str) and img and not img.isdigit():
                image_url = f"data:image/*;base64,{img}"

            out.append(
                {
                    "id": int(line.get("id") or 0),
                    "productId": prod_id,
                    "name": prod[1] if isinstance(prod, (list, tuple)) and len(prod) > 1 else prod_row.get("display_name", "Producto"),
                    "sku": prod_row.get("default_code") or f"PRD-{str(prod_id).zfill(3)}",
                    "qty": float(line.get("product_uom_qty") or 0),
                    "price": float(line.get("price_unit") or 0),
                    "subtotal": float(line.get("price_subtotal") or 0),
                    "imageUrl": image_url,
                }
            )
        return out


vendor_order_service = VendorOrderService(odoo)



