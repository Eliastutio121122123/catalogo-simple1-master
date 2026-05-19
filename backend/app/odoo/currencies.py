from __future__ import annotations

import time

from .client import odoo


_CACHE_TTL_SECONDS = 10 * 60
_cache_ts: float = 0.0
_cache_by_code: dict[str, dict] = {}


def normalize_currency_code(code: str) -> str:
    code = (code or "").strip().upper()
    if not code:
        raise ValueError("Invalid currency code")
    if code == "RD$":
        return "DOP"
    if len(code) != 3 or (not code.isalpha()):
        raise ValueError("Invalid currency code")
    return code


def _refresh_cache() -> None:
    global _cache_ts, _cache_by_code
    now = time.time()
    if _cache_by_code and (now - _cache_ts) < _CACHE_TTL_SECONDS:
        return

    rows = odoo.search_read(
        "res.currency",
        [["active", "=", True]],
        ["id", "name", "symbol", "decimal_places", "active", "position"],
        limit=500,
        order="name asc",
    )

    by_code: dict[str, dict] = {}
    for row in rows or []:
        try:
            code = normalize_currency_code(row.get("name") or "")
        except ValueError:
            continue
        by_code[code] = {
            "id": int(row.get("id") or 0) or None,
            "code": code,
            "name": code,
            "symbol": row.get("symbol") or code,
            "decimals": int(row.get("decimal_places") or 2),
            "active": bool(row.get("active", True)),
            "position": (row.get("position") or "before"),
        }

    _cache_by_code = by_code
    _cache_ts = now


def list_currencies(*, q: str | None = None, limit: int = 250) -> list[dict]:
    _refresh_cache()
    items = list(_cache_by_code.values())

    query = (q or "").strip().upper()
    if query:
        items = [c for c in items if query in c["code"] or query in str(c.get("symbol") or "").upper()]

    items.sort(key=lambda c: c["code"])
    if limit and limit > 0:
        items = items[: int(limit)]
    return items


def get_currency(code: str) -> dict | None:
    try:
        code_norm = normalize_currency_code(code)
    except ValueError:
        return None
    _refresh_cache()
    return _cache_by_code.get(code_norm)


def resolve_currency_id(code: str) -> int | None:
    cur = get_currency(code)
    if cur and cur.get("id"):
        return int(cur["id"])

    try:
        code_norm = normalize_currency_code(code)
    except ValueError:
        return None

    rows = odoo.search_read(
        "res.currency",
        [["name", "=", code_norm]],
        ["id"],
        limit=1,
    )
    if rows:
        return int(rows[0].get("id") or 0) or None
    return None
