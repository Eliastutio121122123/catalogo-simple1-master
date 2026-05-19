const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const fmtNow = () => {
  const d = new Date();
  const date = d.toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "2-digit" });
  const time = d.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
};

// ── Logo loader (same strategy as brandedExcel.js) ────────────────────────────

const _logoCache = new Map();

const toDataUrl = (blob) =>
  new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(String(reader.result || ""));
    reader.onerror = () => rej(reader.error || new Error("logo read error"));
    reader.readAsDataURL(blob);
  });

const baseUrl = () => {
  try {
    const b = import.meta?.env?.BASE_URL;
    return typeof b === "string" && b.length ? b : "/";
  } catch {
    return "/";
  }
};

const fetchLogoDataUrl = async () => {
  const candidates = [
    `${baseUrl()}brand/catalogix.png`,
    "/brand/catalogix.png",
    `${window.location.origin}/brand/catalogix.png`,
  ];

  for (const url of candidates) {
    if (_logoCache.has(url)) return _logoCache.get(url);
    try {
      const r = await fetch(url, { cache: "force-cache" });
      if (!r.ok) continue;
      const blob = await r.blob();
      const dataUrl = await toDataUrl(blob);
      if (dataUrl) {
        candidates.forEach((k) => _logoCache.set(k, dataUrl));
        return dataUrl;
      }
    } catch {
      // try next
    }
  }
  return "";
};

// Pre-warm cache as soon as the module loads
fetchLogoDataUrl().catch(() => {});

// ── Main export ────────────────────────────────────────────────────────────────

/**
 * Open a styled print-to-PDF window.
 * NOW ASYNC — awaits logo fetch before opening the window.
 *
 * @param {object} opts
 * @param {string}  opts.title       – Main report title
 * @param {string}  opts.subtitle    – Subtitle / summary line
 * @param {string}  opts.filename    – Suggested filename (shown in tab title)
 * @param {Array}   opts.columns     – Column definitions { key, label, format? }
 * @param {Array}   opts.rows        – Data rows
 * @param {string}  opts.orientation – "portrait" | "landscape"  (default: portrait)
 * @param {string}  opts.brandName   – Brand name shown next to logo
 * @param {Array}   opts.kpis        – Optional KPI cards [{ label, value }]
 */
