from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
import calendar
import os

try:
    from zoneinfo import ZoneInfo
except Exception:  # pragma: no cover
    ZoneInfo = None  # type: ignore

from .client import odoo
from .users import UserService


@dataclass(frozen=True)
class PeriodRange:
    label: str
    start: date
    end: date
    prev_start: date
    prev_end: date

    @staticmethod
    def _month_bounds(ref: date) -> tuple[date, date]:
        first = date(ref.year, ref.month, 1)
        last_day = calendar.monthrange(ref.year, ref.month)[1]
        last = date(ref.year, ref.month, last_day)
        return first, last

    @staticmethod
    def _year_bounds(ref: date) -> tuple[date, date]:
        return date(ref.year, 1, 1), date(ref.year, 12, 31)

    @classmethod
    def from_period(cls, period: str | None) -> "PeriodRange":
        today = _local_today()
        key = (period or "mes").strip().lower()
        if key in {"hoy", "dia", "día"}:
            start = end = today
            prev = today - timedelta(days=1)
            return cls("hoy", start, end, prev, prev)
        if key in {"semana", "week"}:
            start = today - timedelta(days=6)
            end = today
            prev_end = start - timedelta(days=1)
            prev_start = prev_end - timedelta(days=6)
            return cls("semana", start, end, prev_start, prev_end)
        if key in {"ano", "año", "year"}:
            start, end = cls._year_bounds(today)
            prev_year = date(today.year - 1, today.month, min(today.day, 28))
            prev_start, prev_end = cls._year_bounds(prev_year)
            return cls("año", start, end, prev_start, prev_end)

        # default: mes
        start, end = cls._month_bounds(today)
        prev_month = (start - timedelta(days=1))
        prev_start, prev_end = cls._month_bounds(prev_month)
        return cls("mes", start, end, prev_start, prev_end)

    def to_dict(self) -> dict:
        return {
            "period": self.label,
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
            "prevStart": self.prev_start.isoformat(),
            "prevEnd": self.prev_end.isoformat(),
        }


