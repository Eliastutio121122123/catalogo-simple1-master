export function currencyCode(raw, fallback = "DOP") {
  const val = String(raw || "").trim().toUpperCase();
  if (!val) return fallback;
  if (val === "RD$") return "DOP";
  if (val.length === 3 && /^[A-Z]+$/.test(val)) return val;
  return fallback;
}

export function formatMoney(value, currency = "DOP", opts = {}) {
  const amount = Number(value || 0);
  const code = currencyCode(currency, "DOP");
  const locale = opts.locale || "es-DO";

  const maximumFractionDigits =
    typeof opts.maximumFractionDigits === "number" ? opts.maximumFractionDigits : 2;
  const minimumFractionDigits =
    typeof opts.minimumFractionDigits === "number" ? opts.minimumFractionDigits : 0;

  const byCode = opts.byCode || null;
  const meta = byCode ? byCode[code] : null;
  if (meta) {
    const decimals = typeof meta.decimals === "number" ? meta.decimals : maximumFractionDigits;
    const max = typeof opts.maximumFractionDigits === "number" ? maximumFractionDigits : decimals;
    const min = typeof opts.minimumFractionDigits === "number" ? minimumFractionDigits : minimumFractionDigits;

    const number = amount.toLocaleString(locale, { maximumFractionDigits: max, minimumFractionDigits: min });
    const symbol = String(meta.symbol || (code === "DOP" ? "RD$" : code));
    const position = (meta.position || "before") === "after" ? "after" : "before";

    const showCode =
      typeof opts.showCode === "boolean"
        ? opts.showCode
        : symbol === "$"; // disambiguate common "$" currencies

    if (position === "after") {
      return showCode ? `${number} ${symbol} ${code}` : `${number} ${symbol}`;
    }
    return showCode ? `${symbol} ${code} ${number}` : `${symbol} ${number}`;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: opts.currencyDisplay || "symbol",
      maximumFractionDigits,
      minimumFractionDigits,
    }).format(amount);
  } catch {
    const rounded = amount.toLocaleString(locale, { maximumFractionDigits, minimumFractionDigits });
    return `${code} ${rounded}`;
  }
}

export function symbolForCurrency(code, byCode = null) {
  const c = currencyCode(code, "DOP");
  const meta = byCode && byCode[c];
  return (meta && meta.symbol) || (c === "DOP" ? "RD$" : c);
}
