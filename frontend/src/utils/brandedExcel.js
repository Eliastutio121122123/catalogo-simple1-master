const BOM = "\uFEFF";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// ── Logo helpers ─────────────────────────────────────────────────────────────

const toDataUrlFromBlob = (blob) =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload  = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Failed to read logo"));
      reader.readAsDataURL(blob);
    } catch (err) {
      reject(err);
    }
  });

const baseUrl = () => {
  try {
    const b = import.meta?.env?.BASE_URL;
    return typeof b === "string" && b.length ? b : "/";
  } catch {
    return "/";
  }
};

const defaultLogoUrl = () => `${baseUrl()}brand/catalogix.png`;

// Persistent cache across calls in the same session
const _logoCache = new Map();

/**
 * Fetch the logo and return it as a base64 data-URL.
 * Tries the given URL first, then origin-relative paths as fallbacks.
 */
const fetchLogoDataUrl = async (url) => {
  const candidates = [
    url,
    defaultLogoUrl(),
    "/brand/catalogix.png",
    `${window.location.origin}/brand/catalogix.png`,
  ].filter(Boolean);

  for (const target of candidates) {
    if (_logoCache.has(target)) return _logoCache.get(target);
    try {
      const r = await fetch(target, { cache: "force-cache" });
      if (!r.ok) continue;
      const blob = await r.blob();
      const dataUrl = await toDataUrlFromBlob(blob);
      if (dataUrl) {
        _logoCache.set(target, dataUrl);
        // Cache all equivalent keys
        candidates.forEach((k) => { if (k) _logoCache.set(k, dataUrl); });
        return dataUrl;
      }
    } catch {
      // try next candidate
    }
  }
  return "";
};

// Start preloading immediately so the cache is warm by export time
fetchLogoDataUrl(defaultLogoUrl()).catch(() => {});

// ── Column sizing ─────────────────────────────────────────────────────────────

const colWidthHint = (col) => {
  const key   = String(col?.key   || "").toLowerCase();
  const label = String(col?.label || col?.key || "");
  if (key.includes("email"))                                                  return 30;
  if (key.includes("descripcion") || key.includes("description"))             return 36;
  if (key.includes("name") || key.includes("nombre") ||
      key.includes("vendor") || key.includes("customer"))                     return 26;
  if (key.includes("catalog") || key.includes("catalogo"))                   return 20;
  if (key.includes("status") || key.includes("estado"))                      return 14;
  if (key.includes("date") || key.includes("fecha") || key.includes("updated")) return 18;
  if (key.includes("price") || key.includes("precio") ||
      key.includes("total") || key.includes("monto"))                        return 16;
  if (key.includes("sku") || key.includes("id") || key.includes("code"))    return 14;
  return Math.min(28, Math.max(12, label.length + 6));
};

const colWidth = (col) => {
  const base = colWidthHint(col);
  return Math.min(250, Math.max(60, Math.round(base * 4.5)));
};

const isNumericColumn = (col, value) => {
  if (col?.align === "right") return true;
  const cls = typeof col?.className === "function" ? col.className(value, {}) : col?.className;
  if (typeof cls === "string" && cls.toLowerCase().includes("num")) return true;
  return typeof value === "number";
};

// ── HTML builder ──────────────────────────────────────────────────────────────

