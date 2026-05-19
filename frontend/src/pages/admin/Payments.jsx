import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../../services/odoo/odooClient";
import useCurrency from "../../hooks/useCurrency";
import { formatMoney } from "../../utils/formatCurrency";

const STATUS = ["all", "approved", "pending", "review", "chargeback"];
const METHODS = ["all", "Card", "Transfer", "Cash", "Paypal", "Manual"];

const statusLabel = (s) => {
  if (s === "approved") return "Aprobado";
  if (s === "pending") return "Pendiente";
  if (s === "review") return "En revisión";
  if (s === "chargeback") return "Contracargo";
  return s || "—";
};

const statusClass = (s) => {
  if (s === "approved") return "badge ok";
  if (s === "pending") return "badge warn";
  if (s === "review") return "badge muted";
  if (s === "chargeback") return "badge err";
  return "badge muted";
};

const fmtMoney = (n, currency, byCode, base) =>
  formatMoney(Number(n || 0), currency || base || "DOP", { maximumFractionDigits: 2, byCode });

const fmtDate = (raw) => {
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    return d.toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(raw).slice(0, 16);
  }
};

export default function Payments() {
  const { byCode, base } = useCurrency();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");

  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, chargeback: 0, review: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (status !== "all") params.set("status", status);
      if (method !== "all") params.set("method", method);
      params.set("limit", "500");

      const data = await api.get(`/api/admin/payments?${params.toString()}`);
      setPayments(data.items || []);
      setStats(data.stats || { total: 0, approved: 0, pending: 0, chargeback: 0, review: 0 });
    } catch (err) {
      setError(err.message || "Error al cargar los pagos.");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, method]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchPayments(), 300);
    return () => clearTimeout(debounce);
  }, [fetchPayments]);

  /* Client-side filtering (the API already filters, but we re-filter for instant UX) */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((row) => {
      const text = `${row.id} ${row.order} ${row.customer} ${row.provider}`.toLowerCase();
      const matchSearch = !q || text.includes(q);
      const matchStatus = status === "all" || row.status === status;
      const matchMethod = method === "all" || row.method === method;
      return matchSearch && matchStatus && matchMethod;
    });
  }, [search, status, method, payments]);

  return (
    <>
      <style>{`
        .pay-wrap{display:flex;flex-direction:column;gap:16px}
        .pay-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .pay-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
        .pay-sub{color:var(--slate-500);font-size:13px}
        .pay-actions{display:flex;gap:8px;flex-wrap:wrap}
        .btn{border:1px solid var(--slate-200);background:#fff;color:var(--slate-700);padding:9px 12px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer;transition:all .2s}
        .btn:hover{border-color:var(--blue-400,#60a5fa);color:var(--blue-600,#2563eb)}
        .btn.primary{border:none;background:linear-gradient(135deg,var(--blue-600),var(--teal-500));color:#fff}
        .btn.primary:hover{opacity:.9;transform:translateY(-1px)}

        .pay-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        @media(max-width:1100px){.pay-stats{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.pay-stats{grid-template-columns:1fr}}
        .stat-card{background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px;display:flex;align-items:center;justify-content:space-between;transition:box-shadow .2s}
        .stat-card:hover{box-shadow:0 2px 12px rgba(0,0,0,.06)}
        .stat-label{font-size:11px;text-transform:uppercase;color:var(--slate-500);font-weight:800}
        .stat-value{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--slate-900)}
        .stat-pill{padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}
        .stat-pill.ok{background:rgba(16,185,129,.12);color:#0f766e}
        .stat-pill.warn{background:rgba(245,158,11,.12);color:#b45309}
        .stat-pill.err{background:rgba(239,68,68,.12);color:#b91c1c}
        .stat-pill.muted{background:rgba(148,163,184,.2);color:#475569}

        .pay-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px}
        .search{display:flex;align-items:center;gap:8px;border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;background:#fff;min-width:220px;transition:border-color .2s}
        .search:focus-within{border-color:var(--blue-400,#60a5fa)}
        .search input{border:none;outline:none;background:none;font-size:13px;flex:1;color:var(--slate-700)}
        .sel{border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;font-size:13px;color:var(--slate-700);background:#fff;cursor:pointer}

        .pay-table{background:#fff;border:1px solid var(--slate-200);border-radius:16px;overflow:hidden}
        .pay-row{display:grid;grid-template-columns:0.8fr 0.8fr 1fr 0.7fr 0.7fr 0.6fr;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid var(--slate-100);transition:background .15s}
        .pay-row:hover:not(.head){background:var(--slate-50,#f8fafc)}
        .pay-row.head{background:var(--slate-50);font-size:11px;font-weight:800;color:var(--slate-500);text-transform:uppercase;border-top:none}
        .pay-main{display:flex;flex-direction:column;gap:2px}
        .pay-ttl{font-weight:800;color:var(--slate-900);font-size:13px}
        .pay-subtxt{font-size:12px;color:var(--slate-500)}
        .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:800;border-radius:999px;padding:4px 8px;border:1px solid transparent}
        .badge.ok{background:rgba(34,197,94,.12);color:#15803d}
        .badge.warn{background:rgba(245,158,11,.12);color:#b45309}
        .badge.muted{background:rgba(148,163,184,.2);color:#475569}
        .badge.err{background:rgba(239,68,68,.12);color:#b91c1c}
        .btn-xs{padding:6px 8px;border-radius:8px;border:1px solid var(--slate-200);background:#fff;font-size:11px;font-weight:800;color:var(--slate-600);cursor:pointer;transition:all .15s}
        .btn-xs:hover{border-color:var(--blue-400,#60a5fa);color:var(--blue-600,#2563eb)}
        .empty{padding:30px;text-align:center;color:var(--slate-500);font-size:13px}

        .pay-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:40px;color:var(--slate-500);font-size:14px}
        .pay-loading .spinner{width:20px;height:20px;border:3px solid var(--slate-200);border-top-color:var(--blue-600,#2563eb);border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .pay-error{padding:24px;text-align:center;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:14px;color:#b91c1c;font-size:13px;font-weight:600}
        .pay-error button{margin-top:10px;padding:8px 16px;border:1px solid rgba(239,68,68,.3);border-radius:10px;background:#fff;color:#b91c1c;font-weight:800;font-size:12px;cursor:pointer}
      `}</style>

      <div className="pay-wrap">
        <div className="pay-head">
          <div>
            <h1 className="pay-title">Pagos</h1>
            <p className="pay-sub">Reportes de pagos y conciliaciones — datos en tiempo real de Odoo.</p>
          </div>
          <div className="pay-actions">
            <button className="btn" onClick={fetchPayments} disabled={loading}>
              {loading ? "Cargando..." : "⟳ Actualizar"}
            </button>
          </div>
        </div>

        <div className="pay-stats">
          <div className="stat-card">
            <div>
              <div className="stat-label">Pagos totales</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <span className="stat-pill muted">Total</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Aprobados</div>
              <div className="stat-value">{stats.approved}</div>
            </div>
            <span className="stat-pill ok">Ingresos</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Pendientes</div>
              <div className="stat-value">{stats.pending}</div>
            </div>
            <span className="stat-pill warn">En cola</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Contracargos</div>
              <div className="stat-value">{stats.chargeback}</div>
            </div>
            <span className="stat-pill err">Revisar</span>
          </div>
        </div>

        <div className="pay-filters">
          <div className="search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar pago, orden o cliente" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="sel" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS.map((s) => <option key={s} value={s}>{s === "all" ? "Estado" : statusLabel(s)}</option>)}
          </select>
          <select className="sel" value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => <option key={m} value={m}>{m === "all" ? "Método" : m}</option>)}
          </select>
        </div>

        {error && (
          <div className="pay-error">
            {error}
            <br />
            <button onClick={fetchPayments}>Reintentar</button>
          </div>
        )}

        <div className="pay-table">
          <div className="pay-row head">
            <div>Pago</div>
            <div>Orden</div>
            <div>Cliente</div>
            <div>Monto</div>
            <div>Estado</div>
            <div>Fecha</div>
          </div>

          {loading ? (
            <div className="pay-loading">
              <div className="spinner" />
              Cargando pagos desde Odoo...
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">No hay pagos para los filtros actuales.</div>
          ) : (
            filtered.map((row) => (
              <div key={row.rawId || row.id} className="pay-row">
                <div className="pay-main">
                  <div className="pay-ttl">{row.id}</div>
                  <div className="pay-subtxt">{row.provider}{row.cardLast4 ? ` ···· ${row.cardLast4}` : ""}</div>
                </div>
                <div className="pay-subtxt">{row.order || "—"}</div>
                <div className="pay-subtxt">{row.customer || "—"}</div>
                <div className="pay-ttl">{fmtMoney(row.amount, row.currency, byCode, base)}</div>
                <div>
                  <span className={statusClass(row.status)}>{statusLabel(row.status)}</span>
                </div>
                <div className="pay-subtxt">{fmtDate(row.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
