from __future__ import annotations

from datetime import datetime, timedelta

from .client import odoo


class AdminDashboardService:
    """Aggregates KPIs, recent orders, sales chart, top categories, and alerts."""

    def __init__(self, client):
        self._client = client

    # ── Public ────────────────────────────────────────────────────────────────

    def summary(self, range_key: str = "7d") -> dict:
        since, prev_since, prev_end = self._range_dates(range_key)

        # KPIs
        kpis = self._kpis(since, prev_since, prev_end)

        # Sales chart (daily totals)
        sales_chart = self._sales_chart(since)

        # Top categories
        top_categories = self._top_categories(since)

        # Recent orders (last 5)
        recent_orders = self._recent_orders(limit=5)

        # Recent audit alerts
        alerts = self._recent_alerts(limit=5)

        return {
            "kpis": kpis,
            "salesChart": sales_chart,
            "topCategories": top_categories,
            "recentOrders": recent_orders,
            "alerts": alerts,
        }

    # ── KPIs ──────────────────────────────────────────────────────────────────

    def _kpis(self, since: str, prev_since: str, prev_end: str) -> list:
        # Current period
        orders_domain = [["date_order", ">=", since]]
        orders = self._client.search_read(
            "sale.order", orders_domain,
            ["id", "amount_total", "state"],
            limit=10000, order="id desc",
        )
        total_orders = len(orders)
        gmv = sum(float(o.get("amount_total") or 0) for o in orders)

        # Previous period
        prev_domain = [
            ["date_order", ">=", prev_since],
            ["date_order", "<", prev_end],
        ]
        prev_orders = self._client.search_read(
            "sale.order", prev_domain,
            ["id", "amount_total"],
            limit=10000,
        )
        prev_total = len(prev_orders)
        prev_gmv = sum(float(o.get("amount_total") or 0) for o in prev_orders)

        # Active vendors
        try:
            vendors_count = self._client.search_count(
                "catalog.vendor", [["status", "=", "active"]]
            )
        except Exception:
            vendors_count = 0

        try:
            prev_vendors = self._client.search_count(
                "catalog.vendor", []
            )
        except Exception:
            prev_vendors = vendors_count

        # Open alerts
        try:
            alerts_count = self._client.search_count(
                "catalog.audit.log", [["severity", "in", ["critical", "high"]]]
            )
        except Exception:
            alerts_count = 0

        return [
            {
                "id": "gmv",
                "label": "GMV mensual",
                "value": gmv,
                "prev": prev_gmv,
                "delta": self._delta(gmv, prev_gmv),
                "trend": "up" if gmv >= prev_gmv else "down",
                "format": "money",
            },
            {
                "id": "orders",
                "label": "Pedidos",
                "value": total_orders,
                "prev": prev_total,
                "delta": self._delta(total_orders, prev_total),
                "trend": "up" if total_orders >= prev_total else "down",
                "format": "number",
            },
            {
                "id": "vendors",
                "label": "Vendedores activos",
                "value": vendors_count,
                "prev": prev_vendors,
                "delta": self._delta(vendors_count, prev_vendors),
                "trend": "up" if vendors_count >= prev_vendors else "down",
                "format": "number",
            },
            {
                "id": "alerts",
                "label": "Alertas abiertas",
                "value": alerts_count,
                "prev": 0,
                "delta": f"-{alerts_count}" if alerts_count else "0",
                "trend": "down" if alerts_count else "up",
                "format": "number",
            },
        ]

    # ── Sales Chart ───────────────────────────────────────────────────────────

    def _sales_chart(self, since: str) -> list:
        orders = self._client.search_read(
            "sale.order",
            [["date_order", ">=", since]],
            ["date_order", "amount_total"],
            limit=10000,
            order="date_order asc",
        )
        day_map: dict[str, float] = {}
        day_names = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
        for o in orders:
            raw = o.get("date_order")
            if not raw:
                continue
            try:
                dt = datetime.fromisoformat(str(raw).replace("Z", "+00:00")) if "T" in str(raw) else datetime.strptime(str(raw)[:10], "%Y-%m-%d")
            except Exception:
                continue
            day_label = day_names[dt.weekday()]
            day_map[day_label] = day_map.get(day_label, 0) + float(o.get("amount_total") or 0)

        result = []
        for name in day_names:
            result.append({"day": name, "value": round(day_map.get(name, 0), 2)})
        return result

    # ── Top Categories ────────────────────────────────────────────────────────

    def _top_categories(self, since: str) -> list:
        colors = ["#2563eb", "#06b6d4", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#ef4444"]

        try:
            orders = self._client.search_read(
                "sale.order",
                [["date_order", ">=", since], ["state", "not in", ["cancel"]]],
                ["id", "order_line"],
                limit=5000,
            )
            line_ids = []
            for o in orders:
                line_ids += [int(lid) for lid in (o.get("order_line") or []) if lid]

            if not line_ids:
                return []

            lines = self._client.read(
                "sale.order.line", list(set(line_ids)),
                ["product_id", "price_subtotal"],
            )

            product_ids = []
            product_revenue: dict[int, float] = {}
            for line in lines:
                prod = line.get("product_id") or []
                pid = int(prod[0]) if isinstance(prod, (list, tuple)) and prod else 0
                if pid:
                    product_ids.append(pid)
                    product_revenue[pid] = product_revenue.get(pid, 0) + float(line.get("price_subtotal") or 0)

            if not product_ids:
                return []

            products = self._client.read(
                "product.product", list(set(product_ids)),
                ["id", "categ_id"],
            )

            cat_revenue: dict[str, float] = {}
            for p in products:
                cat = p.get("categ_id") or []
                cat_name = cat[1] if isinstance(cat, list) and len(cat) > 1 else "Sin categoría"
                cat_revenue[cat_name] = cat_revenue.get(cat_name, 0) + product_revenue.get(int(p["id"]), 0)

            total = sum(cat_revenue.values()) or 1
            sorted_cats = sorted(cat_revenue.items(), key=lambda x: x[1], reverse=True)[:5]

            result = []
            for i, (name, rev) in enumerate(sorted_cats):
                pct = round((rev / total) * 100)
                result.append({
                    "name": name,
                    "value": pct,
                    "color": colors[i % len(colors)],
                })
            return result

        except Exception:
            return []

    # ── Recent Orders ─────────────────────────────────────────────────────────

    def _recent_orders(self, limit: int = 5) -> list:
        rows = self._client.search_read(
            "sale.order", [],
            ["id", "name", "partner_id", "amount_total", "state", "date_order", "invoice_ids"],
            limit=limit,
            order="id desc",
        )

        try:
            invoice_ids = []
            for r in rows:
                invoice_ids += [int(i) for i in (r.get("invoice_ids") or []) if i]
            inv_map = {}
            if invoice_ids:
                invoices = self._client.read("account.move", list(set(invoice_ids)), ["id", "payment_state"])
                inv_map = {int(inv["id"]): (inv.get("payment_state") or "") for inv in invoices if inv.get("id")}
        except Exception:
            inv_map = {}

        items = []
        for row in rows:
            partner = row.get("partner_id") or []
            customer = partner[1] if isinstance(partner, list) and len(partner) > 1 else "-"

            inv_list = [int(i) for i in (row.get("invoice_ids") or []) if i]
            paid = any((inv_map.get(iid) or "").lower() in {"paid", "in_payment"} for iid in inv_list)

            state = row.get("state") or ""
            if paid:
                status = "paid"
            elif state == "cancel":
                status = "cancelled"
            elif state in ("draft", "sent"):
                status = "review"
            elif state == "done":
                status = "shipped"
            else:
                status = "processing"

            items.append({
                "id": row.get("name") or f"SO{row.get('id')}",
                "rawId": row.get("id"),
                "vendor": "-",
                "customer": customer,
                "total": float(row.get("amount_total") or 0),
                "status": status,
            })
        return items

    # ── Alerts ────────────────────────────────────────────────────────────────

    def _recent_alerts(self, limit: int = 5) -> list:
        try:
            rows = self._client.search_read(
                "catalog.audit.log", [],
                ["id", "code", "action", "severity", "occurred_at"],
                limit=limit,
                order="id desc",
            )
        except Exception:
            return []

        items = []
        for row in rows:
            severity = row.get("severity") or "low"
            alert_type = "info"
            if severity in ("critical", "high"):
                alert_type = "critical"
            elif severity in ("medium", "warning"):
                alert_type = "warning"

            time_str = ""
            raw_at = row.get("occurred_at")
            if raw_at:
                try:
                    dt = datetime.fromisoformat(str(raw_at).replace("Z", "+00:00")) if "T" in str(raw_at) else datetime.strptime(str(raw_at)[:19], "%Y-%m-%d %H:%M:%S")
                    diff = datetime.utcnow() - dt
                    if diff.total_seconds() < 3600:
                        time_str = f"hace {int(diff.total_seconds() // 60)} min"
                    elif diff.total_seconds() < 86400:
                        time_str = f"hace {int(diff.total_seconds() // 3600)}h"
                    else:
                        time_str = f"hace {diff.days}d"
                except Exception:
                    time_str = ""

            items.append({
                "id": row.get("code") or f"AL-{row.get('id')}",
                "label": row.get("action") or "Evento",
                "type": alert_type,
                "time": time_str,
            })
        return items

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _range_dates(self, range_key: str) -> tuple[str, str, str]:
        now = datetime.utcnow()
        key = (range_key or "7d").strip().lower()
        if key == "24h":
            since = now - timedelta(hours=24)
            prev_end = since
            prev_since = prev_end - timedelta(hours=24)
        elif key == "30d":
            since = now - timedelta(days=30)
            prev_end = since
            prev_since = prev_end - timedelta(days=30)
        else:
            since = now - timedelta(days=7)
            prev_end = since
            prev_since = prev_end - timedelta(days=7)
        fmt = "%Y-%m-%d %H:%M:%S"
        return since.strftime(fmt), prev_since.strftime(fmt), prev_end.strftime(fmt)

    def _delta(self, current, previous) -> str:
        if not previous:
            return "+100%" if current else "0%"
        pct = ((current - previous) / abs(previous)) * 100
        sign = "+" if pct >= 0 else ""
        return f"{sign}{pct:.1f}%"


admin_dashboard_service = AdminDashboardService(odoo)
