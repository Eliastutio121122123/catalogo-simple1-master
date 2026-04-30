import { api } from "./odooClient";

const currencyService = {
  list: async ({ base = "" } = {}) => {
    const qs = new URLSearchParams();
    if (base) qs.set("base", base);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return await api.get(`/api/currencies${suffix}`);
  },

  rates: async ({ base = "", symbols = [] } = {}) => {
    const qs = new URLSearchParams();
    if (base) qs.set("base", base);
    if (symbols && symbols.length) qs.set("symbols", symbols.join(","));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return await api.get(`/api/currencies/rates${suffix}`);
  },

  convert: async ({ amount, from, to } = {}) => {
    const qs = new URLSearchParams();
    qs.set("amount", String(amount ?? ""));
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    return await api.get(`/api/currencies/convert?${qs.toString()}`);
  },
};

export default currencyService;
