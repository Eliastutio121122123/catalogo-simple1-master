import { useEffect, useMemo, useState, useCallback } from "react";
import { downloadBrandedExcel } from "../../utils/brandedExcel";
import { api } from "../../services/odoo/odooClient";

const STATUS = ["all", "paid", "processing", "shipped", "review", "cancelled"];
const CHANNELS = ["all", "web", "mobile", "manual"];

const statusLabel = (s) => {
  if (s === "paid") return "Pagado";
  if (s === "processing") return "Procesando";
  if (s === "shipped") return "Enviado";
  if (s === "review") return "En revisión";
  if (s === "cancelled") return "Cancelado";
  return s || "—";
};

const statusClass = (s) => {
  if (s === "paid") return "badge ok";
  if (s === "processing") return "badge warn";
  if (s === "shipped") return "badge info";
  if (s === "review") return "badge muted";
  if (s === "cancelled") return "badge err";
  return "badge muted";
};

const channelLabel = (c) => {
  if (c === "web") return "Web";
  if (c === "mobile") return "Móvil";
  if (c === "manual") return "Manual";
  return c || "—";
};

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("es-DO"); } catch { return "—"; }
};

export default function Orders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [channel, setChannel] = useState("all");

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, processing: 0, shipped: 0, cancelled: 0, paid: 0, review: 0 });
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setErrMsg(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (status !== "all") params.set("status", status);
      if (channel !== "all") params.set("channel", channel);
      params.set("limit", "500");

      const data = await api.get(`/api/admin/orders?${params.toString()}`);
      setOrders(data.items || []);
      setStats(data.stats || { total: 0, processing: 0, shipped: 0, cancelled: 0, paid: 0, review: 0 });
    } catch (err) {
      setErrMsg(err.message || "Error al cargar los pedidos.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, channel]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchOrders(), 300);
    return () => clearTimeout(debounce);
  }, [fetchOrders]);

  /* Client-side filtering for instant UX */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((row) => {
      const text = `${row.id} ${row.customer} ${row.vendor}`.toLowerCase();
      const matchSearch = !q || text.includes(q);
      const matchStatus = status === "all" || row.status === status;
      const matchChannel = channel === "all" || row.channel === channel;
      return matchSearch && matchStatus && matchChannel;
    });
  }, [search, status, channel, orders]);

  const handleExport = () => {
    if (!filtered.length) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadBrandedExcel({
      filename: `pedidos_${date}.xls`,
      sheetName: "Pedidos",
      reportTitle: "Reporte de Pedidos",
      columns: [
        { key: "id", label: "Orden" },
        { key: "customer", label: "Cliente" },
        { key: "vendor", label: "Vendedor" },
        { key: "total", label: "Total", className: "td num", format: (_, row) => fmtMoney(row.total) },
        { key: "status", label: "Estado", format: (_, row) => statusLabel(row.status) },
        { key: "channel", label: "Canal", format: (_, row) => channelLabel(row.channel) },
        { key: "updatedAt", label: "Actualizado", format: (_, row) => fmtDate(row.updatedAt) },
      ],
      rows: filtered,
    });
  };

  return (
    <>
      <style>{`
        .ord-wrap{display:flex;flex-direction:column;gap:16px}
        .ord-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .ord-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
        .ord-sub{color:var(--slate-500);font-size:13px}
        .ord-actions{display:flex;gap:8px;flex-wrap:wrap}
        .btn{border:1px solid var(--slate-200);background:#fff;color:var(--slate-700);padding:9px 12px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer;transition:all .2s}
        .btn:hover{border-color:var(--blue-400,#60a5fa);color:var(--blue-600,#2563eb)}
        .btn:disabled{opacity:.5;cursor:not-allowed}
        .btn.primary{border:none;background:linear-gradient(135deg,var(--blue-600),var(--teal-500));color:#fff}
        .btn.primary:hover{opacity:.9;transform:translateY(-1px)}

        .ord-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        @media(max-width:1100px){.ord-stats{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.ord-stats{grid-template-columns:1fr}}
        .stat-card{background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px;display:flex;align-items:center;justify-content:space-between;transition:box-shadow .2s}
        .stat-card:hover{box-shadow:0 2px 12px rgba(0,0,0,.06)}
        .stat-label{font-size:11px;text-transform:uppercase;color:var(--slate-500);font-weight:800}
        .stat-value{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--slate-900)}
        .stat-pill{padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}
        .stat-pill.ok{background:rgba(16,185,129,.12);color:#0f766e}
        .stat-pill.warn{background:rgba(245,158,11,.12);color:#b45309}
        .stat-pill.muted{background:rgba(148,163,184,.2);color:#475569}
        .stat-pill.err{background:rgba(239,68,68,.12);color:#b91c1c}

        .ord-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px}
        .search{display:flex;align-items:center;gap:8px;border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;background:#fff;min-width:220px;transition:border-color .2s}
        .search:focus-within{border-color:var(--blue-400,#60a5fa)}
        .search input{border:none;outline:none;background:none;font-size:13px;flex:1;color:var(--slate-700)}
        .sel{border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;font-size:13px;color:var(--slate-700);background:#fff;cursor:pointer}

        .ord-table{background:#fff;border:1px solid var(--slate-200);border-radius:16px;overflow:hidden}
        .ord-row{display:grid;grid-template-columns:0.9fr 1.2fr 1fr 0.7fr 0.7fr 0.6fr;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid var(--slate-100);transition:background .15s}
        .ord-row:hover:not(.head){background:var(--slate-50,#f8fafc)}
        .ord-row.head{background:var(--slate-50);font-size:11px;font-weight:800;color:var(--slate-500);text-transform:uppercase;border-top:none}
        .ord-main{display:flex;flex-direction:column;gap:2px}
        .ord-ttl{font-weight:800;color:var(--slate-900);font-size:13px}
        .ord-subtxt{font-size:12px;color:var(--slate-500)}
        .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:800;border-radius:999px;padding:4px 8px;border:1px solid transparent}
        .badge.ok{background:rgba(34,197,94,.12);color:#15803d}
        .badge.warn{background:rgba(245,158,11,.12);color:#b45309}
        .badge.info{background:rgba(14,165,233,.12);color:#0369a1}
        .badge.muted{background:rgba(148,163,184,.2);color:#475569}
        .badge.err{background:rgba(239,68,68,.12);color:#b91c1c}
        .btn-xs{padding:6px 8px;border-radius:8px;border:1px solid var(--slate-200);background:#fff;font-size:11px;font-weight:800;color:var(--slate-600);cursor:pointer;transition:all .15s}
        .btn-xs:hover{border-color:var(--blue-400,#60a5fa);color:var(--blue-600,#2563eb)}
        .empty{padding:30px;text-align:center;color:var(--slate-500);font-size:13px}

        .ord-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:40px;color:var(--slate-500);font-size:14px}
        .ord-loading .spinner{width:20px;height:20px;border:3px solid var(--slate-200);border-top-color:var(--blue-600,#2563eb);border-radius:50%;animation:ord-spin .7s linear infinite}
        @keyframes ord-spin{to{transform:rotate(360deg)}}
        .ord-error{padding:24px;text-align:center;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:14px;color:#b91c1c;font-size:13px;font-weight:600}
        .ord-error button{margin-top:10px;padding:8px 16px;border:1px solid rgba(239,68,68,.3);border-radius:10px;background:#fff;color:#b91c1c;font-weight:800;font-size:12px;cursor:pointer}

        /* ── Detail Modal ───────────────────────────────── */
        .ord-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);backdrop-filter:blur(4px);z-index:900;display:flex;align-items:center;justify-content:center;animation:ord-fadeIn .2s ease}
        @keyframes ord-fadeIn{from{opacity:0}to{opacity:1}}
        .ord-modal{background:#fff;border-radius:18px;width:95%;max-width:520px;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.18);animation:ord-slideUp .25s ease}
        @keyframes ord-slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .ord-modal-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 12px;border-bottom:1px solid var(--slate-100)}
        .ord-modal-title{font-family:'Lexend',sans-serif;font-size:18px;font-weight:800;color:var(--slate-900)}
        .ord-modal-close{width:32px;height:32px;border-radius:10px;border:1px solid var(--slate-200);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--slate-500);font-size:16px;transition:all .15s}
        .ord-modal-close:hover{background:var(--slate-50);border-color:var(--slate-300)}
        .ord-modal-body{padding:16px 24px 24px;display:flex;flex-direction:column;gap:14px}
        .ord-detail-row{display:flex;justify-content:space-between;align-items:center;gap:12px}
        .ord-detail-label{font-size:12px;font-weight:700;color:var(--slate-500);text-transform:uppercase;letter-spacing:.3px}
        .ord-detail-value{font-size:14px;font-weight:700;color:var(--slate-800);text-align:right}
        .ord-detail-divider{height:1px;background:var(--slate-100);margin:4px 0}
        .ord-detail-total{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
      `}</style>

      <div className="ord-wrap">
        <div className="ord-head">
          <div>
            <h1 className="ord-title">Pedidos</h1>
            <p className="ord-sub">Control de pedidos y su estado — datos en tiempo real de Odoo.</p>
          </div>
          <div className="ord-actions">
            <button className="btn" onClick={handleExport} disabled={!filtered.length}>Exportar</button>
            <button className="btn" onClick={fetchOrders} disabled={loading}>
              {loading ? "Cargando..." : "⟳ Actualizar"}
            </button>
          </div>
        </div>

        <div className="ord-stats">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total pedidos</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <span className="stat-pill ok">Activos</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Procesando</div>
              <div className="stat-value">{stats.processing}</div>
            </div>
            <span className="stat-pill warn">En cola</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Enviados</div>
              <div className="stat-value">{stats.shipped}</div>
            </div>
            <span className="stat-pill ok">On route</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Cancelados</div>
              <div className="stat-value">{stats.cancelled}</div>
            </div>
            <span className="stat-pill err">Atención</span>
          </div>
        </div>

        <div className="ord-filters">
          <div className="search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar pedido, cliente o vendedor" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="sel" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS.map((s) => <option key={s} value={s}>{s === "all" ? "Estado" : statusLabel(s)}</option>)}
          </select>
          <select className="sel" value={channel} onChange={(e) => setChannel(e.target.value)}>
            {CHANNELS.map((c) => <option key={c} value={c}>{c === "all" ? "Canal" : channelLabel(c)}</option>)}
          </select>
        </div>

        {errMsg && (
          <div className="ord-error">
            {errMsg}
            <br />
            <button onClick={fetchOrders}>Reintentar</button>
          </div>
        )}

        <div className="ord-table">
          <div className="ord-row head">
            <div>Orden</div>
            <div>Cliente</div>
            <div>Vendedor</div>
            <div>Total</div>
            <div>Estado</div>
            <div>Acciones</div>
          </div>

          {loading ? (
            <div className="ord-loading">
              <div className="spinner" />
              Cargando pedidos desde Odoo...
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">No hay pedidos para los filtros actuales.</div>
          ) : (
            filtered.map((row) => (
              <div key={row.rawId || row.id} className="ord-row">
                <div className="ord-main">
                  <div className="ord-ttl">{row.id}</div>
                  <div className="ord-subtxt">{fmtDate(row.updatedAt)}</div>
                </div>
                <div className="ord-main">
                  <div className="ord-ttl">{row.customer}</div>
                  <div className="ord-subtxt">{channelLabel(row.channel)}</div>
                </div>
                <div className="ord-subtxt">{row.vendor || "—"}</div>
                <div className="ord-ttl">{fmtMoney(row.total)}</div>
                <div>
                  <span className={statusClass(row.status)}>{statusLabel(row.status)}</span>
                </div>
                <div>
                  <button className="btn-xs" onClick={() => setSelected(row)}>Ver</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Order Detail Modal ──────────────────────────── */}
      {selected && (
        <div className="ord-overlay" onClick={() => setSelected(null)}>
          <div className="ord-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ord-modal-header">
              <div className="ord-modal-title">Pedido {selected.id}</div>
              <button className="ord-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="ord-modal-body">
              <div className="ord-detail-row">
                <span className="ord-detail-label">Cliente</span>
                <span className="ord-detail-value">{selected.customer}</span>
              </div>
              <div className="ord-detail-row">
                <span className="ord-detail-label">Vendedor</span>
                <span className="ord-detail-value">{selected.vendor || "—"}</span>
              </div>
              <div className="ord-detail-divider" />
              <div className="ord-detail-row">
                <span className="ord-detail-label">Estado</span>
                <span className={statusClass(selected.status)}>{statusLabel(selected.status)}</span>
              </div>
              <div className="ord-detail-row">
                <span className="ord-detail-label">Canal</span>
                <span className="ord-detail-value">{channelLabel(selected.channel)}</span>
              </div>
              <div className="ord-detail-row">
                <span className="ord-detail-label">Pagado</span>
                <span className="ord-detail-value">{selected.paid ? "Sí ✅" : "No"}</span>
              </div>
              <div className="ord-detail-row">
                <span className="ord-detail-label">Estado Odoo</span>
                <span className="ord-detail-value" style={{textTransform:"capitalize"}}>{selected.state || "—"}</span>
              </div>
              <div className="ord-detail-divider" />
              <div className="ord-detail-row">
                <span className="ord-detail-label">Fecha pedido</span>
                <span className="ord-detail-value">{fmtDate(selected.date)}</span>
              </div>
              <div className="ord-detail-row">
                <span className="ord-detail-label">Última actualización</span>
                <span className="ord-detail-value">{fmtDate(selected.updatedAt)}</span>
              </div>
              <div className="ord-detail-divider" />
              <div className="ord-detail-row">
                <span className="ord-detail-label">Total</span>
                <span className="ord-detail-total">{fmtMoney(selected.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
