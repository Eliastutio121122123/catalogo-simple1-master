from __future__ import annotations

from .client import odoo
from .currencies import normalize_currency_code


DEFAULT_SETTINGS = {
    "currency": "DOP",
    "defaultMarginPercent": 25,
    "taxPercent": 18,
    "roundTo": "integer",
    "allowManualDiscounts": True,
    "minPricePolicy": "cost_plus_margin",
}

SETTINGS_FIELDS = [
    "id",
    "partner_id",
    "currency",
    "default_margin_percent",
    "tax_percent",
    "round_to",
    "allow_manual_discounts",
    "min_price_policy",
    "write_date",
    "create_date",
]

RULE_FIELDS = [
    "id",
    "partner_id",
    "name",
    "scope",
    "target",
    "rule_type",
    "value",
    "min_qty",
    "priority",
    "status",
    "write_date",
    "create_date",
]


def _normalize_settings(row: dict) -> dict:
    return {
        "id": row.get("id"),
        "currency": row.get("currency") or DEFAULT_SETTINGS["currency"],
        "defaultMarginPercent": float(row.get("default_margin_percent") or 0),
        "taxPercent": float(row.get("tax_percent") or 0),
        "roundTo": row.get("round_to") or DEFAULT_SETTINGS["roundTo"],
        "allowManualDiscounts": bool(row.get("allow_manual_discounts")),
        "minPricePolicy": row.get("min_price_policy") or DEFAULT_SETTINGS["minPricePolicy"],
        "updatedAt": row.get("write_date") or row.get("create_date"),
    }


def _normalize_rule(row: dict) -> dict:
    return {
        "id": row.get("id"),
        "name": row.get("name") or "",
        "scope": row.get("scope") or "global",
        "target": row.get("target") or "Todos los productos",
        "type": row.get("rule_type") or "percent",
        "value": float(row.get("value") or 0),
        "minQty": int(row.get("min_qty") or 1),
        "priority": int(row.get("priority") or 0),
        "status": row.get("status") or "active",
        "updatedAt": row.get("write_date") or row.get("create_date"),
    }


def _get_settings_row(partner_id: int) -> dict | None:
    rows = odoo.search_read(
        "catalog.pricing.setting",
        [["partner_id", "=", partner_id]],
        SETTINGS_FIELDS,
        limit=1,
    )
    return rows[0] if rows else None


def get_vendor_pricing_settings(partner_id: int) -> dict:
    row = _get_settings_row(partner_id)
    if not row:
        setting_id = odoo.create(
            "catalog.pricing.setting",
            {
                "partner_id": partner_id,
                "currency": DEFAULT_SETTINGS["currency"],
                "default_margin_percent": DEFAULT_SETTINGS["defaultMarginPercent"],
                "tax_percent": DEFAULT_SETTINGS["taxPercent"],
                "round_to": DEFAULT_SETTINGS["roundTo"],
                "allow_manual_discounts": DEFAULT_SETTINGS["allowManualDiscounts"],
                "min_price_policy": DEFAULT_SETTINGS["minPricePolicy"],
            },
        )
        rows = odoo.read("catalog.pricing.setting", [setting_id], SETTINGS_FIELDS)
        row = rows[0] if rows else {}
    return _normalize_settings(row)


def save_vendor_pricing_settings(partner_id: int, payload: dict) -> dict:
    row = _get_settings_row(partner_id)
    if not row:
        get_vendor_pricing_settings(partner_id)
        row = _get_settings_row(partner_id)
    if not row:
        raise RuntimeError("Pricing settings not found")

    values = {}
    if "currency" in payload:
        values["currency"] = normalize_currency_code(
            str(payload.get("currency") or DEFAULT_SETTINGS["currency"])
        )
    if "defaultMarginPercent" in payload or "default_margin_percent" in payload:
        values["default_margin_percent"] = float(
            payload.get("defaultMarginPercent", payload.get("default_margin_percent") or 0)
        )
    if "taxPercent" in payload or "tax_percent" in payload:
        values["tax_percent"] = float(payload.get("taxPercent", payload.get("tax_percent") or 0))
    if "roundTo" in payload or "round_to" in payload:
        values["round_to"] = str(payload.get("roundTo", payload.get("round_to") or DEFAULT_SETTINGS["roundTo"]))
    if "allowManualDiscounts" in payload or "allow_manual_discounts" in payload:
        values["allow_manual_discounts"] = bool(
            payload.get("allowManualDiscounts", payload.get("allow_manual_discounts"))
        )
    if "minPricePolicy" in payload or "min_price_policy" in payload:
        values["min_price_policy"] = str(
            payload.get("minPricePolicy", payload.get("min_price_policy") or DEFAULT_SETTINGS["minPricePolicy"])
        )

    if values:
        odoo.write("catalog.pricing.setting", [int(row["id"])], values)
    refreshed = _get_settings_row(partner_id)
    return _normalize_settings(refreshed or row)