class VendorDashboardService:
    ORDER_LINE_FIELDS = [
        "id",
        "order_id",
        "product_id",
        "product_uom_qty",
        "price_subtotal",
    ]
    ORDER_FIELDS = [
        "id",
        "name",
        "state",
        "amount_total",
        "partner_id",
        "date_order",
    ]
    PRODUCT_FIELDS = [
        "id",
        "name",
        "catalog_id",
        "qty_available",
        "catalog_stock_qty",
    ]
    INVENTORY_FIELDS = [
        "id",
        "name",
        "qty_available",
        "catalog_stock_qty",
        "min_stock",
        "active",
    ]
    PENDING_STATES = {"draft", "sent"}
    SHIPPED_STATES = {"sale"}
    DELIVERED_STATES = {"done"}
    CANCELLED_STATES = {"cancel"}

    def __init__(self, client, user_service: type[UserService] = UserService):
        self._client = client
        self._users = user_service

    def build_dashboard(self, uid: int, period: str | None = None) -> dict:
        partner_id = self._users.resolve_vendor_partner_id(uid) or self._users.resolve_partner_id(uid)
        if not partner_id:
            raise LookupError("Vendor partner not found")

        period_range = PeriodRange.from_period(period)
        product_ids = self._vendor_product_ids(partner_id)
        if not product_ids:
            return self._empty_dashboard(period_range)

        current_lines = self._order_lines(product_ids, period_range.start, period_range.end)
        prev_lines = self._order_lines(product_ids, period_range.prev_start, period_range.prev_end)

        current_orders = self._orders_from_lines(current_lines)
        prev_orders = self._orders_from_lines(prev_lines)

        current_stats = self._aggregate_stats(current_lines, current_orders)
        prev_stats = self._aggregate_stats(prev_lines, prev_orders)

        inventory_stats = self._inventory_stats(product_ids)
        recent_orders = self._recent_orders(current_lines, current_orders)
        top_products = self._top_products(current_lines)
        alerts = self._alerts(inventory_stats, current_orders)
        chart = self._chart_last_7_days(product_ids)

        return {
            "period": period_range.label,
            "range": period_range.to_dict(),
            "stats": {
                "sales": self._stat_with_change(current_stats["sales"], prev_stats["sales"]),
                "orders": {
                    **self._stat_with_change(current_stats["orders"], prev_stats["orders"]),
                    "pending": current_stats["pending"],
                },
                "customers": self._stat_with_change(current_stats["customers"], prev_stats["customers"]),
                "products": {
                    "value": inventory_stats["products"],
                    "low": inventory_stats["low"],
                    "out": inventory_stats["out"],
                },
            },
            "recentOrders": recent_orders,
            "topProducts": top_products,
            "alerts": alerts,
            "chart": chart,
        }

    def _empty_dashboard(self, period_range: PeriodRange) -> dict:
        return {
            "period": period_range.label,
            "range": period_range.to_dict(),
            "stats": {
                "sales": {"value": 0, "prev": 0, "change": 0},
                "orders": {"value": 0, "prev": 0, "change": 0, "pending": 0},
                "customers": {"value": 0, "prev": 0, "change": 0},
                "products": {"value": 0, "low": 0, "out": 0},
            },
            "recentOrders": [],
            "topProducts": [],
            "alerts": [],
            "chart": {"labels": [], "values": [], "total": 0},
        }

    def _vendor_product_ids(self, partner_id: int) -> list[int]:
        catalog_ids = self._client.search("catalog.catalog", [["vendor_id", "=", partner_id]])
        if not catalog_ids:
            return []
        return self._client.search("product.template", [["catalog_id", "in", catalog_ids]])

    def _order_lines(self, product_ids: list[int], start: date, end: date) -> list[dict]:
        if not product_ids:
            return []
        start_dt, end_dt = _local_dates_to_utc_range(start, end)
        domain = [
            # sale.order.line.product_id is product.product (variant). Vendor products are product.template.
            # Filter lines by template via related field.
            ["product_id.product_tmpl_id", "in", product_ids],
            ["order_id.date_order", ">=", start_dt],
            ["order_id.date_order", "<=", end_dt],
        ]
        return self._client.search_read("sale.order.line", domain, self.ORDER_LINE_FIELDS, limit=5000)

    def _orders_from_lines(self, lines: list[dict]) -> dict[int, dict]:
        order_ids = {int(line["order_id"][0]) for line in lines if line.get("order_id")}
        if not order_ids:
            return {}
        rows = self._client.read("sale.order", list(order_ids), self.ORDER_FIELDS)
        return {int(row["id"]): row for row in rows if row.get("id")}

    def _aggregate_stats(self, lines: list[dict], orders: dict[int, dict]) -> dict:
        sales = 0.0
        orders_set = set()
        customers = set()
        for line in lines:
            sales += float(line.get("price_subtotal") or 0)
            order = line.get("order_id") or []
            if order:
                orders_set.add(int(order[0]))
        for oid in orders_set:
            order = orders.get(oid) or {}
            partner = order.get("partner_id") or []
            if partner:
                customers.add(int(partner[0]))

        pending = 0
        for oid in orders_set:
            state = (orders.get(oid) or {}).get("state")
            if state in self.PENDING_STATES:
                pending += 1

        return {
            "sales": round(sales, 2),
            "orders": len(orders_set),
            "customers": len(customers),
            "pending": pending,
        }

    def _stat_with_change(self, current: float | int, prev: float | int) -> dict:
        change = 0.0
        if prev:
            change = ((current - prev) / prev) * 100
        elif current:
            change = 100.0
        return {
            "value": current,
            "prev": prev,
            "change": round(change, 1),
        }

    def _product_stock(self, row: dict) -> float:
        if row.get("catalog_stock_qty") is not None:
            return float(row.get("catalog_stock_qty") or 0)
        return float(row.get("qty_available") or 0)

    def _inventory_stats(self, product_ids: list[int]) -> dict:
        if not product_ids:
            return {"products": 0, "low": 0, "out": 0}
        rows = self._client.read("product.template", product_ids, self.INVENTORY_FIELDS)
        low = 0
        out = 0
        for row in rows:
            stock = self._product_stock(row)
            min_stock = float(row.get("min_stock") or 0)
            if stock <= 0:
                out += 1
            elif stock <= min_stock:
                low += 1
        return {"products": len(rows), "low": low, "out": out}

    def _recent_orders(self, lines: list[dict], orders: dict[int, dict]) -> list[dict]:
        if not lines or not orders:
            return []

        line_by_order: dict[int, list[dict]] = {}
        for line in lines:
            order = line.get("order_id") or []
            if not order:
                continue
            oid = int(order[0])
            line_by_order.setdefault(oid, []).append(line)
        sorted_orders = sorted(
            orders.values(),
            key=lambda o: o.get("date_order") or "",
            reverse=True,
        )[:6]

        out = []
        for order in sorted_orders:
            oid = int(order.get("id") or 0)
            lines_for_order = line_by_order.get(oid, [])
            if not lines_for_order:
                continue
            top_line = max(lines_for_order, key=lambda l: float(l.get("product_uom_qty") or 0))
            product = top_line.get("product_id") or []
            # product_id is a (id, display_name) pair in Odoo read/search_read
            prod_name = product[1] if isinstance(product, list) and len(product) > 1 else ""
            amount = sum(float(l.get("price_subtotal") or 0) for l in lines_for_order)
            partner = order.get("partner_id") or []
            out.append(
                {
                    "id": oid,
                    "name": order.get("name") or f"SO{oid}",
                    "customer": partner[1] if isinstance(partner, list) and len(partner) > 1 else "",
                    "product": prod_name,
                    "amount": round(amount, 2),
                    "status": self._order_status(order.get("state")),
                    "date": order.get("date_order"),
                }
            )
        return out

    def _order_status(self, state: str | None) -> str:
        if state in self.PENDING_STATES:
            return "pending"
        if state in self.SHIPPED_STATES:
            return "shipped"
        if state in self.DELIVERED_STATES:
            return "delivered"
        if state in self.CANCELLED_STATES:
            return "cancelled"
        return "pending"

    def _product_map(self, product_ids: set[int]) -> dict[int, dict]:
        """Map product.template ids -> product.template rows."""
        if not product_ids:
            return {}
        rows = self._client.read("product.template", list(product_ids), self.PRODUCT_FIELDS)
        return {int(r["id"]): r for r in rows if r.get("id")}

    def _variant_template_map(self, variant_ids: set[int]) -> dict[int, int]:
        """Map product.product ids -> product.template ids."""
        if not variant_ids:
            return {}
        rows = self._client.read("product.product", list(variant_ids), ["id", "product_tmpl_id"])
        out: dict[int, int] = {}
        for row in rows or []:
            vid = row.get("id")
            tmpl = (row.get("product_tmpl_id") or [])
            if not vid or not tmpl:
                continue
            try:
                out[int(vid)] = int(tmpl[0])
            except Exception:
                continue
        return out

    def _top_products(self, lines: list[dict]) -> list[dict]:
        if not lines:
            return []
        agg: dict[int, dict] = {}
        variant_ids: set[int] = set()
        for line in lines:
            prod = line.get("product_id") or []
            if not prod:
                continue
            try:
                variant_ids.add(int(prod[0]))
            except Exception:
                continue

        variant_to_template = self._variant_template_map(variant_ids)
        template_ids = set(variant_to_template.values())
        products = self._product_map(template_ids)

        for line in lines:
            prod = line.get("product_id") or []
            if not prod:
                continue
            try:
                vid = int(prod[0])
            except Exception:
                continue
            tid = variant_to_template.get(vid)
            if not tid:
                continue
            entry = agg.setdefault(tid, {"sold": 0.0, "revenue": 0.0})
            entry["sold"] += float(line.get("product_uom_qty") or 0)
            entry["revenue"] += float(line.get("price_subtotal") or 0)

        ranked = sorted(
            agg.items(),
            key=lambda item: (item[1]["sold"], item[1]["revenue"]),
            reverse=True,
        )[:5]

        out = []
        for pid, stats in ranked:
            prod = products.get(pid) or {}
            catalog = prod.get("catalog_id") or []
            stock = self._product_stock(prod)
            out.append(
                {
                    "id": pid,
                    "name": prod.get("name") or "",
                    "catalog": catalog[1] if isinstance(catalog, list) and len(catalog) > 1 else "",
                    "sold": round(stats["sold"], 2),
                    "revenue": round(stats["revenue"], 2),
                    "stock": stock,
                }
            )
        return out

    def _alerts(self, inventory: dict, orders: dict[int, dict]) -> list[dict]:
        alerts = []
        if inventory.get("out"):
            alerts.append(
                {
                    "severity": "red",
                    "message": f"{inventory['out']} productos sin stock disponible",
                    "action": "Reponer",
                    "path": "/vendor/inventory",
                }
            )
        if inventory.get("low"):
            alerts.append(
                {
                    "severity": "amber",
                    "message": f"{inventory['low']} productos con stock bajo",
                    "action": "Revisar",
                    "path": "/vendor/inventory",
                }
            )
        pending = sum(1 for o in orders.values() if o.get("state") in self.PENDING_STATES)
        if pending:
            alerts.append(
                {
                    "severity": "amber",
                    "message": f"{pending} pedidos pendientes de confirmacion",
                    "action": "Ver pedidos",
                    "path": "/vendor/orders",
                }
            )
        return alerts[:4]

    def _chart_last_7_days(self, product_ids: list[int]) -> dict:
        if not product_ids:
            return {"labels": [], "values": [], "total": 0}
        end = _local_today()
        start = end - timedelta(days=6)
        lines = self._order_lines(product_ids, start, end)
        orders = self._orders_from_lines(lines)

        buckets = {}
        for i in range(7):
            day = start + timedelta(days=i)
            buckets[day.isoformat()] = 0.0

        local_tz = _local_tzinfo()
        for line in lines:
            order = line.get("order_id") or []
            if not order:
                continue
            oid = int(order[0])
            o = orders.get(oid) or {}
            date_order = o.get("date_order")
            if not date_order:
                continue
            try:
                parsed = datetime.fromisoformat(str(date_order).replace("Z", "").replace(" ", "T"))
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=timezone.utc)
                if local_tz:
                    parsed = parsed.astimezone(local_tz)
                day = parsed.date().isoformat()
            except ValueError:
                continue
            if day in buckets:
                buckets[day] += float(line.get("price_subtotal") or 0)

        labels = []
        values = []
        total = 0.0
        day_names = ["L", "M", "X", "J", "V", "S", "D"]
        for i in range(7):
            day = start + timedelta(days=i)
            labels.append(day_names[day.weekday()])
            value = round(buckets.get(day.isoformat(), 0.0), 2)
            values.append(value)
            total += value

        return {"labels": labels, "values": values, "total": round(total, 2)}


