import { useMemo, useState } from "react";

const EMAILS = [
  {
    id: "EM-2201",
    to: "carla.m@correo.com",
    subject: "Confirmacion de pedido SO-20441",
    template: "order_confirmation",
    status: "delivered",
    provider: "SendGrid",
    at: "2026-03-12T09:10:22",
  },
  {
    id: "EM-2200",
    to: "luis.a@correo.com",
    subject: "Recibo de pago PAY-9342",
    template: "payment_receipt",
    status: "bounced",
    provider: "SendGrid",
    at: "2026-03-12T08:55:10",
  },
  {
    id: "EM-2199",
    to: "nova@vendor.com",
    subject: "Tu catalogo fue aprobado",
    template: "catalog_approved",
    status: "delivered",
    provider: "SendGrid",
    at: "2026-03-12T08:40:41",
  },
  {
    id: "EM-2198",
    to: "support@catalogix.com",
    subject: "Alerta de inventario bajo",
    template: "low_stock",
    status: "queued",
    provider: "SES",
    at: "2026-03-12T08:22:02",
  },
  {
    id: "EM-2197",
    to: "isabel.t@correo.com",
    subject: "Restablecer contrasena",
    template: "password_reset",
    status: "delivered",
    provider: "SES",
    at: "2026-03-12T08:11:46",
  },
  {
    id: "EM-2196",
    to: "ventas@glowlab.com",
    subject: "Reporte semanal de ventas",
    template: "weekly_report",
    status: "failed",
    provider: "SendGrid",
    at: "2026-03-12T07:52:11",
  },
];

const STATUS = ["all", "delivered", "queued", "failed", "bounced"];
const PROVIDERS = ["all", "SendGrid", "SES"];

const statusClass = (s) => {
  if (s === "delivered") return "badge ok";
  if (s === "queued") return "badge warn";
  if (s === "failed") return "badge err";
  return "badge muted";
};

export default function EmailLogs() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [provider, setProvider] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return EMAILS.filter((row) => {
      const text = `${row.to} ${row.subject} ${row.template} ${row.id}`.toLowerCase();
      const matchSearch = !q || text.includes(q);
      const matchStatus = status === "all" || row.status === status;
      const matchProvider = provider === "all" || row.provider === provider;
      return matchSearch && matchStatus && matchProvider;
    });
  }, [search, status, provider]);

  const stats = useMemo(() => {
    const total = EMAILS.length;
    const delivered = EMAILS.filter((e) => e.status === "delivered").length;
    const failed = EMAILS.filter((e) => e.status === "failed" || e.status === "bounced").length;
    return { total, delivered, failed };
  }, []);

  return (
    <>
      <style>{`
        .em-wrap{display:flex;flex-direction:column;gap:16px}
        .em-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .em-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
        .em-sub{color:var(--slate-500);font-size:13px}
        .em-actions{display:flex;gap:8px;flex-wrap:wrap}
        .btn{border:1px solid var(--slate-200);background:#fff;color:var(--slate-700);padding:9px 12px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer}
        .btn.primary{border:none;background:linear-gradient(135deg,var(--blue-600),var(--teal-500));color:#fff}

        .em-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:900px){.em-stats{grid-template-columns:1fr}}
        .stat-card{background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px;display:flex;align-items:center;justify-content:space-between}
        .stat-label{font-size:11px;text-transform:uppercase;color:var(--slate-500);font-weight:800}
        .stat-value{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--slate-900)}
        .stat-pill{padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}
        .stat-pill.ok{background:rgba(16,185,129,.12);color:#0f766e}
        .stat-pill.warn{background:rgba(239,68,68,.12);color:#b91c1c}

        .em-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px}
        .search{display:flex;align-items:center;gap:8px;border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;background:#fff;min-width:220px}
        .search input{border:none;outline:none;background:none;font-size:13px;flex:1;color:var(--slate-700)}
        .sel{border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;font-size:13px;color:var(--slate-700);background:#fff}

        .em-table{background:#fff;border:1px solid var(--slate-200);border-radius:16px;overflow:hidden}
        .em-row{display:grid;grid-template-columns:0.8fr 1.5fr 0.9fr 0.6fr 0.7fr 0.6fr;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid var(--slate-100)}
        .em-row.head{background:var(--slate-50);font-size:11px;font-weight:800;color:var(--slate-500);text-transform:uppercase;border-top:none}
        .em-main{display:flex;flex-direction:column;gap:2px}
        .em-ttl{font-weight:800;color:var(--slate-900);font-size:13px}
        .em-subtxt{font-size:12px;color:var(--slate-500)}
        .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:800;border-radius:999px;padding:4px 8px;border:1px solid transparent}
        .badge.ok{background:rgba(34,197,94,.12);color:#15803d}
        .badge.warn{background:rgba(245,158,11,.12);color:#b45309}
        .badge.err{background:rgba(239,68,68,.12);color:#b91c1c}
        .badge.muted{background:rgba(148,163,184,.2);color:#475569}
        .btn-xs{padding:6px 8px;border-radius:8px;border:1px solid var(--slate-200);background:#fff;font-size:11px;font-weight:800;color:var(--slate-600);cursor:pointer}
        .empty{padding:30px;text-align:center;color:var(--slate-500);font-size:13px}
      `}</style>

      <div className="em-wrap">
        <div className="em-head">
          <div>
            <h1 className="em-title">Email logs</h1>
            <p className="em-sub">Registro de envios, estado y proveedor.</p>
          </div>
          <div className="em-actions">
            <button className="btn">Reintentar fallidos</button>
            <button className="btn primary">Configurar SMTP</button>
          </div>
        </div>

        <div className="em-stats">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total enviados</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <span className="stat-pill ok">OK</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Entregados</div>
              <div className="stat-value">{stats.delivered}</div>
            </div>
            <span className="stat-pill ok">Exitosos</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Fallidos</div>
              <div className="stat-value">{stats.failed}</div>
            </div>
            <span className="stat-pill warn">Revisar</span>
          </div>
        </div>

        <div className="em-filters">
          <div className="search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar por destinatario o asunto" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="sel" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS.map((s) => <option key={s} value={s}>{s === "all" ? "Estado" : s}</option>)}
          </select>
          <select className="sel" value={provider} onChange={(e) => setProvider(e.target.value)}>
            {PROVIDERS.map((p) => <option key={p} value={p}>{p === "all" ? "Proveedor" : p}</option>)}
          </select>
        </div>

        <div className="em-table">
          <div className="em-row head">
            <div>ID</div>
            <div>Email</div>
            <div>Plantilla</div>
            <div>Estado</div>
            <div>Proveedor</div>
            <div>Acciones</div>
          </div>
          {filtered.length === 0 ? (
            <div className="empty">No hay registros para los filtros actuales.</div>
          ) : (
            filtered.map((row) => (
              <div key={row.id} className="em-row">
                <div className="em-ttl">{row.id}</div>
                <div className="em-main">
                  <div className="em-ttl">{row.to}</div>
                  <div className="em-subtxt">{row.subject}</div>
                </div>
                <div className="em-subtxt">{row.template}</div>
                <div>
                  <span className={statusClass(row.status)}>{row.status}</span>
                </div>
                <div className="em-subtxt">{row.provider}</div>
                <div>
                  <button className="btn-xs">Ver</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
