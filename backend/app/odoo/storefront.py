from __future__ import annotations

from .client import odoo


def _pair_name(value) -> str:
    if isinstance(value, (list, tuple)) and len(value) > 1:
        return str(value[1] or "").strip()
    if isinstance(value, str):
        return value.strip()
    return ""


def list_popular_categories(limit: int = 8) -> list[dict]:
    """
    Returns product categories with counts, based on sellable active products.
    Output: [{ name: str, count: int }, ...]
    """
    limit = int(limit or 8)
    domain = [["sale_ok", "=", True], ["active", "=", True], ["catalog_id.active", "=", True]]
    try:
        groups = odoo.call(
            "product.template",
            "read_group",
            [domain, ["categ_id"], ["categ_id"]],
            {"lazy": False},
        ) or []
    except Exception:
        return []

    items: list[dict] = []
    for g in groups:
        name = _pair_name(g.get("categ_id")) or "General"
        count = int(g.get("__count") or g.get("categ_id_count") or 0)
        if count <= 0:
            continue
        items.append({"name": name, "count": count})

    items.sort(key=lambda x: int(x.get("count") or 0), reverse=True)
    return items[:limit]


def get_storefront_stats() -> dict:
    """
    Lightweight stats for the public storefront.
    Output: { products: int, catalogs: int, vendors: int }
    """
    stats = {"products": 0, "catalogs": 0, "vendors": 0}
    try:
        stats["products"] = int(
            odoo.search_count("product.template", [["sale_ok", "=", True], ["active", "=", True], ["catalog_id.active", "=", True]])
        )
    except Exception:
        stats["products"] = 0

    try:
        stats["catalogs"] = int(odoo.search_count("catalog.catalog", [["active", "=", True]]))
    except Exception:
        stats["catalogs"] = 0

    # Vendors can come from a custom model or be inferred from active catalogs.
    try:
        stats["vendors"] = int(odoo.search_count("catalog.vendor", [["status", "=", "active"]]))
        return stats
    except Exception:
        pass

    try:
        rows = odoo.search_read("catalog.catalog", [["active", "=", True]], ["vendor_id"], limit=5000)
        vendor_ids = set()
        for r in rows or []:
            pair = r.get("vendor_id") or []
            if isinstance(pair, (list, tuple)) and pair:
                try:
                    vendor_ids.add(int(pair[0]))
                except Exception:
                    continue
        stats["vendors"] = len(vendor_ids)
    except Exception:
        stats["vendors"] = 0

    return stats

