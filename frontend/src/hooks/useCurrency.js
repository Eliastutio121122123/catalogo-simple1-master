import { useCallback, useEffect, useMemo, useState } from "react";
import currencyService from "../services/odoo/currencyService";

const CACHE_TTL_MS = 10 * 60 * 1000;
const _cache = {
  ts: 0,
  base: "",
  data: null,
  promise: null,
};

async function _load({ base = "" } = {}) {
  const now = Date.now();
  const sameBase = String(base || "") === String(_cache.base || "");
  if (_cache.data && sameBase && now - _cache.ts < CACHE_TTL_MS) return _cache.data;

  if (_cache.promise && sameBase) return _cache.promise;

  _cache.base = base || "";
  _cache.promise = currencyService
    .list({ base: base || "" })
    .then((data) => {
      _cache.data = data || null;
      _cache.ts = Date.now();
      _cache.promise = null;
      return _cache.data;
    })
    .catch((err) => {
      _cache.promise = null;
      throw err;
    });

  return _cache.promise;
}

export default function useCurrency({ base = "" } = {}) {
  const [state, setState] = useState(() => ({
    loading: true,
    error: "",
    data: null,
  }));

  const refresh = useCallback(async () => {
    _cache.ts = 0;
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const data = await _load({ base });
      setState({ loading: false, error: "", data });
      return data;
    } catch (e) {
      setState({ loading: false, error: e?.message || "No se pudieron cargar las monedas.", data: null });
      return null;
    }
  }, [base]);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    _load({ base })
      .then((data) => {
        if (!active) return;
        setState({ loading: false, error: "", data });
      })
      .catch((e) => {
        if (!active) return;
        setState({ loading: false, error: e?.message || "No se pudieron cargar las monedas.", data: null });
      });
    return () => {
      active = false;
    };
  }, [base]);

  const currencies = Array.isArray(state.data?.currencies) ? state.data.currencies : [];
  const baseCurrency = state.data?.base || base || "DOP";

  const byCode = useMemo(() => {
    const map = {};
    for (const cur of currencies) {
      if (!cur || !cur.code) continue;
      map[String(cur.code).toUpperCase()] = cur;
    }
    return map;
  }, [currencies]);

  return {
    loading: state.loading,
    error: state.error,
    base: baseCurrency,
    currencies,
    byCode,
    refresh,
  };
}
