from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP

from .client import odoo


class CouponError(ValueError):
    pass


@dataclass(frozen=True)
class CouponQuote:
    coupon_id: int
    code: str
    description: str
    discount_type: str
    value: float
    min_order_amount: float | None
    max_discount_amount: float | None
    expires_at: str | None
    status: str
    catalogs: list[int]
    subtotal: float
    eligible_subtotal: float
    discount_amount: float


class StoreCouponService:
    MODEL = "catalog.coupon"
    FIELDS = [
        "id",
        "code",
        "description",
        "discount_type",
        "value",
        "min_order_amount",
        "max_discount_amount",
        "max_uses",
        "expires_at",
        "status",
        "catalog_ids",
        "usage_count",
    ]

    def __init__(self, client):
        self._client = client

    def quote(self, *, partner_id: int, code: str, lines: list[dict]) -> CouponQuote:
        coupon = self._get_by_code(code)
        if not coupon:
            raise CouponError("Código inválido")

        code_norm = str(coupon.get("code") or "").strip().upper()
        status = str(coupon.get("status") or "inactive").strip().lower()
        expires_at = coupon.get("expires_at")

        if status == "active" and expires_at and self._is_expired(expires_at):
            status = "expired"

        if status == "inactive":
            raise CouponError("Cupón inactivo")
        if status == "expired":
            raise CouponError("Cupón expirado")
        if status != "active":
            raise CouponError("Cupón no disponible")

        subtotal = self._subtotal(lines)
        min_order_amount = self._as_float_or_none(coupon.get("min_order_amount"))
        if min_order_amount is not None and subtotal + 1e-9 < float(min_order_amount):
            raise CouponError(f"Compra mínima: RD${int(min_order_amount):,}".replace(",", ","))

        catalogs = coupon.get("catalog_ids") or []
        catalogs = [int(x) for x in catalogs if x]
        eligible_subtotal = subtotal
        eligible_lines = lines
        if catalogs:
            eligible_lines = self._filter_lines_by_catalogs(lines, catalogs)
            eligible_subtotal = self._subtotal(eligible_lines)
            if eligible_subtotal <= 0:
                raise CouponError("Cupón no aplica a estos productos")

        discount_type = str(coupon.get("discount_type") or "percent").strip().lower()
        value = float(coupon.get("value") or 0)
        if value <= 0:
            raise CouponError("Cupón inválido")
        if discount_type == "percent" and value > 100:
            raise CouponError("Cupón inválido")

        discount_amount = self._compute_discount_amount(
            discount_type=discount_type,
            value=value,
            eligible_subtotal=eligible_subtotal,
            max_discount_amount=self._as_float_or_none(coupon.get("max_discount_amount")),
        )

        # Global usage limit (best-effort; depends on custom module accuracy)
        max_uses = coupon.get("max_uses")
        usage_count = int(coupon.get("usage_count") or 0)
        if max_uses not in (None, False, ""):
            try:
                if usage_count >= int(max_uses):
                    raise CouponError("Cupón agotado")
            except (TypeError, ValueError):
                pass

        description = str(coupon.get("description") or "").strip()
        return CouponQuote(
            coupon_id=int(coupon.get("id") or 0),
            code=code_norm,
            description=description,
            discount_type=discount_type,
            value=float(value),
            min_order_amount=float(min_order_amount) if min_order_amount is not None else None,
            max_discount_amount=self._as_float_or_none(coupon.get("max_discount_amount")),
            expires_at=str(expires_at) if expires_at else None,
            status=status,
            catalogs=catalogs,
            subtotal=float(subtotal),
            eligible_subtotal=float(eligible_subtotal),
            discount_amount=float(discount_amount),
        )

    def apply_to_lines(self, *, partner_id: int, code: str, lines: list[dict]) -> tuple[list[dict], CouponQuote]:
        quote = self.quote(partner_id=partner_id, code=code, lines=lines)
        if quote.discount_amount <= 0:
            return lines, quote

        eligible_catalogs = set(quote.catalogs or [])
        eligible_product_ids = None
        if eligible_catalogs:
            eligible_lines = self._filter_lines_by_catalogs(lines, list(eligible_catalogs))
            eligible_product_ids = {int(l["product_id"]) for l in eligible_lines if l.get("product_id")}

        discount_type = quote.discount_type
        if discount_type == "percent":
            factor = Decimal("1") - (Decimal(str(quote.value)) / Decimal("100"))
            adjusted = []
            for line in lines:
                if eligible_product_ids is not None and int(line.get("product_id") or 0) not in eligible_product_ids:
                    adjusted.append(dict(line))
                    continue
                adjusted.append(self._with_price(line, self._round2(Decimal(str(line["price"])) * factor)))
            return adjusted, quote

        # fixed: distribute proportionally across eligible lines
        discount_total = Decimal(str(quote.discount_amount))
        eligible_total = Decimal(str(quote.eligible_subtotal))
        if eligible_total <= 0:
            return lines, quote
        ratio = (discount_total / eligible_total) if eligible_total > 0 else Decimal("0")
        ratio = min(max(ratio, Decimal("0")), Decimal("1"))

        adjusted = []
        remaining = discount_total
        eligible_indexes = []
        for idx, line in enumerate(lines):
            if eligible_product_ids is not None and int(line.get("product_id") or 0) not in eligible_product_ids:
                adjusted.append(dict(line))
                continue
            eligible_indexes.append(idx)
            adjusted.append(dict(line))

        for n, idx in enumerate(eligible_indexes):
            line = adjusted[idx]
            line_total = Decimal(str(line["price"])) * Decimal(str(line["qty"]))
            if line_total <= 0:
                continue
            if n == len(eligible_indexes) - 1:
                line_disc = remaining
            else:
                line_disc = self._round2(line_total * ratio)
                line_disc = min(line_disc, remaining)
            remaining -= line_disc

            qty = Decimal(str(line["qty"]))
            if qty <= 0:
                continue
            unit_disc = line_disc / qty
            new_price = Decimal(str(line["price"])) - unit_disc
            if new_price < 0:
                new_price = Decimal("0")
            line["price"] = float(self._round2(new_price))

        return adjusted, quote

    def _get_by_code(self, code: str) -> dict | None:
        code_norm = str(code or "").strip().upper()
        if not code_norm:
            return None
        rows = self._client.search_read(
            self.MODEL,
            [["code", "=", code_norm]],
            self.FIELDS,
            limit=1,
            order="id desc",
        )
        return rows[0] if rows else None

    @staticmethod
    def _subtotal(lines: list[dict]) -> float:
        total = Decimal("0")
        for line in lines or []:
            try:
                qty = Decimal(str(line.get("qty") or 0))
                price = Decimal(str(line.get("price") or 0))
            except Exception:
                continue
            if qty <= 0 or price < 0:
                continue
            total += qty * price
        return float(StoreCouponService._round2(total))

    @staticmethod
    def _compute_discount_amount(
        *,
        discount_type: str,
        value: float,
        eligible_subtotal: float,
        max_discount_amount: float | None,
    ) -> float:
        base = Decimal(str(max(eligible_subtotal, 0)))
        if base <= 0:
            return 0.0

        if discount_type == "fixed":
            disc = Decimal(str(max(value, 0)))
        else:
            disc = base * (Decimal(str(value)) / Decimal("100"))

        if max_discount_amount is not None:
            disc = min(disc, Decimal(str(max_discount_amount)))

        disc = min(disc, base)
        disc = max(disc, Decimal("0"))
        return float(StoreCouponService._round2(disc))

    def _filter_lines_by_catalogs(self, lines: list[dict], allowed_catalog_ids: list[int]) -> list[dict]:
        allowed = {int(x) for x in allowed_catalog_ids if x}
        product_ids = [int(l.get("product_id") or 0) for l in (lines or []) if int(l.get("product_id") or 0) > 0]
        if not product_ids:
            return []

        uniq_ids = list(set(product_ids))

        # Prefer product.template ids; if ids belong to product.product, map them to templates.
        template_rows = self._client.search_read(
            "product.template",
            [["id", "in", uniq_ids]],
            ["id", "catalog_id"],
            limit=len(uniq_ids),
        )
        template_by_id = {int(r.get("id") or 0): r for r in (template_rows or []) if r.get("id")}

        missing_ids = [pid for pid in uniq_ids if pid not in template_by_id]
        if missing_ids:
            variant_rows = self._client.search_read(
                "product.product",
                [["id", "in", missing_ids]],
                ["id", "product_tmpl_id"],
                limit=len(missing_ids),
            )
            tmpl_ids = []
            variant_to_template = {}
            for row in variant_rows or []:
                vid = int(row.get("id") or 0)
                pair = row.get("product_tmpl_id") or []
                tid = int(pair[0]) if isinstance(pair, list) and pair else None
                if vid and tid:
                    variant_to_template[vid] = tid
                    tmpl_ids.append(tid)
            if tmpl_ids:
                more_templates = self._client.search_read(
                    "product.template",
                    [["id", "in", list(set(tmpl_ids))]],
                    ["id", "catalog_id"],
                    limit=len(tmpl_ids),
                )
                for row in more_templates or []:
                    tid = int(row.get("id") or 0)
                    if tid:
                        template_by_id[tid] = row

            # Replace ids with template ids for eligibility checks
            product_to_template = {**{pid: pid for pid in template_by_id.keys()}, **variant_to_template}
        else:
            product_to_template = {pid: pid for pid in template_by_id.keys()}

        allowed_products: set[int] = set()
        for prod_id, tmpl_id in product_to_template.items():
            row = template_by_id.get(int(tmpl_id) or 0) or {}
            catalog = row.get("catalog_id") or []
            catalog_id = int(catalog[0]) if isinstance(catalog, list) and catalog else None
            if catalog_id and catalog_id in allowed:
                allowed_products.add(int(prod_id))

        return [dict(l) for l in (lines or []) if int(l.get("product_id") or 0) in allowed_products]

    @staticmethod
    def _as_float_or_none(val) -> float | None:
        if val in (None, False, ""):
            return None
        try:
            return float(val)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _is_expired(expires_at: str) -> bool:
        text = str(expires_at or "").strip()
        if not text:
            return False
        try:
            return date.fromisoformat(text) < date.today()
        except ValueError:
            pass
        try:
            # common Odoo datetime format: "YYYY-MM-DD HH:MM:SS"
            dt = datetime.fromisoformat(text.replace(" ", "T"))
            return dt.date() < date.today()
        except ValueError:
            return False

    @staticmethod
    def _round2(value: Decimal) -> Decimal:
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def _with_price(line: dict, price: Decimal) -> dict:
        out = dict(line)
        out["price"] = float(StoreCouponService._round2(price))
        return out


store_coupon_service = StoreCouponService(odoo)