def list_vendor_pricing_rules(partner_id: int) -> list[dict]:
    rows = odoo.search_read(
        "catalog.pricing.rule",
        [["partner_id", "=", partner_id]],
        RULE_FIELDS,
        order="priority desc, id desc",
        limit=1000,
    )
    return [_normalize_rule(row) for row in rows]


def _get_vendor_rule_row(partner_id: int, rule_id: int) -> dict:
    rows = odoo.read("catalog.pricing.rule", [rule_id], RULE_FIELDS)
    if not rows:
        raise LookupError("Pricing rule not found")
    row = rows[0]
    owner = row.get("partner_id") or []
    owner_id = int(owner[0]) if isinstance(owner, list) and owner else row.get("partner_id")
    if int(owner_id or 0) != int(partner_id):
        raise LookupError("Pricing rule not found for vendor")
    return row


def create_vendor_pricing_rule(partner_id: int, payload: dict) -> dict:
    name = str(payload.get("name") or "").strip()
    if not name:
        raise ValueError("Rule name is required")

    values = {
        "partner_id": partner_id,
        "name": name,
        "scope": payload.get("scope") or "global",
        "target": str(payload.get("target") or "Todos los productos"),
        "rule_type": "fixed" if payload.get("type") == "fixed" else "percent",
        "value": float(payload.get("value") or 0),
        "min_qty": int(payload.get("minQty") or payload.get("min_qty") or 1),
        "priority": int(payload.get("priority") or 10),
        "status": "inactive" if payload.get("status") == "inactive" else "active",
    }
    rule_id = odoo.create("catalog.pricing.rule", values)
    rows = odoo.read("catalog.pricing.rule", [rule_id], RULE_FIELDS)
    return _normalize_rule(rows[0]) if rows else _normalize_rule(values | {"id": rule_id})


def update_vendor_pricing_rule(partner_id: int, rule_id: int, payload: dict) -> dict:
    row = _get_vendor_rule_row(partner_id, rule_id)
    values = {}
    if "name" in payload:
        values["name"] = str(payload.get("name") or "").strip()
    if "scope" in payload:
        values["scope"] = payload.get("scope") or "global"
    if "target" in payload:
        values["target"] = str(payload.get("target") or "Todos los productos")
    if "type" in payload or "rule_type" in payload:
        rule_type = payload.get("type") or payload.get("rule_type")
        values["rule_type"] = "fixed" if rule_type == "fixed" else "percent"
    if "value" in payload:
        values["value"] = float(payload.get("value") or 0)
    if "minQty" in payload or "min_qty" in payload:
        values["min_qty"] = int(payload.get("minQty") or payload.get("min_qty") or 1)
    if "priority" in payload:
        values["priority"] = int(payload.get("priority") or 0)
    if "status" in payload:
        values["status"] = "inactive" if payload.get("status") == "inactive" else "active"

    if values:
        odoo.write("catalog.pricing.rule", [int(row["id"])], values)
    refreshed = _get_vendor_rule_row(partner_id, rule_id)
    return _normalize_rule(refreshed)


def toggle_vendor_pricing_rule_status(partner_id: int, rule_id: int) -> dict:
    row = _get_vendor_rule_row(partner_id, rule_id)
    current = row.get("status") or "active"
    next_status = "inactive" if current == "active" else "active"
    odoo.write("catalog.pricing.rule", [int(row["id"])], {"status": next_status})
    refreshed = _get_vendor_rule_row(partner_id, rule_id)
    return _normalize_rule(refreshed)


def delete_vendor_pricing_rule(partner_id: int, rule_id: int) -> None:
    row = _get_vendor_rule_row(partner_id, rule_id)
    odoo.unlink("catalog.pricing.rule", [int(row["id"])])
