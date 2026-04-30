from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from .client import odoo


@dataclass(frozen=True)
class ReportRow:
    id: str
    title: str
    type: str
    status: str
    owner: str
    updatedAt: str

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "type": self.type,
            "status": self.status,
            "owner": self.owner,
            "updatedAt": self.updatedAt,
        }


class AdminReportService:
    """Builds a lightweight list of business reports for the Admin UI."""

    def __init__(self, client):
        self._client = client

    def list_reports(self) -> list[dict]:
        now_iso = datetime.now(timezone.utc).isoformat()

        reports: list[ReportRow] = []
        reports.append(self._report_monthly_sales(now_iso))
        reports.append(self._report_vendor_performance(now_iso))
        reports.append(self._report_channel_split(now_iso))
        reports.append(self._report_inventory_critical(now_iso))
        reports.append(self._report_delivery_times(now_iso))
        return [r.to_dict() for r in reports]

    # --- Individual reports -------------------------------------------------

    def _report_monthly_sales(self, now_iso: str) -> ReportRow:
        rid = "REP-510"
        title = "Ventas mensuales"
        rtype = "Ventas"
        owner = "Analitica"
        try:
            since = self._month_start_utc()
            domain = [
                ["date_order", ">=", since],
                ["state", "in", ["sale", "done"]],
            ]
            count = int(self._client.search_count("sale.order", domain))
            rows = self._client.search_read(
                "sale.order",
                domain,
                ["amount_total"],
                limit=10000,
                order="id desc",
            )
            total = sum(float(r.get("amount_total") or 0) for r in (rows or []))
            # Keep the title stable for the UI; attach metrics as owner tag.
            owner = f"{owner} · {count} pedidos · {total:.0f}"
            return ReportRow(id=rid, title=title, type=rtype, status="ready", owner=owner, updatedAt=now_iso)
        except Exception:
            return ReportRow(id=rid, title=title, type=rtype, status="failed", owner=owner, updatedAt=now_iso)

    def _report_vendor_performance(self, now_iso: str) -> ReportRow:
        rid = "REP-509"
        title = "Performance de vendedores"
        rtype = "Vendedores"
        owner = "Growth"
        try:
            vendor_rows = self._client.search_read(
                "catalog.vendor",
                [],
                ["id", "partner_id", "store_name", "status", "write_date"],
                limit=200,
                order="id desc",
            )
            partner_ids: list[int] = []
            for vr in vendor_rows or []:
                partner = vr.get("partner_id") or []
                if isinstance(partner, list) and partner:
                    partner_ids.append(int(partner[0]))

            partner_ids = list(dict.fromkeys(partner_ids))  # keep order, unique
            if not partner_ids:
                return ReportRow(id=rid, title=title, type=rtype, status="ready", owner=owner, updatedAt=now_iso)

            # Score vendors by product count (fast and available in this project).
            scored: list[tuple[int, int]] = []
            for pid in partner_ids[:50]:
                try:
                    product_count = int(
                        self._client.search_count(
                            "product.template",
                            [["catalog_id.vendor_id", "=", pid], ["active", "=", True]],
                        )
                    )
                except Exception:
                    product_count = 0
                scored.append((pid, product_count))

            scored.sort(key=lambda t: t[1], reverse=True)
            top_pid, top_count = scored[0]
            top_name = self._partner_name(top_pid)

            owner = f"{owner} · top: {top_name} ({top_count} prod)"
            return ReportRow(id=rid, title=title, type=rtype, status="ready", owner=owner, updatedAt=now_iso)
        except Exception:
            return ReportRow(id=rid, title=title, type=rtype, status="failed", owner=owner, updatedAt=now_iso)

    def _report_channel_split(self, now_iso: str) -> ReportRow:
        rid = "REP-508"
        title = "Conversion por canal"
        rtype = "Marketing"
        owner = "Marketing"
        try:
            # "website_id" is present when the Website/eCommerce apps are installed.
            fields = self._safe_fields_get("sale.order")
            if "website_id" not in fields:
                return ReportRow(id=rid, title=title, type=rtype, status="processing", owner=owner, updatedAt=now_iso)

            since = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S")
            base_domain = [["date_order", ">=", since], ["state", "in", ["sale", "done"]]]
            web = int(self._client.search_count("sale.order", base_domain + [["website_id", "!=", False]]))
            manual = int(self._client.search_count("sale.order", base_domain + [["website_id", "=", False]]))
            owner = f"{owner} · web {web} · manual {manual}"
            return ReportRow(id=rid, title=title, type=rtype, status="ready", owner=owner, updatedAt=now_iso)
        except Exception:
            return ReportRow(id=rid, title=title, type=rtype, status="failed", owner=owner, updatedAt=now_iso)

    def _report_inventory_critical(self, now_iso: str) -> ReportRow:
        rid = "REP-507"
        title = "Inventario critico"
        rtype = "Inventario"
        owner = "Ops"
        try:
            fields = self._safe_fields_get("product.product")
            qty_field = "qty_available" if "qty_available" in fields else ("virtual_available" if "virtual_available" in fields else None)
            if not qty_field:
                return ReportRow(id=rid, title=title, type=rtype, status="processing", owner=owner, updatedAt=now_iso)

            threshold = 5
            domain = [["active", "=", True], [qty_field, "<=", threshold]]
            count = int(self._client.search_count("product.product", domain))
            rows = self._client.search_read(
                "product.product",
                domain,
                ["id", "display_name", qty_field, "default_code"],
                limit=10,
                order=f"{qty_field} asc,id desc",
            )
            top = ""
            if rows:
                name = rows[0].get("display_name") or rows[0].get("default_code") or ""
                top = str(name).strip()
            owner = f"{owner} · {count} items · {top or '—'}"
            return ReportRow(id=rid, title=title, type=rtype, status="ready", owner=owner, updatedAt=now_iso)
        except Exception:
            return ReportRow(id=rid, title=title, type=rtype, status="failed", owner=owner, updatedAt=now_iso)

    def _report_delivery_times(self, now_iso: str) -> ReportRow:
        rid = "REP-506"
        title = "Tiempos de entrega"
        rtype = "Logistica"
        owner = "Ops"
        try:
            # Approximate: average days between sale.order date_order and latest picking date_done (last 50 orders).
            order_rows = self._client.search_read(
                "sale.order",
                [["state", "in", ["sale", "done"]]],
                ["id", "date_order", "picking_ids"],
                limit=50,
                order="id desc",
            )
            if not order_rows:
                return ReportRow(id=rid, title=title, type=rtype, status="processing", owner=owner, updatedAt=now_iso)

            picking_ids: list[int] = []
            date_by_order: dict[int, str] = {}
            for row in order_rows:
                oid = int(row.get("id") or 0)
                if oid and row.get("date_order"):
                    date_by_order[oid] = str(row.get("date_order"))
                for pid in row.get("picking_ids") or []:
                    try:
                        picking_ids.append(int(pid))
                    except Exception:
                        continue

            picking_ids = sorted(set(picking_ids))
            if not picking_ids:
                return ReportRow(id=rid, title=title, type=rtype, status="processing", owner=owner, updatedAt=now_iso)

            fields = self._safe_fields_get("stock.picking")
            if "date_done" not in fields:
                return ReportRow(id=rid, title=title, type=rtype, status="processing", owner=owner, updatedAt=now_iso)

            pickings = self._client.read("stock.picking", picking_ids[:200], ["id", "sale_id", "date_done"])
            done_by_order: dict[int, str] = {}
            for p in pickings or []:
                sale = p.get("sale_id") or []
                oid = int(sale[0]) if isinstance(sale, list) and sale else 0
                if oid and p.get("date_done"):
                    done_by_order[oid] = str(p.get("date_done"))

            durations: list[float] = []
            for oid, ordered_at in date_by_order.items():
                done_at = done_by_order.get(oid)
                if not done_at:
                    continue
                dt_order = self._parse_odoo_dt(ordered_at)
                dt_done = self._parse_odoo_dt(done_at)
                if not dt_order or not dt_done:
                    continue
                days = (dt_done - dt_order).total_seconds() / 86400.0
                if days >= 0:
                    durations.append(days)

            if not durations:
                return ReportRow(id=rid, title=title, type=rtype, status="processing", owner=owner, updatedAt=now_iso)

            avg = sum(durations) / len(durations)
            owner = f"{owner} · promedio {avg:.1f} dias"
            return ReportRow(id=rid, title=title, type=rtype, status="ready", owner=owner, updatedAt=now_iso)
        except Exception:
            return ReportRow(id=rid, title=title, type=rtype, status="failed", owner=owner, updatedAt=now_iso)

    # --- Helpers ------------------------------------------------------------

    def _safe_fields_get(self, model: str) -> dict:
        try:
            return self._client.call(model, "fields_get", [], {}) or {}
        except Exception:
            return {}

    def _partner_name(self, partner_id: int) -> str:
        try:
            rows = self._client.read("res.partner", [int(partner_id)], ["name"])
            if rows:
                return str(rows[0].get("name") or "").strip() or f"Partner {partner_id}"
        except Exception:
            pass
        return f"Partner {partner_id}"

    @staticmethod
    def _month_start_utc() -> str:
        now = datetime.utcnow()
        start = datetime(now.year, now.month, 1)
        return start.strftime("%Y-%m-%d %H:%M:%S")

    @staticmethod
    def _parse_odoo_dt(value: str) -> datetime | None:
        raw = str(value or "").strip()
        if not raw:
            return None
        # Odoo often returns "YYYY-MM-DD HH:MM:SS"
        try:
            return datetime.strptime(raw[:19], "%Y-%m-%d %H:%M:%S")
        except Exception:
            pass
        # Sometimes ISO strings
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            return None


admin_report_service = AdminReportService(odoo)

