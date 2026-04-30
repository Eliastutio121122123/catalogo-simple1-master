import { useMemo, useRef, useState } from "react";
import { mapCsvRows, parseCsvFile } from "../../utils/csv";

const DEFAULT_ROLES = [
  { id: "ROL-01", name: "Super Admin", users: 2, scope: "Full access", status: "active" },
  { id: "ROL-02", name: "Admin", users: 6, scope: "Operations", status: "active" },
  { id: "ROL-03", name: "Support", users: 4, scope: "Tickets & Email", status: "active" },
  { id: "ROL-04", name: "Auditor", users: 2, scope: "Read only", status: "active" },
  { id: "ROL-05", name: "Vendor Manager", users: 1, scope: "Vendors", status: "inactive" },
];

const STATUS = ["all", "active", "inactive"];

const statusClass = (s) => (s === "active" ? "badge ok" : "badge muted");

export default function Roles() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState(DEFAULT_ROLES);
  const fileRef = useRef(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const text = `${row.name} ${row.scope} ${row.id}`.toLowerCase();
      const matchSearch = !q || text.includes(q);
      const matchStatus = status === "all" || row.status === status;
      return matchSearch && matchStatus;
    });
  }, [search, status, rows]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.status === "active").length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [rows]);


  const handleImportClick = () => {
    if (fileRef.current) fileRef.current.click();
  };

  const normalizeStatus = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return "active";
    if (raw.startsWith("ina")) return "inactive";
    return raw;
  };

  const handleImportFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const { headers, rows: csvRows } = await parseCsvFile(file);
      if (!headers.length) throw new Error("CSV sin encabezados.");
      const items = mapCsvRows(
        headers,
        csvRows,
        {
          id: ["id", "codigo", "role id"],
          name: ["rol", "role", "nombre", "name"],
          users: ["usuarios", "users"],
          scope: ["scope", "alcance"],
          status: ["estado", "status"],
        },
        {
          transform: (row, index) => ({
            id: row.id || `ROL-IMP-${index + 1}`,
            name: row.name || "-",
            users: Number(row.users || 0),
            scope: row.scope || "-",
            status: normalizeStatus(row.status),
          }),
        },
      );
      setRows(items);
    } catch (e) {
      // noop: keep existing data on error
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <style>{`
        .rol-wrap{display:flex;flex-direction:column;gap:16px}
        .rol-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .rol-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
        .rol-sub{color:var(--slate-500);font-size:13px}
        .rol-actions{display:flex;gap:8px;flex-wrap:wrap}
        .btn{border:1px solid var(--slate-200);background:#fff;color:var(--slate-700);padding:9px 12px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer}
        .btn.primary{border:none;background:linear-gradient(135deg,var(--blue-600),var(--teal-500));color:#fff}

        .rol-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:900px){.rol-stats{grid-template-columns:1fr}}
        .stat-card{background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px;display:flex;align-items:center;justify-content:space-between}
        .stat-label{font-size:11px;text-transform:uppercase;color:var(--slate-500);font-weight:800}
        .stat-value{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--slate-900)}
        .stat-pill{padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}
        .stat-pill.ok{background:rgba(16,185,129,.12);color:#0f766e}
        .stat-pill.warn{background:rgba(148,163,184,.2);color:#475569}

        .rol-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px}
        .search{display:flex;align-items:center;gap:8px;border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;background:#fff;min-width:220px}
        .search input{border:none;outline:none;background:none;font-size:13px;flex:1;color:var(--slate-700)}
        .sel{border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;font-size:13px;color:var(--slate-700);background:#fff}

        .rol-table{background:#fff;border:1px solid var(--slate-200);border-radius:16px;overflow:hidden}
        .rol-row{display:grid;grid-template-columns:1.2fr 0.8fr 0.8fr 0.6fr 0.6fr;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid var(--slate-100)}
        .rol-row.head{background:var(--slate-50);font-size:11px;font-weight:800;color:var(--slate-500);text-transform:uppercase;border-top:none}
        .rol-main{display:flex;flex-direction:column;gap:2px}
        .rol-ttl{font-weight:800;color:var(--slate-900);font-size:13px}
        .rol-subtxt{font-size:12px;color:var(--slate-500)}
        .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:800;border-radius:999px;padding:4px 8px;border:1px solid transparent}
        .badge.ok{background:rgba(34,197,94,.12);color:#15803d}
        .badge.muted{background:rgba(148,163,184,.2);color:#475569}
        .btn-xs{padding:6px 8px;border-radius:8px;border:1px solid var(--slate-200);background:#fff;font-size:11px;font-weight:800;color:var(--slate-600);cursor:pointer}
        .empty{padding:30px;text-align:center;color:var(--slate-500);font-size:13px}
      `}</style>

      <div className="rol-wrap">
        <div className="rol-head">
          <div>
            <h1 className="rol-title">Roles</h1>
            <p className="rol-sub">Permisos y accesos del equipo admin.</p>
          </div>
          <div className="rol-actions">
            <button className="btn" onClick={handleImportClick}>Importar</button>
            <button className="btn primary">Nuevo rol</button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={handleImportFile}
        />

        <div className="rol-stats">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total roles</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <span className="stat-pill ok">Activos</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Activos</div>
              <div className="stat-value">{stats.active}</div>
            </div>
            <span className="stat-pill ok">En uso</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Inactivos</div>
              <div className="stat-value">{stats.inactive}</div>
            </div>
            <span className="stat-pill warn">Archivados</span>
          </div>
        </div>

        <div className="rol-filters">
          <div className="search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar rol o scope" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="sel" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS.map((s) => <option key={s} value={s}>{s === "all" ? "Estado" : s}</option>)}
          </select>
        </div>

        <div className="rol-table">
          <div className="rol-row head">
            <div>Rol</div>
            <div>Usuarios</div>
            <div>Scope</div>
            <div>Estado</div>
            <div>Acciones</div>
          </div>
          {filtered.length === 0 ? (
            <div className="empty">No hay roles para los filtros actuales.</div>
          ) : (
            filtered.map((row) => (
              <div key={row.id} className="rol-row">
                <div className="rol-main">
                  <div className="rol-ttl">{row.name}</div>
                  <div className="rol-subtxt">{row.id}</div>
                </div>
                <div className="rol-ttl">{row.users}</div>
                <div className="rol-subtxt">{row.scope}</div>
                <div>
                  <span className={statusClass(row.status)}>{row.status}</span>
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
