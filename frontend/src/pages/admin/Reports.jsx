import { useEffect, useMemo, useState } from "react";
import adminReportService from "../../services/odoo/adminReportService";

const STATUS = ["all", "ready", "processing", "failed"];

const statusClass = (s) => {
  if (s === "ready") return "badge ok";
  if (s === "processing") return "badge warn";
  if (s === "failed") return "badge err";
  return "badge muted";
};

export default function Reports() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await adminReportService.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      setError(e?.message || "No se pudieron cargar los reportes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const TYPES = useMemo(() => {
    const set = new Set(["all"]);
    (rows || []).forEach((r) => r?.type && set.add(r.type));
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows || []).filter((row) => {
      const text = `${row.id} ${row.title} ${row.owner}`.toLowerCase();
      const matchSearch = !q || text.includes(q);
      const matchType = type === "all" || row.type === type;
      const matchStatus = status === "all" || row.status === status;
      return matchSearch && matchType && matchStatus;
    });
  }, [rows, search, type, status]);

  const stats = useMemo(() => {
    const total = (rows || []).length;
    const ready = (rows || []).filter((r) => r.status === "ready").length;
    const failed = (rows || []).filter((r) => r.status === "failed").length;
    return { total, ready, failed };
  }, [rows]);

  return (
    <>
      <style>{`
        .rep-wrap{display:flex;flex-direction:column;gap:16px}
        .rep-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .rep-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
        .rep-sub{color:var(--slate-500);font-size:13px}
        .rep-actions{display:flex;gap:8px;flex-wrap:wrap}
        .btn{border:1px solid var(--slate-200);background:#fff;color:var(--slate-700);padding:9px 12px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer}
        .btn.primary{border:none;background:linear-gradient(135deg,var(--blue-600),var(--teal-500));color:#fff}
        .btn:disabled{opacity:.6;cursor:not-allowed}

        .rep-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:900px){.rep-stats{grid-template-columns:1fr}}
        .stat-card{background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px;display:flex;align-items:center;justify-content:space-between}
        .stat-label{font-size:11px;text-transform:uppercase;color:var(--slate-500);font-weight:800}
        .stat-value{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--slate-900)}
        .stat-pill{padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}
        .stat-pill.ok{background:rgba(16,185,129,.12);color:#0f766e}
        .stat-pill.warn{background:rgba(239,68,68,.12);color:#b91c1c}

        .rep-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px}
        .search{display:flex;align-items:center;gap:8px;border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;background:#fff;min-width:220px}
        .search input{border:none;outline:none;background:none;font-size:13px;flex:1;color:var(--slate-700)}
        .sel{border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;font-size:13px;color:var(--slate-700);background:#fff}

        .rep-table{background:#fff;border:1px solid var(--slate-200);border-radius:16px;overflow:hidden}
        .rep-row{display:grid;grid-template-columns:1.2fr 0.8fr 0.8fr 0.8fr 0.6fr;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid var(--slate-100)}
        .rep-row.head{background:var(--slate-50);font-size:11px;font-weight:800;color:var(--slate-500);text-transform:uppercase;border-top:none}
        .rep-main{display:flex;flex-direction:column;gap:2px}
        .rep-ttl{font-weight:800;color:var(--slate-900);font-size:13px}
        .rep-subtxt{font-size:12px;color:var(--slate-500)}
        .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:800;border-radius:999px;padding:4px 8px;border:1px solid transparent}
        .badge.ok{background:rgba(34,197,94,.12);color:#15803d}
        .badge.warn{background:rgba(245,158,11,.12);color:#b45309}
        .badge.err{background:rgba(239,68,68,.12);color:#b91c1c}
        .badge.muted{background:rgba(148,163,184,.2);color:#475569}
        .empty{padding:30px;text-align:center;color:var(--slate-500);font-size:13px}
      `}</style>

      <div className="rep-wrap">
        <div className="rep-head">
          <div>
            <h1 className="rep-title">Reportes</h1>
            <p className="rep-sub">Panel de reportes y KPI del negocio.</p>
          </div>
          <div className="rep-actions">
            <button className="btn" onClick={load} disabled={isLoading}>
              {isLoading ? "Cargando..." : "Actualizar"}
            </button>
            <button className="btn" disabled>Programar</button>
          </div>
        </div>

        <div className="rep-stats">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total reportes</div>
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

        <div className="rep-filters">
          <div className="search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar reporte" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="sel" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t === "all" ? "Tipo" : t}</option>)}
          </select>
          <select className="sel" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS.map((s) => <option key={s} value={s}>{s === "all" ? "Estado" : s}</option>)}
          </select>
        </div>

        <div className="rep-table">
          <div className="rep-row head">
            <div>Reporte</div>
            <div>Tipo</div>
            <div>Owner</div>
            <div>Actualizado</div>
            <div>Estado</div>
          </div>
          {isLoading ? (
            <div className="empty">Cargando reportes...</div>
          ) : error ? (
            <div className="empty">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No hay reportes para los filtros actuales.</div>
          ) : (
            filtered.map((row) => (
              <div key={row.id} className="rep-row">
                <div className="rep-main">
                  <div className="rep-ttl">{row.title}</div>
                  <div className="rep-subtxt">{row.id}</div>
                </div>
                <div className="rep-subtxt">{row.type}</div>
                <div className="rep-subtxt">{row.owner}</div>
                <div className="rep-subtxt">{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString("es-DO") : "-"}</div>
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

