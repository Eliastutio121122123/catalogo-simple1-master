import { Component } from "react";
import adminAuditService from "../../services/odoo/adminAuditService";
import { downloadBrandedExcel } from "../../utils/brandedExcel";

export default class AuditLog extends Component {
  static SEVERITIES = ["all", "low", "medium", "high", "critical"];
  static RANGES = ["24h", "7d", "30d"];

  constructor(props) {
    super(props);
    this.state = {
      search: "",
      action: "All actions",
      actor: "All actors",
      severity: "all",
      range: "24h",
      rows: [],
      stats: { total: 0, critical: 0, failed: 0 },
      actions: ["All actions"],
      actors: ["All actors"],
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
      const payload = await adminAuditService.list({
        q: this.state.search,
        action: this.state.action === "All actions" ? "" : this.state.action,
        actor: this.state.actor === "All actors" ? "" : this.state.actor,
        severity: this.state.severity,
        range: this.state.range,
      });
      const items = Array.isArray(payload?.items) ? payload.items : [];
      const stats = payload?.stats || this.buildStats(items);
      const actions = this.buildOptions("All actions", payload?.filters?.actions, items.map(r => r.action));
      const actors = this.buildOptions("All actors", payload?.filters?.actors, items.map(r => r.actor));
      this.setState({ rows: items, stats, actions, actors });
    } catch (e) {
      this.setState({ error: e?.message || "No se pudo cargar la auditoria." });
    } finally {
      this.setState({ loading: false });
    }
  }

  updateField(field, value) {
    this.setState({ [field]: value }, () => this.load());
  }

  buildStats(rows) {
    const total = rows.length;
    const critical = rows.filter((r) => r.severity === "critical").length;
    const failed = rows.filter((r) => r.status !== "ok").length;
    return { total, critical, failed };
  }

  buildOptions(label, fromFilters, fromRows) {
    const values = new Set();
    (fromFilters || []).forEach((v) => values.add(v));
    (fromRows || []).forEach((v) => v && values.add(v));
    return [label, ...Array.from(values).sort()];
  }

