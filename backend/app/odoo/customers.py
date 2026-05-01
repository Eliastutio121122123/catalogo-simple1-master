from .client import odoo


PARTNER_FIELDS = ["id", "name", "email", "phone", "company_name"]
ORDER_FIELDS = ["id", "partner_id", "amount_total", "date_order", "state"]


class VendorCustomerService:
    @staticmethod
    def _vendor_product_ids(partner_id: int) -> list[int]:
        """Return product.product (variant) IDs owned by this vendor.

        sale.order.line.product_id references product.product, NOT product.template.
        Previous bug: was returning product.template IDs → no orders matched.
        """
        catalog_ids = odoo.search("catalog.catalog", [["vendor_id", "=", partner_id]])
        if not catalog_ids:
            return []
        template_ids = odoo.search("product.template", [["catalog_id", "in", catalog_ids]])
        if not template_ids:
            return []
        return odoo.search("product.product", [["product_tmpl_id", "in", template_ids]])

    @staticmethod
    def _orders_for_products(product_ids: list[int]) -> list[dict]:
        if not product_ids:
            return []
        line_ids = odoo.search(
            "sale.order.line",
            [
                ["product_id", "in", product_ids],
                ["order_id.state", "not in", ["cancel"]],
            ],
        )
        if not line_ids:
            return []
        lines = odoo.read("sale.order.line", line_ids, ["order_id"])
        order_ids = {
            int(line["order_id"][0])
            for line in lines
            if line.get("order_id")
        }
        if not order_ids:
            return []
        return odoo.read("sale.order", list(order_ids), ORDER_FIELDS)

    @classmethod
    def list_vendor_customers(
        cls,
        partner_id: int,
        limit: int = 50,
        offset: int = 0,
        search: str | None = None,
    ) -> list[dict]:
        product_ids = cls._vendor_product_ids(partner_id)
        orders = cls._orders_for_products(product_ids)
        if not orders:
            return []

        stats: dict[int, dict] = {}
        for order in orders:
            partner = order.get("partner_id") or []
            if not partner:
                continue
            pid = int(partner[0])
            entry = stats.setdefault(
                pid,
                {"order_count": 0, "total_spent": 0.0, "last_order_date": None},
            )
            entry["order_count"] += 1
            entry["total_spent"] += float(order.get("amount_total") or 0)
            date_order = order.get("date_order")
            if date_order and (
                entry["last_order_date"] is None or date_order > entry["last_order_date"]
            ):
                entry["last_order_date"] = date_order

        partner_ids = list(stats.keys())
        if not partner_ids:
            return []

        domain = [["id", "in", partner_ids]]
        if search:
            term = search.strip()
            if term:
                domain = [
                    "&", ["id", "in", partner_ids],
                    "|", ["name", "ilike", term], ["email", "ilike", term],
                ]

        partners = odoo.search_read("res.partner", domain, PARTNER_FIELDS, limit=1000)
        enriched = []
        for partner in partners:
            pid = int(partner.get("id") or 0)
            if pid in stats:
                item = dict(partner)
                item.update(stats[pid])
                enriched.append(item)

        enriched.sort(key=lambda p: p.get("last_order_date") or "", reverse=True)
        return enriched[offset: offset + limit]

    @classmethod
    def get_vendor_customer(cls, partner_id: int, customer_id: int) -> dict:
        customers = cls.list_vendor_customers(partner_id, limit=2000, offset=0)
        for customer in customers:
            if int(customer.get("id") or 0) == int(customer_id):
                return customer
        raise LookupError("Customer not found for vendor")