export async function printTablePdf({
  title = "Reporte",
  subtitle = "",
  filename = "reporte.pdf",
  columns = [],
  rows = [],
  orientation = "portrait",
  brandName = "Catalogix",
  kpis = [],
} = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("No hay datos para exportar.");
  }

  // Load logo first so it appears embedded in the PDF
  const logoDataUrl = await fetchLogoDataUrl().catch(() => "");

  const cols = Array.isArray(columns) ? columns : [];
  const { date, time } = fmtNow();

  const safeTitle    = escapeHtml(title);
  const safeSubtitle = escapeHtml(subtitle);
  const safeBrand    = escapeHtml(brandName);
  const safeDate     = escapeHtml(date);
  const safeTime     = escapeHtml(time);
  const safeFile     = escapeHtml(filename);
  const safeHost     = escapeHtml(
    typeof window !== "undefined" ? (window.location.host || "") : ""
  );

  // ── Logo img tag (only if we got a data-URL) ──
  const logoTag = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="logo" class="logo-img" />`
    : `<span class="logo-text">${safeBrand}</span>`;

  // ── Column headers ──
  const head = cols
    .map((c) => `<th>${escapeHtml(c?.label ?? c?.key ?? "")}</th>`)
    .join("");

  // ── Data rows ──
  const body = rows
    .map((row, idx) => {
      const tds = cols
        .map((c) => {
          const raw =
            typeof c?.format === "function" ? c.format(row?.[c.key], row) : row?.[c.key];
          const val = raw === null || raw === undefined ? "" : raw;
          const isNum = typeof val === "number";
          return `<td class="td${isNum ? " num" : ""}">${escapeHtml(val)}</td>`;
        })
        .join("");
      return `<tr class="${idx % 2 === 0 ? "even" : "odd"}">${tds}</tr>`;
    })
    .join("");

  // ── KPI cards ──
  const kpiHtml = kpis.length
    ? `<div class="kpi-wrap">
        ${kpis
          .map(
            (k) => `<div class="kpi-card">
              <div class="kpi-label">${escapeHtml(k?.label ?? "")}</div>
              <div class="kpi-value">${escapeHtml(k?.value ?? "")}</div>
            </div>`
          )
          .join("")}
       </div>`
    : "";

  // ── Full HTML document ──
  const doc = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${safeFile}</title>
  <style>
    /* ── Reset & page ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @page {
      size: A4 ${escapeHtml(orientation)};
      /* Remove browser-added headers/footers by setting margins to 0
         and then using body padding for breathing room */
      margin: 0;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }

    /* ── Base ── */
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      font-size: 11px;
    }

    /* ── Page wrapper ── */
    .page {
      width: 100%;
      min-height: 100vh;
      background: #f1f5f9;
    }

    /* ── Header band ── */
    .header {
      background: linear-gradient(135deg, #0a1f2e 0%, #0d3349 45%, #0891b2 100%);
      padding: 20px 28px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-img {
      height: 44px;
      width: auto;
      object-fit: contain;
      border-radius: 6px;
      background: rgba(255,255,255,.08);
      padding: 3px;
      flex-shrink: 0;
    }
    .logo-text {
      font-size: 16px;
      font-weight: 900;
      color: #22d3ee;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .logo-divider {
      width: 1px;
      height: 36px;
      background: rgba(255,255,255,.2);
      flex-shrink: 0;
    }
    .header-titles { display: flex; flex-direction: column; gap: 3px; }
    .brand-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #22d3ee;
    }
    .report-title {
      font-size: 18px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.2;
    }
    .report-subtitle {
      font-size: 10.5px;
      color: #94d9f5;
      margin-top: 1px;
    }
    .header-right {
      text-align: right;
      flex-shrink: 0;
    }
    .date-big {
      font-size: 13px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.3;
    }
    .date-small {
      font-size: 10px;
      color: #cffafe;
      line-height: 1.5;
    }

    /* ── Accent bar ── */
    .accent-bar {
      height: 3px;
      background: linear-gradient(90deg, #22d3ee 0%, #0891b2 60%, #0a1f2e 100%);
    }

    /* ── Content area ── */
    .content { padding: 18px 28px 22px; }

    /* ── KPI cards ── */
    .kpi-wrap {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .kpi-card {
      flex: 1;
      min-width: 100px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-top: 3px solid #0891b2;
      border-radius: 8px;
      padding: 10px 13px;
      box-shadow: 0 1px 3px rgba(0,0,0,.07);
    }
    .kpi-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .8px;
      color: #64748b;
      margin-bottom: 5px;
    }
    .kpi-value {
      font-size: 17px;
      font-weight: 900;
      color: #0e7490;
      line-height: 1;
    }

    /* ── Row count ── */
    .row-count {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 8px;
    }

    /* ── Table wrapper ── */
    .tbl-wrap {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,.07);
    }
    table { width: 100%; border-collapse: collapse; }

    /* ── Table header ── */
    thead tr { background: #0e7490; }
    th {
      padding: 9px 11px;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .7px;
      color: #ffffff;
      text-align: left;
      border-right: 1px solid rgba(255,255,255,.12);
      white-space: nowrap;
    }
    th:last-child { border-right: none; }

    /* ── Table body ── */
    .td {
      padding: 7px 11px;
      font-size: 11px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
      border-right: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .td:last-child { border-right: none; }
    .td.num {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      color: #0f172a;
    }
    tr.even .td { background: #ffffff; }
    tr.odd  .td { background: #f0fafb; }
    tr:last-child .td { border-bottom: none; }

    /* ── Footer ── */
    .footer {
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .footer-txt { font-size: 9.5px; color: #94a3b8; }

    /* ── Hint bar (non-print only) ── */
    .hint-bar {
      text-align: center;
      margin-top: 14px;
    }
    .hint-pill {
      display: inline-block;
      padding: 7px 16px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 20px;
      font-size: 10.5px;
      font-weight: 700;
      color: #1d4ed8;
    }
  </style>
</head>
<body>
<div class="page">

  <!-- ── HEADER ── -->
  <div class="header">
    <div class="header-left">
      ${logoTag}
      <div class="logo-divider"></div>
      <div class="header-titles">
        <div class="brand-label">${safeBrand}</div>
        <div class="report-title">${safeTitle}</div>
        ${safeSubtitle ? `<div class="report-subtitle">${safeSubtitle}</div>` : ""}
      </div>
    </div>
    <div class="header-right">
      <div class="date-big">${safeDate}</div>
      <div class="date-small">${safeTime} hrs</div>
      ${safeHost ? `<div class="date-small">${safeHost}</div>` : ""}
    </div>
  </div>
  <div class="accent-bar"></div>

  <!-- ── CONTENT ── -->
  <div class="content">

    <!-- KPI cards -->
    ${kpiHtml}

    <!-- Row count -->
    <div class="row-count">${rows.length} registro${rows.length !== 1 ? "s" : ""} encontrado${rows.length !== 1 ? "s" : ""}</div>

    <!-- Data table -->
    <div class="tbl-wrap">
      <table>
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>

    <!-- Footer -->
    <div class="footer">
      <span class="footer-txt">&copy; ${new Date().getFullYear()} ${safeBrand} &mdash; Generado autom&aacute;ticamente</span>
      <span class="footer-txt">Reporte de ventas &middot; ${safeDate}</span>
    </div>

    <!-- Hint (hidden when printing) -->
    <div class="hint-bar no-print">
      <span class="hint-pill">&#128438; En el di&aacute;logo de impresi&oacute;n selecciona &ldquo;Guardar como PDF&rdquo; y desactiva &ldquo;Encabezados y pies de p&aacute;gina&rdquo;</span>
    </div>

  </div>
</div>

<script>
  setTimeout(function () {
    try { window.focus(); window.print(); } catch (e) {}
  }, 120);
  window.onafterprint = function () {
    try { window.close(); } catch (e) {}
  };
<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    throw new Error(
      "El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio e intenta de nuevo."
    );
  }
  win.document.open();
  win.document.write(doc);
  win.document.close();
}
