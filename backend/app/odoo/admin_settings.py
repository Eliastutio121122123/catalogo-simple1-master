"""
Admin settings service — persists config in Odoo's ir.config_parameter table.

Each setting maps to a key like 'catalogix.brand', 'catalogix.support_email', etc.
This is the standard Odoo pattern for storing application-level configuration.
"""
from __future__ import annotations

from .client import odoo

# Map of Python-friendly name → Odoo ir.config_parameter key
_PARAM_MAP: dict[str, str] = {
    "brand":           "catalogix.brand",
    "support_email":   "catalogix.support_email",
    "timezone":        "catalogix.timezone",
    "currency":        "catalogix.currency",
    "two_fa":          "catalogix.two_fa",
    "ip_restrict":     "catalogix.ip_restrict",
    "email_notif":     "catalogix.email_notif",
    "audit_retention": "catalogix.audit_retention",
}

_DEFAULTS: dict[str, str] = {
    "brand":           "Catalogix",
    "support_email":   "support@catalogix.com",
    "timezone":        "America/Santo_Domingo",
    "currency":        "DOP",
    "two_fa":          "false",
    "ip_restrict":     "false",
    "email_notif":     "true",
    "audit_retention": "90",
}

# Fields that should be returned as booleans
_BOOL_FIELDS = {"two_fa", "ip_restrict", "email_notif"}


def _coerce(key: str, raw: str):
    """Convert raw string from ir.config_parameter to the correct Python type."""
    if key in _BOOL_FIELDS:
        return raw.lower() in ("true", "1", "yes")
    if key == "audit_retention":
        try:
            return int(raw)
        except ValueError:
            return 90
    return raw


def get_settings() -> dict:
    """Read all admin settings from Odoo's ir.config_parameter."""
    # Fetch all catalogix params in one call
    keys = list(_PARAM_MAP.values())
    records = odoo.search_read(
        "ir.config_parameter",
        [["key", "in", keys]],
        fields=["key", "value"],
        limit=len(keys) + 10,
    )
    stored = {r["key"]: r["value"] for r in records}

    result = {}
    for field, param_key in _PARAM_MAP.items():
        raw = stored.get(param_key, _DEFAULTS.get(field, ""))
        result[field] = _coerce(field, str(raw))
    return result


def update_settings(data: dict) -> dict:
    """
    Update one or more admin settings in Odoo's ir.config_parameter.
    Only keys present in _PARAM_MAP are processed; unknown keys are ignored.
    Returns the full updated settings dict.
    """
    for field, param_key in _PARAM_MAP.items():
        if field not in data:
            continue
        # Normalize value to string for storage
        value = data[field]
        if isinstance(value, bool):
            value = "true" if value else "false"
        value = str(value)

        # Check if parameter already exists
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

    return get_settings()