  fmtDate(iso) {
    const d = new Date(iso || "");
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("es-DO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  severityTone(sev) {
    if (sev === "critical") return "sev critical";
    if (sev === "high") return "sev high";
    if (sev === "medium") return "sev medium";
    return "sev low";
  }

  handleExport = () => {
    const rows = Array.isArray(this.state.rows) ? this.state.rows : [];
    if (!rows.length) {
      this.setState({ error: "No hay eventos para exportar." });
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    downloadBrandedExcel({
      filename: `auditoria_${date}.xls`,
      sheetName: "Auditoria",
      reportTitle: "Reporte de Auditoria",
      columns: [
        { key: "id", label: "ID" },
        { key: "at", label: "Fecha", format: (_, row) => this.fmtDate(row.at) },
        { key: "actor", label: "Actor" },
        { key: "role", label: "Rol" },
        { key: "ip", label: "IP" },
        { key: "action", label: "Accion" },
        { key: "target", label: "Recurso" },
        { key: "severity", label: "Severidad" },
        { key: "status", label: "Estado" },
      ],
      rows,
    });
  };

  render() {
    const { search, action, actor, severity, range, rows, stats, actions, actors, loading, error } = this.state;

    return (
      <>
        <style>{`
          .audit-wrap{display:flex;flex-direction:column;gap:16px}
          .audit-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
          .audit-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
          .audit-sub{color:var(--slate-500);font-size:13px}
          .audit-actions{display:flex;gap:8px;flex-wrap:wrap}
          .btn{border:1px solid var(--slate-200);background:#fff;color:var(--slate-700);padding:9px 12px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer}
          .btn.primary{border:none;background:linear-gradient(135deg,var(--blue-600),var(--teal-500));color:#fff}

          .audit-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
          @media(max-width:900px){.audit-stats{grid-template-columns:1fr}}
          .stat-card{background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px;display:flex;align-items:center;justify-content:space-between}
          .stat-label{font-size:11px;text-transform:uppercase;color:var(--slate-500);font-weight:800}
          .stat-value{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--slate-900)}
          .stat-pill{padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}
          .stat-pill.ok{background:rgba(16,185,129,.12);color:#0f766e}
          .stat-pill.warn{background:rgba(239,68,68,.12);color:#b91c1c}

          .audit-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px}
          .search{display:flex;align-items:center;gap:8px;border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;background:#fff;min-width:220px}
          .search input{border:none;outline:none;background:none;font-size:13px;flex:1;color:var(--slate-700)}
          .sel{border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;font-size:13px;color:var(--slate-700);background:#fff}
          .range{display:flex;gap:6px;align-items:center}
          .chip{padding:6px 10px;border-radius:999px;border:1px solid var(--slate-200);font-size:11px;font-weight:800;color:var(--slate-600);background:#fff;cursor:pointer}
          .chip.active{background:var(--blue-50);border-color:var(--blue-100);color:var(--blue-700)}

          .audit-table{background:#fff;border:1px solid var(--slate-200);border-radius:16px;overflow:hidden}
          .audit-row{display:grid;grid-template-columns:140px 1.2fr 0.9fr 0.9fr 0.6fr;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid var(--slate-100)}
          .audit-row.head{background:var(--slate-50);font-size:11px;font-weight:800;color:var(--slate-500);text-transform:uppercase;border-top:none}
          .audit-row:last-child{border-bottom:none}
          .audit-main{display:flex;flex-direction:column;gap:2px}
          .audit-ttl{font-weight:800;color:var(--slate-900);font-size:13px}
          .audit-subtxt{font-size:12px;color:var(--slate-500)}
          .tag{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;border-radius:999px;padding:4px 8px;border:1px solid transparent}
          .sev.low{background:rgba(34,197,94,.12);color:#15803d}
          .sev.medium{background:rgba(245,158,11,.12);color:#b45309}
          .sev.high{background:rgba(239,68,68,.12);color:#b91c1c}
          .sev.critical{background:rgba(220,38,38,.15);color:#7f1d1d}
          .status.ok{background:rgba(14,165,233,.12);color:#0369a1}
          .status.warn{background:rgba(239,68,68,.12);color:#b91c1c}
          .status.blocked{background:rgba(15,23,42,.12);color:var(--slate-800)}

          .audit-right{display:flex;flex-direction:column;gap:4px}
          .audit-id{font-size:11px;color:var(--slate-400)}
          .audit-ip{font-size:12px;color:var(--slate-600);font-weight:700}

          .audit-empty{padding:30px;text-align:center;color:var(--slate-500);font-size:13px}
        `}</style>

        <div className="audit-wrap">
          <div className="audit-head">
            <div>
              <h1 className="audit-title">Auditoria</h1>
              <p className="audit-sub">Historial de acciones y cambios en el sistema.</p>
            </div>
            <div className="audit-actions">
              <button className="btn" onClick={this.handleExport}>Exportar Excel</button>
              <button className="btn primary">Crear regla</button>
            </div>
          </div>

          <div className="audit-stats">
            <div className="stat-card">
              <div>
                <div className="stat-label">Eventos en rango</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <span className="stat-pill ok">En linea</span>
            </div>
            <div className="stat-card">
              <div>
                <div className="stat-label">Criticos</div>
                <div className="stat-value">{stats.critical}</div>
              </div>
              <span className={`stat-pill ${stats.critical ? "warn" : "ok"}`}>{stats.critical ? "Revisar" : "Normal"}</span>
            </div>
            <div className="stat-card">
              <div>
                <div className="stat-label">Alertas</div>
                <div className="stat-value">{stats.failed}</div>
              </div>
              <span className={`stat-pill ${stats.failed ? "warn" : "ok"}`}>{stats.failed ? "Atencion" : "Ok"}</span>
            </div>
          </div>

          <div className="audit-filters">
            <div className="search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Buscar por usuario, accion, recurso o IP" value={search} onChange={(e) => this.updateField("search", e.target.value)} />
            </div>
            <select className="sel" value={action} onChange={(e) => this.updateField("action", e.target.value)}>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select className="sel" value={actor} onChange={(e) => this.updateField("actor", e.target.value)}>
              {actors.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select className="sel" value={severity} onChange={(e) => this.updateField("severity", e.target.value)}>
              {AuditLog.SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="range">
              {AuditLog.RANGES.map((r) => (
                <button key={r} className={`chip${range === r ? " active" : ""}`} onClick={() => this.updateField("range", r)}>{r}</button>
              ))}
            </div>
          </div>

          <div className="audit-table">
            <div className="audit-row head">
              <div>Fecha</div>
              <div>Evento</div>
              <div>Actor</div>
              <div>Recurso</div>
              <div>Estado</div>
            </div>
            {loading ? (
              <div className="audit-empty">Cargando eventos...</div>
            ) : error ? (
              <div className="audit-empty">{error}</div>
            ) : rows.length === 0 ? (
              <div className="audit-empty">No hay eventos para los filtros actuales.</div>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="audit-row">
                  <div className="audit-right">
                    <div className="audit-ttl">{this.fmtDate(row.at)}</div>
                    <div className="audit-id">{row.id}</div>
                  </div>
                  <div className="audit-main">
                    <div className="audit-ttl">{row.action}</div>
                    <div className="audit-subtxt">IP {row.ip}</div>
                  </div>
                  <div className="audit-main">
                    <div className="audit-ttl">{row.actor}</div>
                    <div className="audit-subtxt">{row.role}</div>
                  </div>
                  <div className="audit-main">
                    <div className="audit-ttl">{row.target}</div>
                    <div className="audit-subtxt">
                      <span className={`tag ${this.severityTone(row.severity)}`}>{row.severity}</span>
                    </div>
                  </div>
                  <div>
                    <span className={`tag status ${row.status}`}>{row.status}</span>
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
