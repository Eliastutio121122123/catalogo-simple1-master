import { Component } from "react";
import adminCatalogsService from "../../services/odoo/adminCatalogsService";
import { downloadBrandedExcel } from "../../utils/brandedExcel";

/* ─── Modal Ver ──────────────────────────────────────────── */
function ViewModal({ catalog, onClose }) {
  if (!catalog) return null;
  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("es-DO", { year: "numeric", month: "short", day: "numeric" }) : "-";
  const statusLabel = (s) =>
    s === "published" ? "Publicado" : s === "review" ? "En revisión" : s === "paused" ? "Pausado" : "Borrador";
  const statusColor = (s) =>
    s === "published" ? "#15803d" : s === "review" ? "#b45309" : "#475569";
  const statusBg = (s) =>
    s === "published" ? "rgba(34,197,94,.12)" : s === "review" ? "rgba(245,158,11,.12)" : "rgba(148,163,184,.2)";

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalTitle}>Detalle del Catálogo</div>
            <div style={styles.modalSub}>{catalog.id}</div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.detailGrid}>
          <Field label="Nombre" value={catalog.name} />
          <Field label="Vendedor" value={catalog.vendor} />
          <Field label="Items" value={catalog.items} />
          <Field
            label="Estado"
            value={
              <span style={{ background: statusBg(catalog.status), color: statusColor(catalog.status), padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                {statusLabel(catalog.status)}
              </span>
            }
          />
          <Field label="Visibilidad" value={catalog.visibility === "public" ? "Público" : "Privado"} />
          <Field label="Actualizado" value={fmt(catalog.updatedAt)} />
          <Field label="Creado" value={fmt(catalog.createdAt)} />
          {catalog.description && (
            <Field label="Descripción" value={catalog.description} wide />
          )}
        </div>

        <div style={styles.modalFooter}>
          <button style={styles.btnSecondary} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal Editar ───────────────────────────────────────── */
class EditModal extends Component {
  constructor(props) {
    super(props);
    const c = props.catalog || {};
    this.state = {
      name: c.name || "",
      description: c.description || "",
      active: c.active !== false,
      saving: false,
      error: "",
    };
  }

  handleSave = async () => {
    const { catalog, onSaved } = this.props;
    const { name, description, active } = this.state;
    if (!name.trim()) {
      this.setState({ error: "El nombre es requerido." });
      return;
    }
    this.setState({ saving: true, error: "" });
    try {
      const updated = await adminCatalogsService.update(catalog.rawId, {
        name: name.trim(),
        description: description.trim(),
        active,
      });
      onSaved(updated);
    } catch (e) {
      this.setState({ error: e?.message || "Error al guardar." });
    } finally {
      this.setState({ saving: false });
    }
  };

  render() {
    const { onClose } = this.props;
    const { name, description, active, saving, error } = this.state;

    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <div>
              <div style={styles.modalTitle}>Editar Catálogo</div>
              <div style={styles.modalSub}>{this.props.catalog?.id}</div>
            </div>
            <button style={styles.closeBtn} onClick={onClose}>✕</button>
          </div>

          <div style={styles.form}>
            <label style={styles.label}>Nombre *</label>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => this.setState({ name: e.target.value })}
              placeholder="Nombre del catálogo"
            />

            <label style={styles.label}>Descripción</label>
            <textarea
              style={{ ...styles.input, minHeight: 80, resize: "vertical" }}
              value={description}
              onChange={(e) => this.setState({ description: e.target.value })}
              placeholder="Descripción opcional..."
            />

            <label style={styles.label}>Estado</label>
            <div style={styles.toggleRow}>
              <span style={styles.toggleLabel}>{active ? "Publicado" : "Inactivo"}</span>
              <button
                type="button"
                style={{ ...styles.toggle, background: active ? "#10b981" : "#cbd5e1" }}
                onClick={() => this.setState({ active: !active })}
              >
                <span style={{ ...styles.toggleDot, transform: active ? "translateX(20px)" : "translateX(0)" }} />
              </button>
            </div>

            {error && <div style={styles.errorMsg}>{error}</div>}
          </div>

          <div style={styles.modalFooter}>
            <button style={styles.btnSecondary} onClick={onClose} disabled={saving}>Cancelar</button>
            <button
              style={{ ...styles.btnPrimary, opacity: saving ? 0.6 : 1 }}
              onClick={this.handleSave}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

function Field({ label, value, wide }) {
  return (
    <div style={wide ? { gridColumn: "1 / -1" } : {}}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#1e293b", fontWeight: 600 }}>{value || "-"}</div>
    </div>
  );
}

/* ─── Estilos compartidos ────────────────────────────────── */
const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
  },
  modal: {
    background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,.18)",
    width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 0,
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9",
  },
  modalTitle: { fontFamily: "'Lexend',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a" },
  modalSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  closeBtn: {
    background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
    width: 32, height: 32, cursor: "pointer", fontSize: 13, color: "#64748b",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  detailGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: "20px 24px",
  },
  form: { display: "flex", flexDirection: "column", gap: 12, padding: "20px 24px" },
  label: { fontSize: 12, fontWeight: 700, color: "#475569" },
  input: {
    border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 12px",
    fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit", width: "100%",
    boxSizing: "border-box",
  },
  toggleRow: { display: "flex", alignItems: "center", gap: 10 },
  toggleLabel: { fontSize: 13, fontWeight: 600, color: "#334155" },
  toggle: {
    position: "relative", width: 44, height: 24, borderRadius: 999,
    border: "none", cursor: "pointer", transition: "background .2s", padding: 0,
  },
  toggleDot: {
    position: "absolute", top: 3, left: 3, width: 18, height: 18,
    borderRadius: "50%", background: "#fff", transition: "transform .2s",
    display: "block",
  },
  errorMsg: {
    background: "rgba(239,68,68,.1)", color: "#dc2626", fontSize: 12,
    fontWeight: 700, padding: "8px 12px", borderRadius: 8,
  },
  modalFooter: {
    display: "flex", gap: 10, justifyContent: "flex-end",
    padding: "14px 24px 20px", borderTop: "1px solid #f1f5f9",
  },
  btnSecondary: {
    border: "1px solid #e2e8f0", background: "#fff", color: "#475569",
    padding: "9px 16px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
  },
  btnPrimary: {
    border: "none", background: "linear-gradient(135deg,#2563eb,#0d9488)",
    color: "#fff", padding: "9px 18px", borderRadius: 10, fontWeight: 700,
    fontSize: 13, cursor: "pointer",
  },
};

