from __future__ import annotations

import time
from typing import Any

import requests


class FXRatesError(RuntimeError):
    pass


class FXRatesClient:
    """
    Minimal FX rates client using a free, no-key endpoint.

    Provider: open.er-api.com
    Response: https://open.er-api.com/v6/latest/USD
    """

    def __init__(self, *, ttl_seconds: int = 30 * 60):
        self.ttl_seconds = int(ttl_seconds)
        self._cache: dict[str, tuple[float, dict[str, float], dict[str, Any]]] = {}

    @staticmethod
    def _normalize_code(code: str) -> str:
        code = (code or "").strip().upper()
        if len(code) != 3 or not code.isalpha():
            raise ValueError("Invalid currency code")
        return code

    def _get_cached(self, base: str) -> tuple[dict[str, float], dict[str, Any]] | None:
        item = self._cache.get(base)
        if not item:
            return None
        expires_at, rates, meta = item
        if expires_at < time.time():
            self._cache.pop(base, None)
            return None
        return rates, meta

    def _set_cached(self, base: str, rates: dict[str, float], meta: dict[str, Any]) -> None:
        self._cache[base] = (time.time() + self.ttl_seconds, rates, meta)

    def latest(self, base: str) -> tuple[dict[str, float], dict[str, Any]]:
        base = self._normalize_code(base)
        cached = self._get_cached(base)
        if cached is not None:
            return cached

        url = f"https://open.er-api.com/v6/latest/{base}"
        try:
            resp = requests.get(url, timeout=12)
            resp.raise_for_status()
            data = resp.json() or {}
        except requests.RequestException as exc:
            raise FXRatesError("Unable to fetch FX rates") from exc
        except ValueError as exc:
            raise FXRatesError("Invalid FX rates response") from exc

        if data.get("result") != "success":
            raise FXRatesError("FX provider returned an error")

        raw_rates = data.get("rates") or {}
        if not isinstance(raw_rates, dict) or not raw_rates:
            raise FXRatesError("FX provider returned no rates")

        rates: dict[str, float] = {}
        for k, v in raw_rates.items():
            if not isinstance(k, str):
                continue
            code = k.strip().upper()
            if len(code) != 3 or not code.isalpha():
                continue
            try:
                rates[code] = float(v)
            except (TypeError, ValueError):
                continue

        meta = {
            "provider": "open.er-api.com",
            "base": data.get("base_code") or base,
            "time_last_update_unix": data.get("time_last_update_unix"),
            "time_next_update_unix": data.get("time_next_update_unix"),
        }

        self._set_cached(base, rates, meta)
        return rates, meta


fx_rates = FXRatesClient()

