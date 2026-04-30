import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { downloadBrandedExcel } from "../../utils/brandedExcel";
import { api } from "../../services/odoo/odooClient";

const STATUS_LABELS = {
  paid: "Pagado",
  processing: "Procesando",
  shipped: "Enviado",
  review: "En revisión",
  cancelled: "Cancelado",
};

const statusClass = (status) => {
  if (status === "paid") return "pill ok";
  if (status === "processing") return "pill warn";
  if (status === "shipped") return "pill info";
  if (status === "cancelled") return "pill err";
  return "pill muted";
};

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n || 0);

const fmtShortMoney = (n) => {
  if (!n && n !== 0) return "RD$ 0";
  if (n >= 1_000_000) return `RD$ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `RD$ ${(n / 1_000).toFixed(0)}K`;
  return fmtMoney(n);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState(null);

  const [kpis, setKpis] = useState([]);
  const [salesChart, setSalesChart] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setErrMsg(null);
    try {
      const data = await api.get(`/api/admin/dashboard?range=${range}`);
      setKpis(data.kpis || []);
      setSalesChart(data.salesChart || []);
      setTopCategories(data.topCategories || []);
      setRecentOrders(data.recentOrders || []);
      setAlerts(data.alerts || []);
    } catch (err) {
      setErrMsg(err.message || "Error al cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const maxSales = useMemo(
    () => Math.max(...salesChart.map((s) => s.value), 1),
    [salesChart]
  );

  const handleExport = () => {
    if (!recentOrders.length) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadBrandedExcel({
      filename: `dashboard_pedidos_${date}.xls`,
      sheetName: "Dashboard",
      reportTitle: "Pedidos recientes (Dashboard)",
      columns: [
        { key: "id", label: "Orden" },
        { key: "vendor", label: "Vendedor" },
        { key: "customer", label: "Cliente" },
        { key: "total", label: "Total", className: "td num", format: (_, row) => fmtMoney(row.total) },
        { key: "status", label: "Estado", format: (_, row) => STATUS_LABELS[row.status] || row.status },
      ],
      rows: recentOrders,
    });
  };

  const formatKpiValue = (kpi) => {
    if (kpi.format === "money") return fmtShortMoney(kpi.value);
    return new Intl.NumberFormat("es-DO").format(kpi.value || 0);
  };

  return (
    <>
      <style>{`
        .dash-wrap{display:flex;flex-direction:column;gap:16px}
        .dash-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .dash-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
        .dash-sub{color:var(--slate-500);font-size:13px}
        .dash-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
        .btn{border:1px solid var(--slate-200);background:#fff;color:var(--slate-700);padding:9px 12px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer;transition:all .2s}
        .btn:hover{border-color:var(--blue-400,#60a5fa);color:var(--blue-600,#2563eb)}
        .btn:disabled{opacity:.5;cursor:not-allowed}
        .btn.primary{border:none;background:linear-gradient(135deg,var(--blue-600),var(--teal-500));color:#fff}
        .btn.primary:hover{opacity:.9;transform:translateY(-1px)}

        .range{display:flex;gap:6px;align-items:center}
        .chip{padding:6px 10px;border-radius:999px;border:1px solid var(--slate-200);font-size:11px;font-weight:800;color:var(--slate-600);background:#fff;cursor:pointer;transition:all .2s}
        .chip:hover{border-color:var(--blue-200,#bfdbfe)}
        .chip.active{background:var(--blue-50);border-color:var(--blue-100);color:var(--blue-700)}

        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        @media(max-width:1100px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.kpi-grid{grid-template-columns:1fr}}
        .kpi-card{background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px;transition:box-shadow .2s}
        .kpi-card:hover{box-shadow:0 2px 12px rgba(0,0,0,.06)}
        .kpi-label{font-size:11px;text-transform:uppercase;color:var(--slate-500);font-weight:800}
        .kpi-value{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--slate-900)}
        .kpi-delta{font-size:11px;font-weight:800;padding:4px 8px;border-radius:999px;align-self:flex-start}
        .kpi-delta.up{background:rgba(34,197,94,.12);color:#15803d}
        .kpi-delta.down{background:rgba(239,68,68,.12);color:#b91c1c}

        .dash-grid{display:grid;grid-template-columns:2fr 1fr;gap:12px}
        @media(max-width:1100px){.dash-grid{grid-template-columns:1fr}}

        .card{background:#fff;border:1px solid var(--slate-200);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:12px;transition:box-shadow .2s}
        .card:hover{box-shadow:0 2px 12px rgba(0,0,0,.04)}
        .card-head{display:flex;align-items:center;justify-content:space-between}
        .card-title{font-size:14px;font-weight:800;color:var(--slate-900)}
        .card-sub{font-size:12px;color:var(--slate-500)}

        .chart{height:220px;display:flex;align-items:flex-end;gap:10px;padding:12px;border-radius:14px;background:linear-gradient(180deg,rgba(59,130,246,.08),transparent)}
        .bar{flex:1;display:flex;flex-direction:column;gap:6px;align-items:center}
        .bar-fill{width:100%;border-radius:10px;background:linear-gradient(180deg,#2563eb,#22d3ee);transition:height .5s ease;min-height:4px}
        .bar-label{font-size:11px;color:var(--slate-500);font-weight:700}
        .bar-tooltip{font-size:10px;color:var(--blue-700);font-weight:800;opacity:0;transition:opacity .2s}
        .bar:hover .bar-tooltip{opacity:1}

        .cats{display:flex;flex-direction:column;gap:10px}
        .cat-row{display:flex;align-items:center;gap:10px}
        .cat-dot{width:10px;height:10px;border-radius:50%}
        .cat-name{font-size:12px;font-weight:700;color:var(--slate-700)}
        .cat-bar{flex:1;height:8px;border-radius:999px;background:var(--slate-100);overflow:hidden}
        .cat-bar span{display:block;height:100%;border-radius:999px;transition:width .5s ease}
        .cat-value{font-size:12px;font-weight:800;color:var(--slate-900)}

        .orders{display:flex;flex-direction:column;gap:10px}
        .order-row{display:grid;grid-template-columns:0.9fr 1fr 1fr 0.7fr 0.7fr;gap:10px;align-items:center;padding:10px 12px;border:1px solid var(--slate-100);border-radius:12px;transition:background .15s}
        .order-row:hover:not(.head){background:var(--slate-50,#f8fafc)}
        .order-row.head{background:var(--slate-50);border:none;font-size:11px;font-weight:800;text-transform:uppercase;color:var(--slate-500)}
        .order-ttl{font-size:12.5px;font-weight:800;color:var(--slate-900)}
        .order-sub{font-size:12px;color:var(--slate-500)}
        .pill{padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800;display:inline-flex}
        .pill.ok{background:rgba(34,197,94,.12);color:#15803d}
        .pill.warn{background:rgba(245,158,11,.12);color:#b45309}
        .pill.info{background:rgba(14,165,233,.12);color:#0369a1}
        .pill.err{background:rgba(239,68,68,.12);color:#b91c1c}
        .pill.muted{background:rgba(148,163,184,.2);color:#475569}

        .alerts{display:flex;flex-direction:column;gap:10px}
        .alert{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--slate-100);border-radius:12px;transition:background .15s}
        .alert:hover{background:var(--slate-50,#f8fafc)}
        .alert-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
        .alert-info{flex:1;min-width:0}
        .alert-title{font-size:12.5px;font-weight:800;color:var(--slate-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .alert-sub{font-size:12px;color:var(--slate-500)}
        .alert-tag{font-size:11px;font-weight:800;padding:4px 8px;border-radius:999px;flex-shrink:0}
        .alert-tag.critical{background:rgba(239,68,68,.12);color:#b91c1c}
        .alert-tag.warning{background:rgba(245,158,11,.12);color:#b45309}
        .alert-tag.info{background:rgba(14,165,233,.12);color:#0369a1}

        .dash-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:var(--slate-500);font-size:14px}
        .dash-loading .spinner{width:22px;height:22px;border:3px solid var(--slate-200);border-top-color:var(--blue-600,#2563eb);border-radius:50%;animation:dash-spin .7s linear infinite}
        @keyframes dash-spin{to{transform:rotate(360deg)}}
        .dash-error{padding:24px;text-align:center;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:14px;color:#b91c1c;font-size:13px;font-weight:600}
        .dash-error button{margin-top:10px;padding:8px 16px;border:1px solid rgba(239,68,68,.3);border-radius:10px;background:#fff;color:#b91c1c;font-weight:800;font-size:12px;cursor:pointer}

        .empty-card{display:flex;align-items:center;justify-content:center;padding:30px;color:var(--slate-400);font-size:13px}
      `}</style>

      <div className="dash-wrap">
        <div className="dash-head">
          <div>
            <h1 className="dash-title">Dashboard</h1>
            <p className="dash-sub">Resumen general del negocio y operaciones — datos en tiempo real de Odoo.</p>
          </div>
          <div className="dash-actions">
            <div className="range">
              {["24h", "7d", "30d"].map((r) => (
                <button key={r} className={`chip${range === r ? " active" : ""}`} onClick={() => setRange(r)}>{r}</button>
              ))}
            </div>
            <button className="btn" onClick={handleExport} disabled={!recentOrders.length}>Exportar</button>
            <button className="btn" onClick={fetchDashboard} disabled={loading}>
              {loading ? "Cargando..." : "⟳ Actualizar"}
            </button>
          </div>
        </div>

        {errMsg && (
          <div className="dash-error">
            {errMsg}
            <br />
            <button onClick={fetchDashboard}>Reintentar</button>
          </div>
        )}

        {loading ? (
          <div className="dash-loading">
            <div className="spinner" />
            Cargando dashboard desde Odoo...
          </div>
        ) : (
          <>
            {/* ── KPI Cards ──────────────────────────────── */}
            <div className="kpi-grid">
              {kpis.map((k) => (
                <div key={k.id} className="kpi-card">
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-value">{formatKpiValue(k)}</div>
                  <span className={`kpi-delta ${k.trend}`}>{k.delta}</span>
                </div>
              ))}
            </div>

            {/* ── Sales Chart + Categories ────────────────── */}
            <div className="dash-grid">
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">Ventas semanales</div>
                    <div className="card-sub">Comparado con la semana anterior</div>
                  </div>
                  <div className="order-sub">Base: RD$</div>
                </div>
                {salesChart.length > 0 ? (
                  <div className="chart">
                    {salesChart.map((row) => (
                      <div key={row.day} className="bar">
                        <span className="bar-tooltip">{fmtShortMoney(row.value)}</span>
                        <div className="bar-fill" style={{ height: `${Math.max(Math.round((row.value / maxSales) * 100), 3)}%` }} />
                        <span className="bar-label">{row.day}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-card">Sin datos de ventas para este período</div>
                )}
              </div>
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">Categorías líderes</div>
                    <div className="card-sub">Participación por ventas</div>
                  </div>
                </div>
                {topCategories.length > 0 ? (
                  <div className="cats">
                    {topCategories.map((row) => (
                      <div key={row.name} className="cat-row">
                        <span className="cat-dot" style={{ background: row.color }} />
                        <div className="cat-name">{row.name}</div>
                        <div className="cat-bar"><span style={{ width: `${row.value}%`, background: row.color }} /></div>
                        <div className="cat-value">{row.value}%</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-card">Sin datos de categorías</div>
                )}
              </div>
            </div>

            {/* ── Recent Orders + Alerts ──────────────────── */}
            <div className="dash-grid">
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">Pedidos recientes</div>
                    <div className="card-sub">Últimas órdenes procesadas</div>
                  </div>
                  <button className="btn" onClick={() => navigate("/admin/orders")}>Ver pedidos</button>
                </div>
                {recentOrders.length > 0 ? (
                  <div className="orders">
                    <div className="order-row head">
                      <div>Orden</div>
                      <div>Vendedor</div>
                      <div>Cliente</div>
                      <div>Total</div>
                      <div>Estado</div>
                    </div>
                    {recentOrders.map((row) => (
                      <div key={row.id} className="order-row">
                        <div className="order-ttl">{row.id}</div>
                        <div className="order-sub">{row.vendor || "—"}</div>
                        <div className="order-sub">{row.customer}</div>
                        <div className="order-ttl">{fmtMoney(row.total)}</div>
                        <div><span className={statusClass(row.status)}>{STATUS_LABELS[row.status] || row.status}</span></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-card">No hay pedidos recientes</div>
                )}
              </div>
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">Alertas activas</div>
                    <div className="card-sub">Requieren atención</div>
                  </div>
                  <button className="btn" onClick={() => navigate("/admin/audit")}>Ver auditoría</button>
                </div>
                {alerts.length > 0 ? (
                  <div className="alerts">
                    {alerts.map((row) => (
                      <div key={row.id} className="alert">
                        <span className="alert-dot" style={{ background: row.type === "critical" ? "#ef4444" : row.type === "warning" ? "#f59e0b" : "#0ea5e9" }} />
                        <div className="alert-info">
                          <div className="alert-title">{row.label}</div>
                          <div className="alert-sub">{row.time}</div>
                        </div>
                        <span className={`alert-tag ${row.type}`}>{row.type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-card">Sin alertas activas</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