/* ─── Componente principal ───────────────────────────────── */
export default class Catalogs extends Component {
  static STATUSES = ["all", "published", "review", "paused", "draft"];
  static VISIBILITY = ["all", "public", "private"];
  static SORTS = [
    { id: "updated", label: "Mas reciente" },
    { id: "items", label: "Mas items" },
    { id: "rating", label: "Mejor rating" },
  ];

  constructor(props) {
    super(props);
    this.state = {
      search: "",
      status: "all",
      visibility: "all",
      sortBy: "updated",
      rows: [],
      stats: { total: 0, published: 0, review: 0 },
      loading: true,
      error: "",
      viewCatalog: null,
      editCatalog: null,
    };
  }

  componentDidMount() {
    this.load();
  }

  async load() {
    this.setState({ loading: true, error: "" });
    try {
      const payload = await adminCatalogsService.list({
        q: this.state.search,
        status: this.state.status,
        visibility: this.state.visibility,
      });
      const rows = Array.isArray(payload?.items) ? payload.items : [];
      const stats = payload?.stats || this.buildStats(rows);
      this.setState({ rows, stats });
    } catch (e) {
      this.setState({ error: e?.message || "No se pudo cargar catalogos." });
    } finally {
      this.setState({ loading: false });
    }
  }

  updateField(field, value) {
    this.setState({ [field]: value }, () => this.load());
  }

  buildStats(rows) {
    const total = rows.length;
    const published = rows.filter((c) => c.status === "published").length;
    const review = rows.filter((c) => c.status === "review").length;
    return { total, published, review };
  }

  statusClass(status) {
    if (status === "published") return "badge ok";
    if (status === "review") return "badge warn";
    if (status === "paused") return "badge muted";
    return "badge draft";
  }

  statusLabel(status) {
    if (status === "published") return "Publicado";
    if (status === "review") return "En revision";
    if (status === "paused") return "Pausado";
    return "Borrador";
  }

