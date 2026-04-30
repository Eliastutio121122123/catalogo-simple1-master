import { Component } from "react";
import adminUsersService from "../../services/odoo/adminUsersService";
import { mapCsvRows, parseCsvFile } from "../../utils/csv";
import { downloadBrandedExcel } from "../../utils/brandedExcel";

export default class Users extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      role: "all",
      status: "all",
      rows: [],
      stats: { total: 0, active: 0, suspended: 0 },
      roles: ["all"],
      statuses: ["all"],
      loading: true,
      error: "",
    };
  }

  componentDidMount() {
    this.load();
  }

  async load() {
    this.setState({ loading: true, error: "" });
    try {
      const payload = await adminUsersService.list({
        q: this.state.search,
        role: this.state.role,
        status: this.state.status,
      });
      const rows = Array.isArray(payload?.items) ? payload.items : [];
      const stats = payload?.stats || this.buildStats(rows);
      const roles = this.buildOptions("all", payload?.filters?.roles, rows.map((r) => r.role));
      const statuses = this.buildOptions("all", payload?.filters?.statuses, rows.map((r) => r.status));
      this.setState({ rows, stats, roles, statuses });
    } catch (e) {
      this.setState({ error: e?.message || "No se pudo cargar usuarios." });
    } finally {
      this.setState({ loading: false });
    }
  }

  updateField(field, value) {
    this.setState({ [field]: value }, () => this.load());
  }

  buildStats(rows) {
    const total = rows.length;
    const active = rows.filter((u) => u.status === "active").length;
    const suspended = rows.filter((u) => u.status !== "active").length;
    return { total, active, suspended };
  }

  buildOptions(label, fromFilters, fromRows) {
    const values = new Set();
    (fromFilters || []).forEach((v) => v && values.add(v));
    (fromRows || []).forEach((v) => v && values.add(v));
    return [label, ...Array.from(values).sort()];
  }

  statusClass(status) {
    if (status === "active") return "badge ok";
    if (status === "inactive") return "badge muted";
    if (status === "suspended") return "badge err";
    return "badge muted";
  }

  statusLabel(status) {
    if (status === "active") return "Activo";
    if (status === "suspended") return "Suspendido";
    if (status === "inactive") return "Inactivo";
    return status;
  }

  fmtDate(value) {
    if (!value) return "-";
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("es-DO");
  }

  handleExport = () => {
    const rows = Array.isArray(this.state.rows) ? this.state.rows : [];
    if (!rows.length) {
      this.setState({ error: "No hay usuarios para exportar." });
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    downloadBrandedExcel({
      filename: `usuarios_${date}.xls`,
      sheetName: "Usuarios",
      reportTitle: "Reporte de Usuarios",
      columns: [
        { key: "id", label: "ID" },
        { key: "name", label: "Nombre" },
        { key: "email", label: "Email" },
        { key: "role", label: "Rol" },
        { key: "status", label: "Estado", format: (_, row) => this.statusLabel(row.status) },
        { key: "lastSeen", label: "Ultimo acceso", format: (_, row) => this.fmtDate(row.lastSeen) },
      ],
      rows,
    });
  };

  handleImportClick = () => {
    if (this.importInput) this.importInput.click();
  };

  normalizeStatus(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return "active";
    if (raw.startsWith("sus")) return "suspended";
    if (raw.startsWith("ina")) return "suspended";
    if (raw.startsWith("act")) return "active";
    return raw;
  }

  async handleImportFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const { headers, rows } = await parseCsvFile(file);
      if (!headers.length) throw new Error("CSV sin encabezados.");
      const items = mapCsvRows(
        headers,
        rows,
        {
          id: ["id", "codigo", "user id"],
          name: ["nombre", "name", "usuario"],
          email: ["email", "correo"],
          role: ["rol", "role"],
          status: ["estado", "status"],
          lastSeen: ["ultimo acceso", "ultima vez", "last seen", "lastseen"],
        },
        {
          transform: (row, index) => {
            const nextId = row.id && row.id.trim() ? row.id.trim() : `IMP-${Date.now()}-${index + 1}`;
            return {
              id: nextId,
              name: row.name || "-",
              email: row.email || "-",
              role: row.role || "User",
              status: this.normalizeStatus(row.status),
              lastSeen: row.lastSeen || "",
            };
          },
        },
      );
      const stats = this.buildStats(items);
      const roles = this.buildOptions("all", null, items.map((r) => r.role));
      const statuses = this.buildOptions("all", null, items.map((r) => r.status));
      this.setState({ rows: items, stats, roles, statuses, error: "" });
    } catch (e) {
      this.setState({ error: e?.message || "No se pudo importar el CSV." });
    } finally {
      if (this.importInput) this.importInput.value = "";
    }
  }

  render() {
    const { search, role, status, rows, stats, roles, statuses, loading, error } = this.state;

    return (
      <>
        <style>{`
        .usr-wrap{display:flex;flex-direction:column;gap:16px}
        .usr-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .usr-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
        .usr-sub{color:var(--slate-500);font-size:13px}
        .usr-actions{display:flex;gap:8px;flex-wrap:wrap}
        .btn{border:1px solid var(--slate-200);background:#fff;color:var(--slate-700);padding:9px 12px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer}
        .btn.primary{border:none;background:linear-gradient(135deg,var(--blue-600),var(--teal-500));color:#fff}

        .usr-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:900px){.usr-stats{grid-template-columns:1fr}}
        .stat-card{background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px;display:flex;align-items:center;justify-content:space-between}
        .stat-label{font-size:11px;text-transform:uppercase;color:var(--slate-500);font-weight:800}
        .stat-value{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--slate-900)}
        .stat-pill{padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}
        .stat-pill.ok{background:rgba(16,185,129,.12);color:#0f766e}
        .stat-pill.warn{background:rgba(239,68,68,.12);color:#b91c1c}

        .usr-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px}
        .search{display:flex;align-items:center;gap:8px;border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;background:#fff;min-width:220px}
        .search input{border:none;outline:none;background:none;font-size:13px;flex:1;color:var(--slate-700)}
        .sel{border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;font-size:13px;color:var(--slate-700);background:#fff}

        .usr-table{background:#fff;border:1px solid var(--slate-200);border-radius:16px;overflow:hidden}
        .usr-row{display:grid;grid-template-columns:1fr 1.2fr 0.9fr 0.6fr 0.6fr;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid var(--slate-100)}
        .usr-row.head{background:var(--slate-50);font-size:11px;font-weight:800;color:var(--slate-500);text-transform:uppercase;border-top:none}
        .usr-main{display:flex;flex-direction:column;gap:2px}
        .usr-ttl{font-weight:800;color:var(--slate-900);font-size:13px}
        .usr-subtxt{font-size:12px;color:var(--slate-500)}
        .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:800;border-radius:999px;padding:4px 8px;border:1px solid transparent}
        .badge.ok{background:rgba(34,197,94,.12);color:#15803d}
        .badge.muted{background:rgba(148,163,184,.2);color:#475569}
        .badge.err{background:rgba(239,68,68,.12);color:#b91c1c}
        .btn-xs{padding:6px 8px;border-radius:8px;border:1px solid var(--slate-200);background:#fff;font-size:11px;font-weight:800;color:var(--slate-600);cursor:pointer}
        .empty{padding:30px;text-align:center;color:var(--slate-500);font-size:13px}
      `}</style>

        <div className="usr-wrap">
          <div className="usr-head">
            <div>
              <h1 className="usr-title">Usuarios</h1>
              <p className="usr-sub">Gestion de usuarios registrados. Lista, busqueda y edicion.</p>
            </div>
            <div className="usr-actions">
              <button className="btn" onClick={this.handleExport}>Exportar</button>
              <button className="btn" onClick={this.handleImportClick}>Importar</button>
            </div>
          </div>

          <input
            ref={(el) => { this.importInput = el; }}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={(e) => this.handleImportFile(e)}
          />

          <div className="usr-stats">
            <div className="stat-card">
              <div>
                <div className="stat-label">Total usuarios</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <span className="stat-pill ok">Activos</span>
            </div>
            <div className="stat-card">
              <div>
                <div className="stat-label">Activos</div>
                <div className="stat-value">{stats.active}</div>
              </div>
              <span className="stat-pill ok">Online</span>
            </div>
            <div className="stat-card">
              <div>
                <div className="stat-label">Suspendidos</div>
                <div className="stat-value">{stats.suspended}</div>
              </div>
              <span className="stat-pill warn">Revisar</span>
            </div>
          </div>

          <div className="usr-filters">
            <div className="search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Buscar usuario o correo" value={search} onChange={(e) => this.updateField("search", e.target.value)} />
            </div>
            <select className="sel" value={role} onChange={(e) => this.updateField("role", e.target.value)}>
              {roles.map((r) => <option key={r} value={r}>{r === "all" ? "Rol" : r}</option>)}
            </select>
            <select className="sel" value={status} onChange={(e) => this.updateField("status", e.target.value)}>
              {statuses.map((s) => <option key={s} value={s}>{s === "all" ? "Estado" : s}</option>)}
            </select>
          </div>

          <div className="usr-table">
            <div className="usr-row head">
              <div>Usuario</div>
              <div>Email</div>
              <div>Rol</div>
              <div>Estado</div>
              <div>Acciones</div>
            </div>
            {loading ? (
              <div className="empty">Cargando usuarios...</div>
            ) : error ? (
              <div className="empty">{error}</div>
            ) : rows.length === 0 ? (
              <div className="empty">No hay usuarios para los filtros actuales.</div>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="usr-row">
                  <div className="usr-main">
                    <div className="usr-ttl">{row.name}</div>
                    <div className="usr-subtxt">{row.id} - Ultimo acceso {this.fmtDate(row.lastSeen)}</div>
                  </div>
                  <div className="usr-subtxt">{row.email}</div>
                  <div className="usr-ttl">{row.role}</div>
                  <div>
                    <span className={this.statusClass(row.status)}>{row.status}</span>
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
}
