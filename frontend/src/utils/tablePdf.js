const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const fmtNow = () => {
  const d = new Date();
  const date = d.toLocaleDateString("es-DO", { year: "numeric", month: "short", day: "2-digit" });
  const time = d.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
};

/**
 * "Export to PDF" via the browser print dialog (user can save as PDF).
 * Accepts the same `columns/rows` structure used by brandedExcel.
 */
export function printTablePdf({
  title = "Export",
  subtitle = "",
  filename = "export.pdf",
  columns = [],
  rows = [],
  orientation = "landscape",
} = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("No hay datos para exportar.");
  }
  const cols = Array.isArray(columns) ? columns : [];
  const { date, time } = fmtNow();
  const safeTitle = escapeHtml(title);
  const safeSubtitle = escapeHtml(subtitle);

  const head = cols
    .map((c) => `<th>${escapeHtml(c?.label ?? c?.key ?? "")}</th>`)
    .join("");

  const body = rows
    .map((row) => {
      const tds = cols
        .map((c) => {
          const raw = typeof c?.format === "function" ? c.format(row?.[c.key], row) : row?.[c.key];
          const val = raw === null || raw === undefined ? "" : raw;
          const isNum = typeof val === "number";
          return `<td class="${isNum ? "num" : ""}">${escapeHtml(val)}</td>`;
        })
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  const doc = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(filename)}</title>
      <style>
        @page { size: A4 ${escapeHtml(orientation)}; margin: 12mm; }
        *{ box-sizing:border-box; }
        body{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif; color:#0f172a; }
        .h{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:10px; }
        .t{ font-size:18px; font-weight:900; margin:0; }
        .s{ font-size:12px; color:#475569; margin:2px 0 0; }
        .meta{ text-align:right; font-size:11px; color:#64748b; }
        table{ width:100%; border-collapse:collapse; }
        th, td{ border:1px solid #e2e8f0; padding:7px 8px; font-size:11px; vertical-align:top; }
        th{ background:#f1f5f9; text-transform:uppercase; letter-spacing:.5px; font-size:10px; color:#334155; }
        tr:nth-child(even) td{ background:#fbfdff; }
        td.num{ text-align:right; font-variant-numeric: tabular-nums; }
        .foot{ margin-top:10px; font-size:10px; color:#94a3b8; }
      </style>
    </head>
    <body>
      <div class="h">
        <div>
          <h1 class="t">${safeTitle}</h1>
          ${safeSubtitle ? `<div class="s">${safeSubtitle}</div>` : ``}
        </div>
        <div class="meta">
          <div>${escapeHtml(date)} · ${escapeHtml(time)}</div>
          <div>${escapeHtml(window.location.host || "")}</div>
        </div>
      </div>
      <table>
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
      <div class="foot">Usa “Guardar como PDF” en el diálogo de impresión.</div>
      <script>
        setTimeout(() => {
          try { window.focus(); window.print(); } catch (e) {}
        }, 50);
        window.onafterprint = () => { try { window.close(); } catch (e) {} };
      </script>
    </body>
  </html>`;

  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("El navegador bloqueó la exportación. Permite ventanas emergentes e intenta de nuevo.");
  }
  win.document.open();
  win.document.write(doc);
  win.document.close();
}

