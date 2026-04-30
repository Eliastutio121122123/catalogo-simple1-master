import { useMemo, useState } from "react";

const CURRENCIES = [
  { code: "USD", name: "Dolar estadounidense", symbol: "$", rate: 1, status: "active", updatedAt: "2026-03-12T08:05:00" },
  { code: "DOP", name: "Peso dominicano", symbol: "RD$", rate: 59.12, status: "active", updatedAt: "2026-03-12T08:05:00" },
  { code: "EUR", name: "Euro", symbol: "€", rate: 0.92, status: "active", updatedAt: "2026-03-11T10:12:00" },
  { code: "GBP", name: "Libra esterlina", symbol: "£", rate: 0.79, status: "active", updatedAt: "2026-03-11T10:12:00" },
  { code: "MXN", name: "Peso mexicano", symbol: "$", rate: 16.8, status: "inactive", updatedAt: "2026-03-09T09:20:00" },
  { code: "BRL", name: "Real brasileño", symbol: "R$", rate: 5.1, status: "inactive", updatedAt: "2026-03-08T14:44:00" },
];

const STATUSES = ["all", "active", "inactive"];

export default function Currencies() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [base, setBase] = useState("USD");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CURRENCIES.filter((row) => {
      const text = `${row.code} ${row.name}`.toLowerCase();
      const matchSearch = !q || text.includes(q);
      const matchStatus = status === "all" || row.status === status;
      return matchSearch && matchStatus;
    });
  }, [search, status]);

  const stats = useMemo(() => {
    const total = CURRENCIES.length;
    const active = CURRENCIES.filter((c) => c.status === "active").length;
    const inactive = total - active;
    return { total, active, inactive };
  }, []);

  return (
    <>
      <style>{`
        .cur-wrap{display:flex;flex-direction:column;gap:16px}
        .cur-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .cur-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
        .cur-sub{color:var(--slate-500);font-size:13px}
        .cur-actions{display:flex;gap:8px;flex-wrap:wrap}
        .btn{border:1px solid var(--slate-200);background:#fff;color:var(--slate-700);padding:9px 12px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer}
        .btn.primary{border:none;background:linear-gradient(135deg,var(--blue-600),var(--teal-500));color:#fff}

        .cur-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:900px){.cur-stats{grid-template-columns:1fr}}
        .stat-card{background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px;display:flex;align-items:center;justify-content:space-between}
        .stat-label{font-size:11px;text-transform:uppercase;color:var(--slate-500);font-weight:800}
        .stat-value{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--slate-900)}
        .stat-pill{padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}
        .stat-pill.ok{background:rgba(16,185,129,.12);color:#0f766e}
        .stat-pill.warn{background:rgba(148,163,184,.2);color:#475569}

        .cur-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px}
        .search{display:flex;align-items:center;gap:8px;border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;background:#fff;min-width:220px}
        .search input{border:none;outline:none;background:none;font-size:13px;flex:1;color:var(--slate-700)}
        .sel{border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;font-size:13px;color:var(--slate-700);background:#fff}
        .cur-table{background:#fff;border:1px solid var(--slate-200);border-radius:16px;overflow:hidden}
        .cur-row{display:grid;grid-template-columns:0.7fr 1.4fr 0.8fr 0.8fr 0.7fr 0.6fr;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid var(--slate-100)}
        .cur-row.head{background:var(--slate-50);font-size:11px;font-weight:800;color:var(--slate-500);text-transform:uppercase;border-top:none}
        .cur-main{display:flex;flex-direction:column;gap:2px}
        .cur-ttl{font-weight:800;color:var(--slate-900);font-size:13px}
        .cur-subtxt{font-size:12px;color:var(--slate-500)}
        .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:800;border-radius:999px;padding:4px 8px;border:1px solid transparent}
        .badge.ok{background:rgba(34,197,94,.12);color:#15803d}
        .badge.muted{background:rgba(148,163,184,.2);color:#475569}
        .btn-xs{padding:6px 8px;border-radius:8px;border:1px solid var(--slate-200);background:#fff;font-size:11px;font-weight:800;color:var(--slate-600);cursor:pointer}
        .empty{padding:30px;text-align:center;color:var(--slate-500);font-size:13px}
      `}</style>

      <div className="cur-wrap">
        <div className="cur-head">
          <div>
            <h1 className="cur-title">Monedas</h1>
            <p className="cur-sub">Gestion de monedas, tasa de cambio y moneda base.</p>
          </div>
          <div className="cur-actions">
            <button className="btn">Actualizar tasas</button>
            <button className="btn primary">Agregar moneda</button>
          </div>
        </div>

        <div className="cur-stats">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total monedas</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <span className="stat-pill ok">Disponible</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Activas</div>
              <div className="stat-value">{stats.active}</div>
            </div>
            <span className="stat-pill ok">Operativas</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Inactivas</div>
              <div className="stat-value">{stats.inactive}</div>
            </div>
            <span className="stat-pill warn">Deshabilitadas</span>
          </div>
        </div>

        <div className="cur-filters">
          <div className="search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar moneda" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="sel" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "Estado" : s}</option>)}
          </select>
          <select className="sel" value={base} onChange={(e) => setBase(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>Base: {c.code}</option>)}
          </select>
        </div>

        <div className="cur-table">
          <div className="cur-row head">
            <div>Codigo</div>
            <div>Moneda</div>
            <div>Simbolo</div>
            <div>Tasa</div>
            <div>Estado</div>
            <div>Acciones</div>
          </div>
          {filtered.length === 0 ? (
            <div className="empty">No hay monedas para los filtros actuales.</div>
          ) : (
            filtered.map((row) => (
              <div key={row.code} className="cur-row">
                <div className="cur-ttl">{row.code}</div>
                <div className="cur-main">
                  <div className="cur-ttl">{row.name}</div>
                  <div className="cur-subtxt">Actualizado {new Date(row.updatedAt).toLocaleDateString("es-DO")}</div>
                </div>
                <div className="cur-ttl">{row.symbol}</div>
                <div className="cur-ttl">{row.rate}</div>
                <div>
                  <span className={`badge ${row.status === "active" ? "ok" : "muted"}`}>{row.status === "active" ? "Activa" : "Inactiva"}</span>
                </div>
                <div>
                  <button className="btn-xs">Editar</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
