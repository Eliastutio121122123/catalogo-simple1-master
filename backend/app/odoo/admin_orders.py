from __future__ import annotations

from .client import odoo


class AdminOrderService:
    ORDER_FIELDS = [
        "id",
        "name",
        "state",
        "amount_total",
        "partner_id",
        "date_order",
        "write_date",
        "order_line",
        "invoice_ids",
        "origin",
    ]
    LINE_FIELDS = ["id", "order_id", "product_id"]
    PRODUCT_FIELDS = ["id", "product_tmpl_id"]
    TEMPLATE_FIELDS = ["id", "catalog_id"]
    CATALOG_FIELDS = ["id", "vendor_id"]

    PAID_STATES = {"paid", "in_payment"}

    STATUS_MAP = {
        "draft": "review",
        "sent": "review",
        "sale": "processing",
        "done": "shipped",
        "cancel": "cancelled",
    }

    def __init__(self, client):
        self._client = client

    def list_orders(
        self,
        q: str | None = None,
        status: str | None = None,
        channel: str | None = None,
        limit: int = 200,
        offset: int = 0,
    ) -> dict:
        domain = self._build_domain(q, status)
        rows = self._client.search_read(
            "sale.order",
            domain,
            self.ORDER_FIELDS,
            limit=limit,
            offset=offset,
            order="id desc",
        )

        if not rows:
            return {"items": [], "stats": {"total": 0}, "filters": {"statuses": [], "channels": []}}

        try:
            invoice_map = self._invoice_payment_map(rows)
        except Exception:
            invoice_map = {}

        try:
            vendor_map = self._vendor_map(rows)
        except Exception:
            vendor_map = {}

        items = [self._to_api(row, invoice_map, vendor_map) for row in rows]

        if status and status != "all":
            items = [row for row in items if row.get("status") == status]
        if channel and channel != "all":
            items = [row for row in items if row.get("channel") == channel]

        stats = self._stats(items)
        filters = self._filters(items)
        return {"items": items, "stats": stats, "filters": filters}

    def _build_domain(self, q: str | None, status: str | None) -> list:
        domain: list = []
        if q:
            term = q.strip()
            if term:
                domain = ["|", ["name", "ilike", term], ["partner_id.name", "ilike", term]]
        if status and status != "all":
            if status == "cancelled":
                domain.append(["state", "=", "cancel"])
            elif status == "review":
                domain.append(["state", "in", ["draft", "sent"]])
            elif status == "processing":
                domain.append(["state", "=", "sale"])
            elif status == "shipped":
                domain.append(["state", "=", "done"])
        return domain

    def _invoice_payment_map(self, rows: list[dict]) -> dict[int, str]:
        invoice_ids: list[int] = []
        for row in rows:
            invoice_ids += [int(i) for i in (row.get("invoice_ids") or []) if i]
        if not invoice_ids:
            return {}
        invoices = self._client.read(
            "account.move",
            list(set(invoice_ids)),
            ["id", "payment_state"],
        )
        return {int(inv["id"]): (inv.get("payment_state") or "") for inv in invoices if inv.get("id")}

    def _vendor_map(self, rows: list[dict]) -> dict[int, str]:
        line_ids: list[int] = []
        for row in rows:
            line_ids += [int(lid) for lid in (row.get("order_line") or []) if lid]
        if not line_ids:
            return {}

        lines = self._client.read("sale.order.line", list(set(line_ids)), self.LINE_FIELDS)
        products_by_order: dict[int, list[int]] = {}
        product_ids: list[int] = []
        for line in lines:
            order = line.get("order_id") or []
            if not order:
                continue
            order_id = int(order[0])
            prod = line.get("product_id") or []
            prod_id = int(prod[0]) if isinstance(prod, (list, tuple)) and prod else int(prod or 0)
            if not prod_id:
                continue
            product_ids.append(prod_id)
            products_by_order.setdefault(order_id, []).append(prod_id)

        if not product_ids:
            return {}

        products = self._client.read("product.product", list(set(product_ids)), self.PRODUCT_FIELDS)
        tmpl_by_product = {
            int(p["id"]): int(p.get("product_tmpl_id")[0])
            for p in products
            if p.get("id") and p.get("product_tmpl_id")
        }
        if not tmpl_by_product:
            return {}

        tmpl_ids = list(set(tmpl_by_product.values()))
        templates = self._client.read("product.template", tmpl_ids, self.TEMPLATE_FIELDS)
        catalog_by_template = {
            int(t["id"]): int(t.get("catalog_id")[0])
            for t in templates
            if t.get("id") and t.get("catalog_id")
        }
        if not catalog_by_template:
            return {}

        catalog_ids = list(set(catalog_by_template.values()))
        catalogs = self._client.read("catalog.catalog", catalog_ids, self.CATALOG_FIELDS)
        vendor_by_catalog = {}
        for catalog in catalogs:
            vendor = catalog.get("vendor_id") or []
            if not vendor:
                continue
            vendor_by_catalog[int(catalog.get("id") or 0)] = vendor[1] if isinstance(vendor, list) and len(vendor) > 1 else ""

        vendor_by_order: dict[int, str] = {}
        for order_id, prod_ids in products_by_order.items():
            vendor_names = []
            for pid in prod_ids:
                tmpl_id = tmpl_by_product.get(pid)
                if not tmpl_id:
                    continue
                catalog_id = catalog_by_template.get(tmpl_id)
                if not catalog_id:
                    continue
                name = vendor_by_catalog.get(catalog_id) or ""
                if name:
                    vendor_names.append(name)
            unique = sorted(set(vendor_names))
            if not unique:
                vendor_by_order[order_id] = "-"
            elif len(unique) == 1:
                vendor_by_order[order_id] = unique[0]
            else:
                vendor_by_order[order_id] = "Multiple"
        return vendor_by_order

    def _is_paid(self, invoice_ids: list[int], invoice_map: dict[int, str]) -> bool:
        for inv_id in invoice_ids or []:
            state = (invoice_map.get(int(inv_id)) or "").lower()
            if state in self.PAID_STATES:
                return True
        return False

    def _status(self, state: str | None, paid: bool) -> str:
        if paid:
            return "paid"
        return self.STATUS_MAP.get(state or "", "processing")

    def _channel(self, origin: str | None) -> str:
        origin = (origin or "").strip().lower()
        if "mobile" in origin or "app" in origin:
            return "mobile"
        if origin:
            return "web"
        return "manual"

    def _to_api(self, rec: dict, invoice_map: dict[int, str], vendor_map: dict[int, str]) -> dict:
        order_id = int(rec.get("id") or 0)
        invoice_ids = [int(i) for i in (rec.get("invoice_ids") or []) if i]
        paid = self._is_paid(invoice_ids, invoice_map)
        status = self._status(rec.get("state"), paid)
        partner = rec.get("partner_id") or []
        customer = partner[1] if isinstance(partner, list) and len(partner) > 1 else "-"
        name = rec.get("name") or f"SO{order_id}"
        return {
            "id": name,
            "rawId": order_id,
            "customer": customer,
            "vendor": vendor_map.get(order_id, "-"),
            "total": float(rec.get("amount_total") or 0),
            "status": status,
            "state": rec.get("state") or "",
            "channel": self._channel(rec.get("origin")),
            "date": rec.get("date_order"),
            "updatedAt": rec.get("write_date") or rec.get("date_order"),
            "paid": paid,
        }

    def _stats(self, items: list[dict]) -> dict:
        total = len(items)
        processing = len([o for o in items if o.get("status") == "processing"])
        shipped = len([o for o in items if o.get("status") == "shipped"])
        cancelled = len([o for o in items if o.get("status") == "cancelled"])
        paid = len([o for o in items if o.get("status") == "paid"])
        review = len([o for o in items if o.get("status") == "review"])
        return {
            "total": total,
            "processing": processing,
            "shipped": shipped,
            "cancelled": cancelled,
            "paid": paid,
            "review": review,
        }

    def _filters(self, items: list[dict]) -> dict:
        statuses = sorted({o.get("status") for o in items if o.get("status")})
        channels = sorted({o.get("channel") for o in items if o.get("channel")})
        return {"statuses": statuses, "channels": channels}


admin_order_service = AdminOrderService(odoo)
