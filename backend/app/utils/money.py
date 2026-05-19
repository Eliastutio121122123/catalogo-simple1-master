from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from ..odoo.currencies import get_currency, normalize_currency_code


def currency_decimals(currency: str) -> int:
    try:
        code = normalize_currency_code(currency)
    except ValueError:
        return 2
    meta = get_currency(code) or {}
    try:
        return int(meta.get("decimals", 2))
    except Exception:
        return 2


def to_minor_units(value: float | str | Decimal, currency: str) -> int:
    decimals = currency_decimals(currency)
    amount = Decimal(str(value))
    factor = Decimal(10) ** Decimal(decimals)
    return int((amount * factor).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

