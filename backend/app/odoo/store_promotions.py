from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from .client import odoo


@dataclass(frozen=True)
class AppliedPromotion:
    vendor_partner_id: int
    promotion_id: int
    name: str
    promotion_type: str
    value: float
    min_order_amount: float | None
    max_discount_amount: float | None
    discount_amount: float
    subtotal: float


class StorePromotionService:
    MODEL = "catalog.promotion"
    FIELDS = [
        "id",
        "name",
        "promotion_type",
        "value",
        "min_order_amount",
        "max_discount_amount",
        "start_date",
        "end_date",
        "usage_limit",
        "used_count",
        "status",
        "vendor_partner_id",
    ]

    def __init__(self, client):
        self._client = client

    def quote(self, *, lines: list[dict]) -> dict:
        """Compute vendor promotions for the given cart lines.

        Input lines: [{"product_id": int, "qty": float, "price": float(optional)}]
        Output:
          {
            "subtotal": float,              # before promotions (Odoo list_price)
            "promoSubtotal": float,         # after promotions
            "discountAmount": float,        # subtotal - promoSubtotal
            "lines": [
              {
                "product_id": int,
                "qty": float,
                "base_price": float,
                "price": float,             # after promotions
                "discount_amount": float,
                "vendor_partner_id": int|None,
                "promotion": {...}|None,
              }
            ],
            "appliedPromotions": [ ... ]
          }
        """
        parsed = self._parse_lines(lines)
        if not parsed:
            return {
                "subtotal": 0.0,
                "promoSubtotal": 0.0,
                "discountAmount": 0.0,
                "lines": [],
                "appliedPromotions": [],
            }

        enriched = self._enrich_lines(parsed)
        by_vendor: dict[int, list[dict]] = {}
        for line in enriched:
            vendor_id = line.get("vendor_partner_id")
            if vendor_id:
                by_vendor.setdefault(int(vendor_id), []).append(line)

        vendor_subtotals = {vid: self._subtotal(by_vendor[vid], key="base_price") for vid in by_vendor.keys()}
        promos_by_vendor = self._load_active_promotions(list(vendor_subtotals.keys()))

        applied_promos: dict[int, AppliedPromotion] = {}
        for vendor_id, subtotal in vendor_subtotals.items():
            promo = self._best_promotion(promos_by_vendor.get(vendor_id) or [], subtotal=subtotal)
            if promo is None:
                continue
            disc = self._promotion_discount_amount(promo, subtotal=subtotal)
            disc = min(disc, subtotal)
            disc = max(disc, 0.0)
            if disc <= 0:
                continue

            applied_promos[vendor_id] = AppliedPromotion(
                vendor_partner_id=int(vendor_id),
                promotion_id=int(promo.get("id") or 0),
                name=str(promo.get("name") or "").strip(),
                promotion_type=str(promo.get("promotion_type") or "percent").strip().lower(),
                value=float(promo.get("value") or 0),
                min_order_amount=self._as_float_or_none(promo.get("min_order_amount")),
                max_discount_amount=self._as_float_or_none(promo.get("max_discount_amount")),
                discount_amount=float(self._round2(Decimal(str(disc)))),
                subtotal=float(subtotal),
            )

        adjusted_lines: list[dict] = []
        for line in enriched:
            vendor_id = line.get("vendor_partner_id")
            base_price = float(line.get("base_price") or 0)
            qty = float(line.get("qty") or 0)
            if qty <= 0:
                continue

            vendor_promo = applied_promos.get(int(vendor_id)) if vendor_id else None
            adjusted = dict(line)
            adjusted["promotion"] = None
            adjusted["price"] = float(self._round2(Decimal(str(base_price))))
            adjusted["discount_amount"] = 0.0

            if vendor_promo and vendor_promo.discount_amount > 0:
                adjusted_lines.append(adjusted)
            else:
                adjusted_lines.append(adjusted)

        # Distribute discount per vendor across its lines.
        for vendor_id, promo in applied_promos.items():
            vendor_lines = [l for l in adjusted_lines if int(l.get("vendor_partner_id") or 0) == int(vendor_id)]
            self._apply_discount_to_lines(vendor_lines, total_discount=promo.discount_amount)
            for l in vendor_lines:
                l["promotion"] = {
                    "vendor_partner_id": promo.vendor_partner_id,
                    "id": promo.promotion_id,
                    "name": promo.name,
                    "type": promo.promotion_type,
                    "value": promo.value,
                    "minOrder": promo.min_order_amount,
                    "maxDiscount": promo.max_discount_amount,
                }

        subtotal = self._subtotal(adjusted_lines, key="base_price")
        promo_subtotal = self._subtotal(adjusted_lines, key="price")
        discount_amount = max(0.0, float(self._round2(Decimal(str(subtotal - promo_subtotal)))))

        return {
            "subtotal": float(subtotal),
            "promoSubtotal": float(promo_subtotal),
            "discountAmount": float(discount_amount),
            "lines": [
                {
                    "product_id": int(l.get("product_id") or 0),
                    "qty": float(l.get("qty") or 0),
                    "base_price": float(l.get("base_price") or 0),
                    "price": float(l.get("price") or 0),
                    "discount_amount": float(l.get("discount_amount") or 0),
                    "vendor_partner_id": int(l.get("vendor_partner_id") or 0) if l.get("vendor_partner_id") else None,
                    "promotion": l.get("promotion"),
                }
                for l in adjusted_lines
                if int(l.get("product_id") or 0) > 0 and float(l.get("qty") or 0) > 0
            ],
            "appliedPromotions": [
                {
                    "vendor_partner_id": p.vendor_partner_id,
                    "id": p.promotion_id,
                    "name": p.name,
                    "type": p.promotion_type,
                    "value": p.value,
                    "minOrder": p.min_order_amount,
                    "maxDiscount": p.max_discount_amount,
                    "discountAmount": p.discount_amount,
                    "subtotal": p.subtotal,
                }
                for p in applied_promos.values()
            ],
        }

    def apply_to_lines(self, *, lines: list[dict]) -> tuple[list[dict], dict]:
        quote = self.quote(lines=lines)
        adjusted = [
            {"product_id": int(l["product_id"]), "qty": float(l["qty"]), "price": float(l["price"])}
            for l in (quote.get("lines") or [])
            if int(l.get("product_id") or 0) > 0 and float(l.get("qty") or 0) > 0
        ]
        return adjusted, quote

    @staticmethod
    def _parse_lines(lines: list[dict]) -> list[dict]:
        out: list[dict] = []
        for line in lines or []:
            if not isinstance(line, dict):
                continue
            try:
                product_id = int(line.get("product_id") or line.get("productId") or 0)
                qty = float(line.get("qty") or line.get("quantity") or 0)
            except Exception:
                continue
            if product_id <= 0 or qty <= 0:
                continue
            # price is optional (client value is ignored if we can read Odoo list_price)
            try:
                price = float(line.get("price") or 0)
            except Exception:
                price = 0.0
            out.append({"product_id": product_id, "qty": qty, "price": price})
        return out

    def _enrich_lines(self, lines: list[dict]) -> list[dict]:
        product_ids = list({int(l["product_id"]) for l in lines if int(l.get("product_id") or 0) > 0})
        template_rows = []
        try:
            template_rows = self._client.read("product.template", product_ids, ["id", "list_price", "catalog_id"])
        except Exception:
            template_rows = []

        tmpl_map = {int(r.get("id") or 0): r for r in (template_rows or []) if r.get("id")}
        catalog_ids: set[int] = set()
        for row in tmpl_map.values():
            cat = row.get("catalog_id") or []
            cid = int(cat[0]) if isinstance(cat, (list, tuple)) and cat else None
            if cid:
                catalog_ids.add(cid)

        catalog_to_vendor: dict[int, int] = {}
        if catalog_ids:
            try:
                catalog_rows = self._client.read("catalog.catalog", list(catalog_ids), ["id", "vendor_id"])
            except Exception:
                catalog_rows = []
            for c in catalog_rows or []:
                cid = int(c.get("id") or 0)
                v = c.get("vendor_id") or []
                vid = int(v[0]) if isinstance(v, (list, tuple)) and v else None
                if cid and vid:
                    catalog_to_vendor[cid] = vid

        enriched: list[dict] = []
        for line in lines:
            pid = int(line["product_id"])
            row = tmpl_map.get(pid) or {}
            base_price = row.get("list_price")
            if base_price is None:
                base_price = line.get("price") or 0
            try:
                base_price = float(base_price or 0)
            except Exception:
                base_price = 0.0

            cat = row.get("catalog_id") or []
            cid = int(cat[0]) if isinstance(cat, (list, tuple)) and cat else None
            vendor_id = catalog_to_vendor.get(cid) if cid else None

            enriched.append(
                {
                    "product_id": pid,
                    "qty": float(line.get("qty") or 0),
                    "base_price": float(self._round2(Decimal(str(max(base_price, 0.0))))),
                    "vendor_partner_id": int(vendor_id) if vendor_id else None,
                }
            )
        return enriched

    def _load_active_promotions(self, vendor_ids: list[int]) -> dict[int, list[dict]]:
        vendor_ids = [int(v) for v in (vendor_ids or []) if int(v) > 0]
        if not vendor_ids:
            return {}

        today = date.today().isoformat()
        try:
            rows = self._client.call(
                self.MODEL,
                "search_read",
                [[["vendor_partner_id", "in", vendor_ids], ["status", "=", "active"]]],
                {
                    "fields": self.FIELDS,
                    "order": "id desc",
                    "limit": 5000,
                },
            ) or []
        except Exception:
            rows = []

        promos: dict[int, list[dict]] = {}
        for p in rows or []:
            if not isinstance(p, dict):
                continue
            start_date = p.get("start_date")
            end_date = p.get("end_date")
            if start_date and str(start_date) > today:
                continue
            if end_date and str(end_date) < today:
                continue

            # Best-effort usage limit enforcement
            usage_limit = p.get("usage_limit")
            used_count = int(p.get("used_count") or 0)
            if usage_limit not in (None, False, ""):
                try:
                    if used_count >= int(usage_limit):
                        continue
                except (TypeError, ValueError):
                    pass

            v = p.get("vendor_partner_id") or []
            vid = int(v[0]) if isinstance(v, (list, tuple)) and v else None
            if not vid:
                continue
            promos.setdefault(vid, []).append(p)

        return promos

    def _best_promotion(self, promos: list[dict], *, subtotal: float) -> dict | None:
        if not promos or subtotal <= 0:
            return None

        best = None
        best_discount = 0.0
        for p in promos or []:
            ptype = str(p.get("promotion_type") or "percent").strip().lower()
            if ptype == "shipping":
                # Shipping promos are handled separately (delivery), skip for price calc.
                continue

            min_order = self._as_float_or_none(p.get("min_order_amount"))
            if min_order is not None and subtotal + 1e-9 < float(min_order):
                continue

            disc = self._promotion_discount_amount(p, subtotal=subtotal)
            disc = min(disc, subtotal)
            disc = max(disc, 0.0)
            if disc > best_discount + 1e-9:
                best_discount = disc
                best = p

        return best

    def _promotion_discount_amount(self, promo: dict, *, subtotal: float) -> float:
        ptype = str(promo.get("promotion_type") or "percent").strip().lower()
        try:
            value = float(promo.get("value") or 0)
        except Exception:
            value = 0.0

        base = Decimal(str(max(subtotal, 0.0)))
        if base <= 0:
            return 0.0

        if ptype == "fixed":
            disc = Decimal(str(max(value, 0.0)))
        else:
            value = min(max(value, 0.0), 100.0)
            disc = base * (Decimal(str(value)) / Decimal("100"))

        max_disc = self._as_float_or_none(promo.get("max_discount_amount"))
        if max_disc is not None:
            disc = min(disc, Decimal(str(max_disc)))

        disc = min(disc, base)
        disc = max(disc, Decimal("0"))
        return float(self._round2(disc))

    def _apply_discount_to_lines(self, lines: list[dict], *, total_discount: float) -> None:
        if not lines:
            return
        total_discount = float(total_discount or 0)
        if total_discount <= 0:
            return

        totals: list[Decimal] = []
        for l in lines:
            qty = Decimal(str(l.get("qty") or 0))
            price = Decimal(str(l.get("base_price") or 0))
            if qty <= 0 or price < 0:
                totals.append(Decimal("0"))
                continue
            totals.append(qty * price)

        base_total = sum(totals, Decimal("0"))
        if base_total <= 0:
            return

        remaining = Decimal(str(total_discount))
        for idx, l in enumerate(lines):
            line_total = totals[idx]
            if line_total <= 0:
                l["price"] = float(self._round2(Decimal(str(l.get("base_price") or 0))))
                l["discount_amount"] = 0.0
                continue

            if idx == len(lines) - 1:
                line_disc = remaining
            else:
                ratio = line_total / base_total
                line_disc = self._round2(Decimal(str(total_discount)) * ratio)
                line_disc = min(line_disc, remaining)
            remaining -= line_disc

            qty = Decimal(str(l.get("qty") or 0))
            if qty <= 0:
                continue
            unit_disc = line_disc / qty
            new_price = Decimal(str(l.get("base_price") or 0)) - unit_disc
            if new_price < 0:
                new_price = Decimal("0")
            new_price = self._round2(new_price)
            l["price"] = float(new_price)

            new_total = (new_price * qty).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            disc_total = (line_total - new_total).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if disc_total < 0:
                disc_total = Decimal("0")
            l["discount_amount"] = float(disc_total)

    @staticmethod
    def _as_float_or_none(value) -> float | None:
        if value in (None, False, ""):
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _round2(value: Decimal) -> Decimal:
        return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def _subtotal(lines: list[dict], *, key: str) -> float:
        total = Decimal("0")
        for l in lines or []:
            try:
                qty = Decimal(str(l.get("qty") or 0))
                unit = Decimal(str(l.get(key) or 0))
            except Exception:
                continue
            if qty <= 0 or unit < 0:
                continue
            total += qty * unit
        return float(StorePromotionService._round2(total))


store_promotion_service = StorePromotionService(odoo)

