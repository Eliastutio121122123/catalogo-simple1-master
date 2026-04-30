from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta

from .client import odoo
from .users import UserService


@dataclass(frozen=True)
class DateRange:
    start: date
    end: date
    key: str

    @staticmethod
    def from_inputs(range_key: str | None, start: str | None, end: str | None) -> "DateRange":
        if start and end:
            try:
                start_date = date.fromisoformat(str(start)[:10])
                end_date = date.fromisoformat(str(end)[:10])
                if start_date > end_date:
                    start_date, end_date = end_date, start_date
                return DateRange(start=start_date, end=end_date, key="custom")
            except ValueError:
                pass

        key = (range_key or "7d").lower()
        today = date.today()
        if key == "today":
            return DateRange(start=today, end=today, key="today")
        if key == "30d":
            return DateRange(start=today - timedelta(days=29), end=today, key="30d")
        # Default 7d
        return DateRange(start=today - timedelta(days=6), end=today, key="7d")

    def start_dt(self) -> str:
        return datetime.combine(self.start, datetime.min.time()).strftime("%Y-%m-%d %H:%M:%S")

    def end_dt(self) -> str:
        return datetime.combine(self.end, datetime.max.time()).strftime("%Y-%m-%d %H:%M:%S")


class VendorReportService:
    LINE_FIELDS = [
        "order_id",
        "product_uom_qty",
        "price_subtotal",
    ]
    ORDER_FIELDS = [
        "id",
        "date_order",
        "partner_id",
        "state",
    ]

    def __init__(self, client, user_service: type[UserService] = UserService):
        self._client = client
        self._users = user_service

    def build_report(
        self,
        uid: int,
        range_key: str | None = None,
        start: str | None = None,
        end: str | None = None,
    ) -> dict:
        partner_id = self._users.resolve_vendor_partner_id(uid) or self._users.resolve_partner_id(uid)
        if not partner_id:
            raise LookupError("Vendor partner not found")

        product_ids = self._vendor_product_ids(partner_id)
        period = DateRange.from_inputs(range_key, start, end)
        if not product_ids:
            return self._empty_report(period)

        domain = [
            ["product_id", "in", product_ids],
            ["order_id.date_order", ">=", period.start_dt()],
            ["order_id.date_order", "<=", period.end_dt()],
            ["order_id.state", "in", ["draft", "sent", "sale", "done"]],
        ]

        lines = self._client.search_read(
            "sale.order.line",
            domain,
            self.LINE_FIELDS,
            limit=5000,
        )
        if not lines:
            return self._empty_report(period)

        order_totals: dict[int, dict] = {}
        for line in lines:
            order = line.get("order_id") or []
            if not order:
                continue
            oid = int(order[0])
            entry = order_totals.setdefault(oid, {"revenue": 0.0, "items": 0.0})
            entry["revenue"] += float(line.get("price_subtotal") or 0)
            entry["items"] += float(line.get("product_uom_qty") or 0)

        order_ids = list(order_totals.keys())
        orders = self._client.read("sale.order", order_ids, self.ORDER_FIELDS)

        daily: dict[str, dict] = {}
        customers_daily: dict[str, set[int]] = {}
        total_customers: set[int] = set()

        for order in orders:
            oid = int(order.get("id") or 0)
            if oid not in order_totals:
                continue
            date_order = order.get("date_order")
            if not date_order:
                continue
            day = str(date_order)[:10]
            entry = daily.setdefault(day, {"orders": 0, "revenue": 0.0})
            entry["orders"] += 1
            entry["revenue"] += order_totals[oid]["revenue"]

            partner = order.get("partner_id") or []
            partner_id = int(partner[0]) if isinstance(partner, list) and partner else 0
            if partner_id:
                customers_daily.setdefault(day, set()).add(partner_id)
                total_customers.add(partner_id)

        rows = []
        for day, info in daily.items():
            orders_count = int(info["orders"])
            revenue = float(info["revenue"])
            avg_ticket = revenue / orders_count if orders_count else 0
            customers = len(customers_daily.get(day, set()))
            conversion = (orders_count / customers * 100) if customers else 0
            rows.append(
                {
                    "day": day,
                    "orders": orders_count,
                    "revenue": round(revenue, 2),
                    "avgTicket": round(avg_ticket, 2),
                    "conversion": round(min(conversion, 100), 2),
                }
            )

        rows.sort(key=lambda r: r["day"])

        total_orders = sum(r["orders"] for r in rows)
        total_revenue = sum(r["revenue"] for r in rows)
        avg_ticket_total = total_revenue / total_orders if total_orders else 0
        conversion_total = (total_orders / len(total_customers) * 100) if total_customers else 0

        return {
            "range": {"key": period.key, "start": period.start.isoformat(), "end": period.end.isoformat()},
            "rows": rows,
            "kpi": {
                "orders": total_orders,
                "revenue": round(total_revenue, 2),
                "avgTicket": round(avg_ticket_total, 2),
                "conversion": round(min(conversion_total, 100), 2),
            },
        }

    def _empty_report(self, period: DateRange) -> dict:
        return {
            "range": {"key": period.key, "start": period.start.isoformat(), "end": period.end.isoformat()},
            "rows": [],
            "kpi": {"orders": 0, "revenue": 0, "avgTicket": 0, "conversion": 0},
        }

    def _vendor_product_ids(self, partner_id: int) -> list[int]:
        catalog_ids = self._client.search("catalog.catalog", [["vendor_id", "=", partner_id]])
        if not catalog_ids:
            return []
        template_ids = self._client.search("product.template", [["catalog_id", "in", catalog_ids]])
        if not template_ids:
            return []
        return self._client.search("product.product", [["product_tmpl_id", "in", template_ids]])


vendor_report_service = VendorReportService(odoo)