const buildExcelHtml = ({ sheetName, reportTitle, columns, rows, brandName, logoDataUrl }) => {
  const cols = Array.isArray(columns) ? columns : [];
  const dataColCount = Math.max(1, cols.length);
  // 2 padding columns on each side for breathing room
  const PAD = 2;
  const colCount = dataColCount + PAD * 2;
  const padCol   = `<col width="4" />`;

  const now = new Date();
  const dateLabel = now.toLocaleDateString("es-DO", { year: "numeric", month: "numeric", day: "numeric" });
  const timeLabel = now.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });

  const safeSheet = String(sheetName  || "Reporte").slice(0, 31).replace(/[\[\]\*\/\\?\:]/g, " ");
  const safeBrand = String(brandName  || "Catalogix").trim() || "Catalogix";
  const safeTitle = String(reportTitle || "Reporte").trim()  || "Reporte";

  // ── Color palette — dark teal brand (same as the original) ────────────────
  const C_HEADER_BG = "#0a1f2e";   // very dark navy — logo banner
  const C_TITLE_BG  = "#0d3349";   // slightly lighter — title band
  const C_DATE_BG   = "#0f4060";   // accent band below title
  const C_ACCENT    = "#22d3ee";   // teal accent
  const C_HEAD_ROW  = "#0e7490";   // column header row
  const C_HEAD_TEXT = "#ffffff";
  const C_ROW_EVEN  = "#ffffff";
  const C_ROW_ODD   = "#f0fafb";   // very light teal tint
  const C_CELL_TEXT = "#0f172a";
  const C_BORDER    = "#cbd5e1";
  const C_SUB_TEXT  = "#64748b";

  const colgroup =
    padCol.repeat(PAD) +
    cols.map((c) => `<col width="${colWidth(c)}" />`).join("") +
    padCol.repeat(PAD);

  // Padding cells
  const padCellDark  = (bg) => `<td colspan="${PAD}" bgcolor="${escapeHtml(bg)}" style="border:none;padding:0;"></td>`;
  const padCellLight = (bg) => `<td colspan="${PAD}" bgcolor="${escapeHtml(bg)}" style="border:none;padding:0;"></td>`;

  // ── Logo + brand row ───────────────────────────────────────────────────────
  // Logo image embedded as base64 so it always renders — falls back to brand name text.
  const logoRow = `
  <tr>
    ${padCellDark(C_HEADER_BG)}
    <td colspan="${dataColCount}" bgcolor="${escapeHtml(C_HEADER_BG)}" align="center" style="padding:16px 8px 12px 8px;border:none;">
      <b><font size="6" color="#ffffff" face="Calibri,Arial,sans-serif">${escapeHtml(safeBrand)}</font></b>
      <font color="${escapeHtml(C_ACCENT)}"><b>&nbsp;&#x25cf;</b></font>
    </td>
    ${padCellDark(C_HEADER_BG)}
  </tr>`;

  // ── Report title row ───────────────────────────────────────────────────────
  const titleRow = `
  <tr>
    ${padCellDark(C_TITLE_BG)}
    <td colspan="${dataColCount}" bgcolor="${escapeHtml(C_TITLE_BG)}" align="center"
        style="padding:10px 12px 6px;border-left:none;border-right:none;">
      <b><font size="5" color="#ecfeff" face="Calibri,Arial,sans-serif">${escapeHtml(safeTitle)}</font></b>
    </td>
    ${padCellDark(C_TITLE_BG)}
  </tr>`;

  // ── Date row ──────────────────────────────────────────────────────────────
  const dateRow = `
  <tr>
    ${padCellDark(C_DATE_BG)}
    <td colspan="${dataColCount}" bgcolor="${escapeHtml(C_DATE_BG)}" align="center"
        style="padding:4px 12px 12px;border-left:none;border-right:none;border-bottom:3px solid ${escapeHtml(C_ACCENT)};">
      <font size="2" color="#cffafe" face="Calibri,Arial,sans-serif">
        <b>${escapeHtml(dateLabel)} &nbsp;&#x2022;&nbsp; ${escapeHtml(timeLabel)}</b>
      </font>
    </td>
    ${padCellDark(C_DATE_BG)}
  </tr>`;

  // ── Subtitle row ───────────────────────────────────────────────────────────
  const subtitleRow = `
  <tr>
    <td colspan="${colCount}" bgcolor="${escapeHtml(C_ROW_EVEN)}" align="center"
        style="padding:8px 0 6px;border:none;color:${escapeHtml(C_SUB_TEXT)};font-size:11px;font-style:italic;">
      <font color="${escapeHtml(C_SUB_TEXT)}" size="2">Exportado desde ${escapeHtml(safeBrand)}.</font>
    </td>
  </tr>`;

  // ── Spacer row ─────────────────────────────────────────────────────────────
  const spacerRow = `
  <tr>
    <td colspan="${colCount}" style="padding:4px 0;border:none;"></td>
  </tr>`;

  // ── Column header row ──────────────────────────────────────────────────────
  const headerCells =
    `<td colspan="${PAD}" bgcolor="${escapeHtml(C_HEAD_ROW)}" style="border:none;padding:0;"></td>` +
    cols
      .map((c) => {
        const label = escapeHtml(c.label ?? c.key);
        return `<td bgcolor="${escapeHtml(C_HEAD_ROW)}" align="center" valign="middle"
          style="color:${C_HEAD_TEXT};font-weight:800;font-size:11px;text-transform:uppercase;
                 letter-spacing:.8px;border:1px solid ${escapeHtml(C_BORDER)};
                 white-space:nowrap;padding:9px 10px;font-family:Calibri,Arial,sans-serif;">
          ${label}
        </td>`;
      })
      .join("") +
    `<td colspan="${PAD}" bgcolor="${escapeHtml(C_HEAD_ROW)}" style="border:none;padding:0;"></td>`;

  const headerRow = `<tr>${headerCells}</tr>`;

  // ── Data rows ──────────────────────────────────────────────────────────────
  const body = (rows || [])
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? C_ROW_EVEN : C_ROW_ODD;
      const padCell = `<td colspan="${PAD}" bgcolor="${escapeHtml(bg)}" style="border:none;padding:0;"></td>`;
      const cells = cols
        .map((c) => {
          const raw = typeof c.format === "function" ? c.format(row?.[c.key], row) : row?.[c.key];
          const val = raw === null || raw === undefined ? "" : raw;
          const numeric = isNumericColumn(c, val);
          const align   = numeric ? "right" : "left";
          const tdStyle = `border:1px solid ${C_BORDER};padding:7px 10px;font-size:12px;
            vertical-align:middle;color:${C_CELL_TEXT};font-family:Calibri,Arial,sans-serif;`;
          const maybeFmt = numeric && typeof val === "number"
            ? `mso-number-format:'0';`
            : `mso-number-format:'@';`;
          return `<td bgcolor="${escapeHtml(bg)}" align="${align}" style="${tdStyle + maybeFmt}">${escapeHtml(val)}</td>`;
        })
        .join("");
      return `<tr>${padCell}${cells}${padCell}</tr>`;
    })
    .join("");

  // ── Footer row ─────────────────────────────────────────────────────────────
  const footerRow = `
  <tr>
    <td colspan="${colCount}" bgcolor="${escapeHtml(C_ROW_EVEN)}" align="center"
        style="padding:10px 0 8px;border-top:2px solid ${escapeHtml(C_ACCENT)};border-bottom:none;
               color:${escapeHtml(C_SUB_TEXT)};font-size:11px;">
      <font color="${escapeHtml(C_SUB_TEXT)}" size="2">&copy; ${now.getFullYear()} ${escapeHtml(safeBrand)} &mdash; Reporte generado autom&aacute;ticamente</font>
    </td>
  </tr>`;

  return (
    BOM +
    `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8" />
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>${escapeHtml(safeSheet)}</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
  </head>
  <body>
    <table border="0" cellpadding="0" cellspacing="0" style="font-family:Calibri,Arial,sans-serif;border-collapse:collapse;">
      <colgroup>${colgroup}</colgroup>
      ${logoRow}
      ${titleRow}
      ${dateRow}
      ${subtitleRow}
      ${spacerRow}
      ${headerRow}
      ${body}
      ${spacerRow}
      ${footerRow}
    </table>
  </body>
</html>`
  );
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Download a branded Excel file.
 * This is async so the logo is always fetched (and cached) before generating.
 */
export const downloadBrandedExcel = async ({
  filename,
  sheetName    = "Reporte",
  reportTitle  = "Reporte",
  brandName    = "Catalogix",
  logoUrl,
  logoDataUrl: providedDataUrl,
  columns,
  rows,
}) => {
  // Resolve logo: prefer a provided data-URL, then fetch from URL, else ""
  let resolvedDataUrl = "";
  if (typeof providedDataUrl === "string" && providedDataUrl.startsWith("data:")) {
    resolvedDataUrl = providedDataUrl;
  } else {
    const target = typeof logoUrl === "string" && logoUrl ? logoUrl : defaultLogoUrl();
    resolvedDataUrl = await fetchLogoDataUrl(target).catch(() => "");
  }

  const html = buildExcelHtml({
    sheetName,
    reportTitle,
    columns,
    rows,
    brandName,
    logoDataUrl: resolvedDataUrl,
  });

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