vendor_dashboard_service = VendorDashboardService(odoo)


def _timezone_name() -> str:
    return (
        os.getenv("APP_TIMEZONE")
        or os.getenv("TIMEZONE")
        or os.getenv("TZ")
        or "America/Santo_Domingo"
    )


def _local_tzinfo():
    if ZoneInfo is None:
        name = _timezone_name()
        if name == "America/Santo_Domingo":
            return timezone(timedelta(hours=-4))
        return None
    name = _timezone_name()
    try:
        return ZoneInfo(name)
    except Exception:
        if name == "America/Santo_Domingo":
            return timezone(timedelta(hours=-4))
        return None


def _local_today() -> date:
    tz = _local_tzinfo()
    if tz:
        return datetime.now(tz).date()
    return date.today()


def _local_dates_to_utc_range(start: date, end: date) -> tuple[str, str]:
    """
    Convert local-day bounds to UTC strings for Odoo domain filters.

    Odoo stores datetimes in UTC. When containers run in UTC but the UI is in a
    local timezone (e.g., America/Santo_Domingo), "hoy" and "mes" must be
    computed in local time but queried in UTC.
    """
    tz = _local_tzinfo()
    if not tz:
        return f"{start.isoformat()} 00:00:00", f"{end.isoformat()} 23:59:59"

    start_local = datetime.combine(start, time.min, tzinfo=tz)
    end_local = datetime.combine(end, time.max.replace(microsecond=0), tzinfo=tz)
    start_utc = start_local.astimezone(timezone.utc)
    end_utc = end_local.astimezone(timezone.utc)
    return start_utc.strftime("%Y-%m-%d %H:%M:%S"), end_utc.strftime("%Y-%m-%d %H:%M:%S")
