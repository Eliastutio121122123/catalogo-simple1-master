import { useEffect, useMemo, useState } from "react";
import { vendorReportService } from "../../services/odoo/vendorReportService";
import { downloadBrandedExcel } from "../../utils/brandedExcel";
import { printTablePdf } from "../../utils/tablePdf";

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(Number(n || 0));

export default function Reports() {
  const [range, setRange] = useState("7d");
  const [rows, setRows] = useState([]);
  const [kpi, setKpi] = useState({ orders: 0, revenue: 0, avgTicket: 0, conversion: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await vendorReportService.getReport(range);
        if (!active) return;
        setRows(Array.isArray(data?.rows) ? data.rows : []);
        setKpi(data?.kpi || { orders: 0, revenue: 0, avgTicket: 0, conversion: 0 });
      } catch (err) {
        if (!active) return;
        setRows([]);
        setKpi({ orders: 0, revenue: 0, avgTicket: 0, conversion: 0 });
        setError(err?.message || "No se pudo cargar el reporte.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [range]);

  const data = useMemo(() => rows, [rows]);

  const exportColumns = useMemo(() => {
    const fmtDay = (day) => {
      if (!day) return "";
      try {
        return new Date(`${day}T00:00:00`).toLocaleDateString("es-DO");
      } catch {
        return String(day);
      }
    };
    return [
      { key: "day", label: "Fecha", format: (_, row) => fmtDay(row.day) },
      { key: "orders", label: "Pedidos", className: "td num" },
      { key: "revenue", label: "Ingresos", className: "td num", format: (_, row) => fmtMoney(row.revenue) },
      { key: "avgTicket", label: "Ticket prom.", className: "td num", format: (_, row) => fmtMoney(row.avgTicket) },
      { key: "conversion", label: "Conversion", className: "td num", format: (_, row) => `${Number(row.conversion || 0).toFixed(1)}%` },
    ];
  }, []);

  const rangeLabel = (r) => (r === "today" ? "Hoy" : r === "30d" ? "Ultimos 30 dias" : "Ultimos 7 dias");

  const exportExcel = () => {
    if (!data.length) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadBrandedExcel({
      filename: `reporte_${range}_${date}.xls`,
      sheetName: "Reporte",
      reportTitle: `Reporte (${rangeLabel(range)})`,
      columns: exportColumns,
      rows: data,
    });
  };

  const exportPdf = async () => {
    if (!data.length) return;
    const date = new Date().toISOString().slice(0, 10);
    await printTablePdf({
      filename: `reporte_${range}_${date}.pdf`,
      title: "Reporte de Ventas",
      subtitle: `Período: ${rangeLabel(range)} · ${date}`,
      columns: exportColumns,
      rows: data,
      brandName: "Catalogix",
      kpis: [
        { label: "Ingresos totales",  value: fmtMoney(kpi.revenue)            },
        { label: "Pedidos",           value: String(kpi.orders)               },
        { label: "Ticket promedio",   value: fmtMoney(kpi.avgTicket)          },
        { label: "Conversión",        value: `${Number(kpi.conversion || 0).toFixed(1)}%` },
      ],
    });
  };

  return (
    <>
      <style>{`
        .vr{display:flex;flex-direction:column;gap:14px}
        .vr-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .vr-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .vr-sub{font-size:12.5px;color:var(--vs-500)}
        .vr-in{padding:9px 12px;border-radius:10px;border:1.5px solid var(--vs-200);background:#fff;font-size:13px}
        .vr-btn{padding:9px 12px;border-radius:10px;border:1.5px solid var(--vs-200);background:#fff;font-size:13px;font-weight:800;color:var(--vs-700);cursor:pointer}
        .vr-btn:hover{border-color:var(--vt-400);color:var(--vt-600)}
        .vr-btn:disabled{opacity:.55;cursor:not-allowed}
        .vr-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        @media(max-width:1000px){.vr-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:600px){.vr-grid{grid-template-columns:1fr}}
        .vr-k{background:#fff;border:1px solid var(--vs-200);border-radius:14px;padding:12px}
        .vr-l{font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase}
        .vr-v{font-family:'Lexend',sans-serif;font-size:24px;font-weight:800;color:var(--vs-900);margin-top:6px}
        .vr-tb{background:#fff;border:1px solid var(--vs-200);border-radius:16px;overflow:hidden}
        .vr-th,.vr-tr{display:grid;grid-template-columns:1fr .8fr 1fr 1fr .8fr;gap:10px;align-items:center;padding:11px 14px}
        .vr-th{background:var(--vs-50);font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase}
        .vr-tr{border-top:1px solid var(--vs-100);font-size:13px;color:var(--vs-700)}
      `}</style>

      <div className="vr">
        <div className="vr-h">
          <div>
            <h1 className="vr-title">Reports</h1>
            <p className="vr-sub">Resumen de rendimiento comercial del vendedor.</p>
            {error && <p style={{ color: "#dc2626", fontSize: 12, fontWeight: 700, marginTop: 4 }}>{error}</p>}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button className="vr-btn" onClick={exportPdf} disabled={!data.length}>Exportar PDF</button>
            <button className="vr-btn" onClick={exportExcel} disabled={!data.length}>Exportar Excel</button>
            <select className="vr-in" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="today">Hoy</option>
              <option value="7d">Ultimos 7 dias</option>
              <option value="30d">Ultimos 30 dias</option>
            </select>
          </div>
        </div>

        <div className="vr-grid">
          <article className="vr-k">
            <div className="vr-l">Ingresos</div>
            <div className="vr-v">{fmtMoney(kpi.revenue)}</div>
          </article>
          <article className="vr-k">
            <div className="vr-l">Pedidos</div>
            <div className="vr-v">{kpi.orders}</div>
          </article>
          <article className="vr-k">
            <div className="vr-l">Ticket promedio</div>
            <div className="vr-v">{fmtMoney(kpi.avgTicket)}</div>
          </article>
          <article className="vr-k">
            <div className="vr-l">Conversion</div>
            <div className="vr-v">{kpi.conversion.toFixed(1)}%</div>
          </article>
        </div>

        <div className="vr-tb">
          <div className="vr-th">
            <span>Fecha</span>
            <span>Pedidos</span>
            <span>Ingresos</span>
            <span>Ticket prom.</span>
            <span>Conv.</span>
          </div>
          {loading && <div className="vr-tr"><span>Cargando...</span></div>}
          {!loading && data.length === 0 && (
            <div className="vr-tr"><span>Sin datos para el rango seleccionado.</span></div>
          )}
          {!loading && data.map((r) => (
            <div className="vr-tr" key={r.day}>
              <span>{new Date(`${r.day}T00:00:00`).toLocaleDateString("es-DO")}</span>
              <span>{r.orders}</span>
              <span>{fmtMoney(r.revenue)}</span>
              <span>{fmtMoney(r.avgTicket)}</span>
              <span>{r.conversion}%</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
