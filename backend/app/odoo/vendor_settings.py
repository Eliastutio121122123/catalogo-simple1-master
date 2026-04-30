"""
Vendor settings service — persists vendor preferences in ir.config_parameter
using vendor-scoped keys like 'catalogix.vendor.{uid}.currency'.
"""
from __future__ import annotations

from .client import odoo

_BOOL_FIELDS = {"email_orders", "email_invoices", "email_promotions", "two_factor"}
_INT_FIELDS  = {"low_stock_threshold"}

_DEFAULTS: dict[str, object] = {
    "currency":            "DOP",
    "timezone":            "America/Santo_Domingo",
    "language":            "es",
    "low_stock_threshold": 10,
    "email_orders":        True,
    "email_invoices":      True,
    "email_promotions":    False,
    "two_factor":          False,
}

_PREF_FIELDS = list(_DEFAULTS.keys())


def _vendor_key(uid: int, field: str) -> str:
    return f"catalogix.vendor.{uid}.{field}"


def _coerce(field: str, raw: str):
    if field in _BOOL_FIELDS:
        return raw.lower() in ("true", "1", "yes")
    if field in _INT_FIELDS:
        try:
            return int(raw)
        except ValueError:
            return _DEFAULTS.get(field, 0)
    return raw


def get_vendor_settings(uid: int) -> dict:
    """Read vendor preference settings from Odoo ir.config_parameter."""
    keys = [_vendor_key(uid, f) for f in _PREF_FIELDS]
    records = odoo.search_read(
        "ir.config_parameter",
        [["key", "in", keys]],
        fields=["key", "value"],
        limit=len(keys) + 5,
    )
    stored = {r["key"]: r["value"] for r in records}

    result = {}
    for field in _PREF_FIELDS:
        raw = stored.get(_vendor_key(uid, field))
        if raw is None:
            result[field] = _DEFAULTS[field]
        else:
            result[field] = _coerce(field, str(raw))
    return result


def update_vendor_settings(uid: int, data: dict) -> dict:
    """Persist vendor preference settings in Odoo ir.config_parameter."""
    for field in _PREF_FIELDS:
        if field not in data:
            continue
        param_key = _vendor_key(uid, field)
        value = data[field]
        if isinstance(value, bool):
            value = "true" if value else "false"
        value = str(value)

        existing = odoo.search_read(
            "ir.config_parameter",
            [["key", "=", param_key]],
            fields=["id"],
            limit=1,
        )
        if existing:
            odoo.write("ir.config_parameter", [existing[0]["id"]], {"value": value})
        else:
            odoo.create("ir.config_parameter", {"key": param_key, "value": value})

    return get_vendor_settings(uid)
