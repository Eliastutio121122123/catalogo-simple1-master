import { useMemo, useState } from "react";

const EXPORTS = [
  { id: "EXP-3021", type: "Ventas", format: "CSV", range: "Ultimos 7 dias", createdBy: "Gabriel Alcala", status: "ready", createdAt: "2026-03-12T09:05:00" },
  { id: "EXP-3020", type: "Usuarios", format: "XLSX", range: "Ultimos 30 dias", createdBy: "Maria Perez", status: "processing", createdAt: "2026-03-12T08:50:00" },
  { id: "EXP-3019", type: "Pagos", format: "CSV", range: "Febrero 2026", createdBy: "Luis Brea", status: "failed", createdAt: "2026-03-12T08:10:00" },
  { id: "EXP-3018", type: "Catalogos", format: "XLSX", range: "Ultimos 7 dias", createdBy: "Paula Gomez", status: "ready", createdAt: "2026-03-11T18:20:00" },
];

const TYPES = ["all", "Ventas", "Usuarios", "Pagos", "Catalogos"];
const STATUS = ["all", "ready", "processing", "failed"];

const statusClass = (s) => {
  if (s === "ready") return "badge ok";
  if (s === "processing") return "badge warn";
  if (s === "failed") return "badge err";
  return "badge muted";
};

export default function Exports() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return EXPORTS.filter((row) => {
      const text = `${row.id} ${row.type} ${row.createdBy}`.toLowerCase();
      const matchSearch = !q || text.includes(q);
      const matchType = type === "all" || row.type === type;
      const matchStatus = status === "all" || row.status === status;
      return matchSearch && matchType && matchStatus;
    });
  }, [search, type, status]);

  const stats = useMemo(() => {
    const total = EXPORTS.length;
    const ready = EXPORTS.filter((e) => e.status === "ready").length;
    const failed = EXPORTS.filter((e) => e.status === "failed").length;
    return { total, ready, failed };
  }, []);

  return (
    <>
      <style>{`
        .ex-wrap{display:flex;flex-direction:column;gap:16px}
        .ex-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .ex-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
        .ex-sub{color:var(--slate-500);font-size:13px}
        .ex-actions{display:flex;gap:8px;flex-wrap:wrap}
        .btn{border:1px solid var(--slate-200);background:#fff;color:var(--slate-700);padding:9px 12px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer}
        .btn.primary{border:none;background:linear-gradient(135deg,var(--blue-600),var(--teal-500));color:#fff}

        .ex-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:900px){.ex-stats{grid-template-columns:1fr}}
        .stat-card{background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px;display:flex;align-items:center;justify-content:space-between}
        .stat-label{font-size:11px;text-transform:uppercase;color:var(--slate-500);font-weight:800}
        .stat-value{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--slate-900)}
        .stat-pill{padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}
        .stat-pill.ok{background:rgba(16,185,129,.12);color:#0f766e}
        .stat-pill.warn{background:rgba(239,68,68,.12);color:#b91c1c}

        .ex-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px}
        .search{display:flex;align-items:center;gap:8px;border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;background:#fff;min-width:220px}
        .search input{border:none;outline:none;background:none;font-size:13px;flex:1;color:var(--slate-700)}
        .sel{border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;font-size:13px;color:var(--slate-700);background:#fff}

        .ex-table{background:#fff;border:1px solid var(--slate-200);border-radius:16px;overflow:hidden}
        .ex-row{display:grid;grid-template-columns:0.8fr 0.9fr 0.6fr 0.9fr 0.9fr 0.6fr;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid var(--slate-100)}
        .ex-row.head{background:var(--slate-50);font-size:11px;font-weight:800;color:var(--slate-500);text-transform:uppercase;border-top:none}
        .ex-main{display:flex;flex-direction:column;gap:2px}
        .ex-ttl{font-weight:800;color:var(--slate-900);font-size:13px}
        .ex-subtxt{font-size:12px;color:var(--slate-500)}
        .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:800;border-radius:999px;padding:4px 8px;border:1px solid transparent}
        .badge.ok{background:rgba(34,197,94,.12);color:#15803d}
        .badge.warn{background:rgba(245,158,11,.12);color:#b45309}
        .badge.err{background:rgba(239,68,68,.12);color:#b91c1c}
        .badge.muted{background:rgba(148,163,184,.2);color:#475569}
        .btn-xs{padding:6px 8px;border-radius:8px;border:1px solid var(--slate-200);background:#fff;font-size:11px;font-weight:800;color:var(--slate-600);cursor:pointer}
        .empty{padding:30px;text-align:center;color:var(--slate-500);font-size:13px}
      `}</style>

      <div className="ex-wrap">
        <div className="ex-head">
          <div>
            <h1 className="ex-title">Exports</h1>
            <p className="ex-sub">Generacion y descarga de reportes.</p>
          </div>
          <div className="ex-actions">
            <button className="btn">Programar</button>
            <button className="btn primary">Nuevo export</button>
          </div>
        </div>

        <div className="ex-stats">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total exports</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <span className="stat-pill ok">Listos</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Completados</div>
              <div className="stat-value">{stats.ready}</div>
            </div>
            <span className="stat-pill ok">Disponibles</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Fallidos</div>
              <div className="stat-value">{stats.failed}</div>
            </div>
            <span className="stat-pill warn">Revisar</span>
          </div>
        </div>

        <div className="ex-filters">
          <div className="search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar export" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="sel" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t === "all" ? "Tipo" : t}</option>)}
          </select>
          <select className="sel" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS.map((s) => <option key={s} value={s}>{s === "all" ? "Estado" : s}</option>)}
          </select>
        </div>

        <div className="ex-table">
          <div className="ex-row head">
            <div>ID</div>
            <div>Tipo</div>
            <div>Formato</div>
            <div>Rango</div>
            <div>Creado por</div>
            <div>Estado</div>
          </div>
          {filtered.length === 0 ? (
            <div className="empty">No hay exports con estos filtros.</div>
          ) : (
            filtered.map((row) => (
              <div key={row.id} className="ex-row">
                <div className="ex-ttl">{row.id}</div>
                <div className="ex-main">
                  <div className="ex-ttl">{row.type}</div>
                  <div className="ex-subtxt">{new Date(row.createdAt).toLocaleDateString("es-DO")}</div>
                </div>
                <div className="ex-ttl">{row.format}</div>
                <div className="ex-subtxt">{row.range}</div>
                <div className="ex-subtxt">{row.createdBy}</div>
                <div>
                  <span className={statusClass(row.status)}>{row.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
