import { useMemo, useRef, useState } from "react";
import { mapCsvRows, parseCsvFile } from "../../utils/csv";

const DEFAULT_PERMISSIONS = [
  { id: "PER-001", area: "Catalogos", action: "Crear/Editar", role: "Admin", scope: "Global", status: "active" },
  { id: "PER-002", area: "Productos", action: "Aprobar", role: "Admin", scope: "Global", status: "active" },
  { id: "PER-003", area: "Pagos", action: "Conciliar", role: "Super Admin", scope: "Global", status: "active" },
  { id: "PER-004", area: "Usuarios", action: "Suspender", role: "Super Admin", scope: "Global", status: "active" },
  { id: "PER-005", area: "Auditoria", action: "Ver", role: "Auditor", scope: "Solo lectura", status: "active" },
  { id: "PER-006", area: "Vendedores", action: "Aprobar", role: "Support", scope: "Regional", status: "inactive" },
];

const ROLES = ["all", "Super Admin", "Admin", "Support", "Auditor"];
const STATUS = ["all", "active", "inactive"];

const statusClass = (s) => (s === "active" ? "badge ok" : "badge muted");

export default function Permissions() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState(DEFAULT_PERMISSIONS);
  const fileRef = useRef(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const text = `${row.area} ${row.action} ${row.role} ${row.id}`.toLowerCase();
      const matchSearch = !q || text.includes(q);
      const matchRole = role === "all" || row.role === role;
      const matchStatus = status === "all" || row.status === status;
      return matchSearch && matchRole && matchStatus;
    });
  }, [search, role, status, rows]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((p) => p.status === "active").length;
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
          id: ["id", "codigo", "permiso id"],
          area: ["area", "modulo"],
          action: ["accion", "action"],
          role: ["rol", "role"],
          scope: ["scope", "alcance"],
          status: ["estado", "status"],
        },
        {
          transform: (row, index) => ({
            id: row.id || `PER-IMP-${index + 1}`,
            area: row.area || "-",
            action: row.action || "-",
            role: row.role || "-",
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
        .per-wrap{display:flex;flex-direction:column;gap:16px}
        .per-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .per-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
        .per-sub{color:var(--slate-500);font-size:13px}
        .per-actions{display:flex;gap:8px;flex-wrap:wrap}
        .btn{border:1px solid var(--slate-200);background:#fff;color:var(--slate-700);padding:9px 12px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer}
        .btn.primary{border:none;background:linear-gradient(135deg,var(--blue-600),var(--teal-500));color:#fff}

        .per-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:900px){.per-stats{grid-template-columns:1fr}}
        .stat-card{background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px;display:flex;align-items:center;justify-content:space-between}
        .stat-label{font-size:11px;text-transform:uppercase;color:var(--slate-500);font-weight:800}
        .stat-value{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--slate-900)}
        .stat-pill{padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}
        .stat-pill.ok{background:rgba(16,185,129,.12);color:#0f766e}
        .stat-pill.warn{background:rgba(148,163,184,.2);color:#475569}

        .per-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px}
        .search{display:flex;align-items:center;gap:8px;border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;background:#fff;min-width:220px}
        .search input{border:none;outline:none;background:none;font-size:13px;flex:1;color:var(--slate-700)}
        .sel{border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;font-size:13px;color:var(--slate-700);background:#fff}

        .per-table{background:#fff;border:1px solid var(--slate-200);border-radius:16px;overflow:hidden}
        .per-row{display:grid;grid-template-columns:1.1fr 1fr 0.8fr 0.7fr 0.6fr;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid var(--slate-100)}
        .per-row.head{background:var(--slate-50);font-size:11px;font-weight:800;color:var(--slate-500);text-transform:uppercase;border-top:none}
        .per-main{display:flex;flex-direction:column;gap:2px}
        .per-ttl{font-weight:800;color:var(--slate-900);font-size:13px}
        .per-subtxt{font-size:12px;color:var(--slate-500)}
        .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:800;border-radius:999px;padding:4px 8px;border:1px solid transparent}
        .badge.ok{background:rgba(34,197,94,.12);color:#15803d}
        .badge.muted{background:rgba(148,163,184,.2);color:#475569}
        .btn-xs{padding:6px 8px;border-radius:8px;border:1px solid var(--slate-200);background:#fff;font-size:11px;font-weight:800;color:var(--slate-600);cursor:pointer}
        .empty{padding:30px;text-align:center;color:var(--slate-500);font-size:13px}
      `}</style>

      <div className="per-wrap">
        <div className="per-head">
          <div>
            <h1 className="per-title">Permisos</h1>
            <p className="per-sub">Control de accesos por rol y alcance.</p>
          </div>
          <div className="per-actions">
            <button className="btn" onClick={handleImportClick}>Importar</button>
            <button className="btn primary">Nuevo permiso</button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={handleImportFile}
        />

        <div className="per-stats">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total permisos</div>
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

        <div className="per-filters">
          <div className="search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar permiso" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="sel" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r === "all" ? "Rol" : r}</option>)}
          </select>
          <select className="sel" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS.map((s) => <option key={s} value={s}>{s === "all" ? "Estado" : s}</option>)}
          </select>
        </div>

        <div className="per-table">
          <div className="per-row head">
            <div>Area</div>
            <div>Accion</div>
            <div>Rol</div>
            <div>Scope</div>
            <div>Estado</div>
          </div>
          {filtered.length === 0 ? (
            <div className="empty">No hay permisos para los filtros actuales.</div>
          ) : (
            filtered.map((row) => (
              <div key={row.id} className="per-row">
                <div className="per-main">
                  <div className="per-ttl">{row.area}</div>
                  <div className="per-subtxt">{row.id}</div>
                </div>
                <div className="per-subtxt">{row.action}</div>
                <div className="per-subtxt">{row.role}</div>
                <div className="per-subtxt">{row.scope}</div>
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
