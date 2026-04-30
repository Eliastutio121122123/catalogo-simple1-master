from __future__ import annotations

from flask import Blueprint, request
from flask.views import MethodView

from ..odoo.admin_settings import get_settings
from ..utils.fx_rates import FXRatesError, fx_rates
from ..utils.response import error, success

bp = Blueprint("currencies", __name__)


# Small built-in metadata set. (We can extend later or read from Odoo if you prefer.)
CURRENCY_META: dict[str, dict] = {
    "DOP": {"code": "DOP", "symbol": "RD$", "name": "Peso dominicano", "decimals": 2},
    "USD": {"code": "USD", "symbol": "$", "name": "Dolar estadounidense", "decimals": 2},
    "EUR": {"code": "EUR", "symbol": "EUR", "name": "Euro", "decimals": 2},
    "MXN": {"code": "MXN", "symbol": "$", "name": "Peso mexicano", "decimals": 2},
    "COP": {"code": "COP", "symbol": "$", "name": "Peso colombiano", "decimals": 2},
    "PEN": {"code": "PEN", "symbol": "S/", "name": "Sol peruano", "decimals": 2},
}


def _default_base_currency() -> str:
    try:
        settings = get_settings() or {}
        base = str(settings.get("currency") or "DOP").strip().upper()
        return base if base else "DOP"
    except Exception:
        return "DOP"


def _normalize_code(code: str) -> str:
    code = (code or "").strip().upper()
    if len(code) != 3 or not code.isalpha():
        raise ValueError("Invalid currency code")
    return code


class CurrenciesListAPI(MethodView):
    def get(self):
        base = request.args.get("base") or _default_base_currency()
        try:
            base = _normalize_code(base)
        except ValueError as exc:
            return error(str(exc), 400)

        # Always include base in list so UI can render it.
        codes = list(CURRENCY_META.keys())
        if base not in codes:
            codes = [base] + codes

        currencies = []
        for code in codes:
            meta = CURRENCY_META.get(code) or {"code": code, "symbol": code, "name": code, "decimals": 2}
            currencies.append(meta)

        return success({"base": base, "currencies": currencies})


class CurrenciesRatesAPI(MethodView):
    def get(self):
        base = request.args.get("base") or _default_base_currency()
        symbols = (request.args.get("symbols") or "").strip()
        try:
            base = _normalize_code(base)
        except ValueError as exc:
            return error(str(exc), 400)

        requested = []
        if symbols:
            for raw in symbols.split(","):
                if not raw.strip():
                    continue
                try:
                    requested.append(_normalize_code(raw))
                except ValueError:
                    continue
        else:
            requested = list(CURRENCY_META.keys())

        # Ensure base is not returned as a "rate" unless asked.
        requested = [c for c in requested if c != base]

        try:
            rates, meta = fx_rates.latest(base)
        except (FXRatesError, ValueError) as exc:
            return error(str(exc), 502)

        out_rates = {}
        for code in requested:
            if code in rates:
                out_rates[code] = rates[code]

        return success({"base": base, "rates": out_rates, "meta": meta})


class CurrenciesConvertAPI(MethodView):
    def get(self):
        amount_raw = request.args.get("amount")
        from_code = request.args.get("from") or request.args.get("from_currency") or _default_base_currency()
        to_code = request.args.get("to") or request.args.get("to_currency")
        if to_code is None:
            return error("to is required", 400)

        try:
            amount = float(amount_raw)
        except (TypeError, ValueError):
            return error("amount must be a number", 400)

        try:
            from_code = _normalize_code(from_code)
            to_code = _normalize_code(to_code)
        except ValueError as exc:
            return error(str(exc), 400)

        if from_code == to_code:
            return success({"amount": amount, "from": from_code, "to": to_code, "result": amount, "rate": 1.0})

        try:
            from_rates, meta = fx_rates.latest(from_code)
            rate = float(from_rates.get(to_code))
        except Exception:
            # Fallback: compute cross-rate via USD if direct is missing.
            try:
                usd_rates, meta = fx_rates.latest("USD")
                # amount(from)->USD then USD->to
                # Convert by using rates mapping base->X:
                # USD_rates[X] = 1 USD in X
                # So 1 X in USD = 1 / USD_rates[X]
                if from_code == "USD":
                    rate = float(usd_rates[to_code])
                elif to_code == "USD":
                    rate = 1.0 / float(usd_rates[from_code])
                else:
                    rate = (1.0 / float(usd_rates[from_code])) * float(usd_rates[to_code])
            except Exception as exc:
                return error("Rate not available", 502)

        result = amount * rate
        return success({"amount": amount, "from": from_code, "to": to_code, "result": result, "rate": rate, "meta": meta})


bp.add_url_rule("", view_func=CurrenciesListAPI.as_view("currencies_list"))
bp.add_url_rule("/rates", view_func=CurrenciesRatesAPI.as_view("currencies_rates"))
bp.add_url_rule("/convert", view_func=CurrenciesConvertAPI.as_view("currencies_convert"))