  visibilityLabel(value) {
    if (value === "public") return "Publico";
    if (value === "private") return "Privado";
    return value || "-";
  }

  handleExport = () => {
    const rows = Array.isArray(this.state.rows) ? this.state.rows : [];
    if (!rows.length) {
      this.setState({ error: "No hay catalogos para exportar." });
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    downloadBrandedExcel({
      filename: `catalogos_${date}.xls`,
      sheetName: "Catalogos",
      reportTitle: "Reporte de Catalogos",
      columns: [
        { key: "id", label: "ID" },
        { key: "name", label: "Catalogo" },
        { key: "vendor", label: "Vendedor" },
        { key: "items", label: "Items", className: "td num" },
        { key: "status", label: "Estado", format: (_, row) => this.statusLabel(row.status) },
        { key: "visibility", label: "Visibilidad", format: (_, row) => this.visibilityLabel(row.visibility) },
        { key: "rating", label: "Rating", className: "td num" },
        { key: "updatedAt", label: "Actualizado", format: (_, row) => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString("es-DO") : "-" },
      ],
      rows,
    });
  };

  handleView = (row) => {
    this.setState({ viewCatalog: row });
  };

  handleEdit = (row) => {
    this.setState({ editCatalog: row });
  };

  handleEditSaved = (updatedCatalog) => {
    const rows = this.state.rows.map((r) =>
      r.rawId === updatedCatalog.rawId ? { ...r, ...updatedCatalog } : r
    );
    const stats = this.buildStats(rows);
    this.setState({ rows, stats, editCatalog: null });
  };

  sortedRows() {
    const rows = [...this.state.rows];
    const { sortBy } = this.state;
    if (sortBy === "items") return rows.sort((a, b) => b.items - a.items);
    if (sortBy === "rating") return rows.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return rows.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }

  render() {
    const { search, status, visibility, sortBy, stats, loading, error, viewCatalog, editCatalog } = this.state;
    const rows = this.sortedRows();

    return (
      <>
        <style>{`
        .cat-wrap{display:flex;flex-direction:column;gap:16px}
        .cat-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .cat-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
        .cat-sub{color:var(--slate-500);font-size:13px}
        .cat-actions{display:flex;gap:8px;flex-wrap:wrap}
        .btn{border:1px solid var(--slate-200);background:#fff;color:var(--slate-700);padding:9px 12px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer}
        .btn.primary{border:none;background:linear-gradient(135deg,var(--blue-600),var(--teal-500));color:#fff}

        .cat-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:900px){.cat-stats{grid-template-columns:1fr}}
        .stat-card{background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px;display:flex;align-items:center;justify-content:space-between}
        .stat-label{font-size:11px;text-transform:uppercase;color:var(--slate-500);font-weight:800}
        .stat-value{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--slate-900)}
        .stat-pill{padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}
        .stat-pill.ok{background:rgba(16,185,129,.12);color:#0f766e}
        .stat-pill.warn{background:rgba(245,158,11,.12);color:#b45309}

        .cat-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px}
        .search{display:flex;align-items:center;gap:8px;border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;background:#fff;min-width:220px}
        .search input{border:none;outline:none;background:none;font-size:13px;flex:1;color:var(--slate-700)}
        .sel{border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;font-size:13px;color:var(--slate-700);background:#fff}

        .cat-table{background:#fff;border:1px solid var(--slate-200);border-radius:16px;overflow:hidden}
        .cat-row{display:grid;grid-template-columns:1.2fr 0.9fr 0.5fr 0.7fr 0.7fr 0.5fr;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid var(--slate-100)}
        .cat-row.head{background:var(--slate-50);font-size:11px;font-weight:800;color:var(--slate-500);text-transform:uppercase;border-top:none}
        .cat-main{display:flex;flex-direction:column;gap:2px}
        .cat-ttl{font-weight:800;color:var(--slate-900);font-size:13px}
        .cat-subtxt{font-size:12px;color:var(--slate-500)}
        .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:800;border-radius:999px;padding:4px 8px;border:1px solid transparent}
        .badge.ok{background:rgba(34,197,94,.12);color:#15803d}
        .badge.warn{background:rgba(245,158,11,.12);color:#b45309}
        .badge.muted{background:rgba(148,163,184,.2);color:#475569}
        .badge.draft{background:rgba(59,130,246,.12);color:#1d4ed8}
        .vis{font-size:12px;font-weight:800;color:var(--slate-600)}
        .actions{display:flex;gap:6px}
        .btn-xs{padding:6px 8px;border-radius:8px;border:1px solid var(--slate-200);background:#fff;font-size:11px;font-weight:800;color:var(--slate-600);cursor:pointer;transition:background .15s,color .15s}
        .btn-xs:hover{background:var(--slate-900);color:#fff;border-color:var(--slate-900)}
        .btn-xs.edit:hover{background:#2563eb;color:#fff;border-color:#2563eb}
        .empty{padding:30px;text-align:center;color:var(--slate-500);font-size:13px}
      `}</style>

        <div className="cat-wrap">
          <div className="cat-head">
            <div>
              <h1 className="cat-title">Catalogos</h1>
              <p className="cat-sub">Gestion de catalogos y estado de publicacion.</p>
            </div>
            <div className="cat-actions">
              <button className="btn" onClick={this.handleExport}>Exportar</button>
              <button className="btn primary">Nuevo catalogo</button>
            </div>
          </div>

          <div className="cat-stats">
            <div className="stat-card">
              <div>
                <div className="stat-label">Total catalogos</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <span className="stat-pill ok">Activos</span>
            </div>
            <div className="stat-card">
              <div>
                <div className="stat-label">Publicados</div>
                <div className="stat-value">{stats.published}</div>
              </div>
              <span className="stat-pill ok">Online</span>
            </div>
            <div className="stat-card">
              <div>
                <div className="stat-label">En revision</div>
                <div className="stat-value">{stats.review}</div>
              </div>
              <span className="stat-pill warn">Pendiente</span>
            </div>
          </div>

          <div className="cat-filters">
            <div className="search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Buscar catalogo o vendedor" value={search} onChange={(e) => this.updateField("search", e.target.value)} />
            </div>
            <select className="sel" value={status} onChange={(e) => this.updateField("status", e.target.value)}>
              {Catalogs.STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "Todos" : this.statusLabel(s)}</option>)}
            </select>
            <select className="sel" value={visibility} onChange={(e) => this.updateField("visibility", e.target.value)}>
              {Catalogs.VISIBILITY.map((v) => <option key={v} value={v}>{v === "all" ? "Visibilidad" : v}</option>)}
            </select>
            <select className="sel" value={sortBy} onChange={(e) => this.setState({ sortBy: e.target.value })}>
              {Catalogs.SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          <div className="cat-table">
            <div className="cat-row head">
              <div>Catalogo</div>
              <div>Vendedor</div>
              <div>Items</div>
              <div>Estado</div>
              <div>Actualizado</div>
              <div>Acciones</div>
            </div>
            {loading ? (
              <div className="empty">Cargando catalogos...</div>
            ) : error ? (
              <div className="empty">{error}</div>
            ) : rows.length === 0 ? (
              <div className="empty">No hay catalogos con estos filtros.</div>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="cat-row">
                  <div className="cat-main">
                    <div className="cat-ttl">{row.name}</div>
                    <div className="cat-subtxt">{row.id}</div>
                  </div>
                  <div className="cat-main">
                    <div className="cat-ttl">{row.vendor}</div>
                    <div className="cat-subtxt">{row.visibility === "public" ? "Publico" : "Privado"}</div>
                  </div>
                  <div className="cat-ttl">{row.items}</div>
                  <div>
                    <span className={this.statusClass(row.status)}>{this.statusLabel(row.status)}</span>
                  </div>
                  <div className="cat-subtxt">{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString("es-DO") : "-"}</div>
                  <div className="actions">
                    <button className="btn-xs" onClick={() => this.handleView(row)}>Ver</button>
                    <button className="btn-xs edit" onClick={() => this.handleEdit(row)}>Editar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {viewCatalog && (
          <ViewModal catalog={viewCatalog} onClose={() => this.setState({ viewCatalog: null })} />
        )}
        {editCatalog && (
          <EditModal
            catalog={editCatalog}
            onClose={() => this.setState({ editCatalog: null })}
            onSaved={this.handleEditSaved}
          />
        )}
      </>
    );
  }
}
