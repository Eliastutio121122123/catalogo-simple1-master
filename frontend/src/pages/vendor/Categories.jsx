import { useEffect, useState } from "react";
import categoryService from "../../services/odoo/categoryService";

/* ── Icons ── */
const IcoPlus  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoPen   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoTrash = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
const IcoX     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoTag   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;

export default function Categories() {
  const [cats, setCats]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery]     = useState("");
  const [modal, setModal]     = useState(null); // null | { mode:"create"|"edit"|"delete", cat?:{} }
  const [form, setForm]       = useState({ name: "", parentId: "" });
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState("");
  const [toast, setToast]     = useState(null); // { msg, type:"ok"|"err" }

  /* ── helpers ── */
  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await categoryService.list();
      setCats(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast(e.message || "No se pudieron cargar las categorías", "err");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = cats.filter(c =>
    !query.trim() ||
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.fullName || "").toLowerCase().includes(query.toLowerCase())
  );

  /* ── open modal ── */
  const openCreate = () => {
    setForm({ name: "", parentId: "" });
    setErr("");
    setModal({ mode: "create" });
  };

  const openEdit = (cat) => {
    setForm({ name: cat.name, parentId: cat.parentId ? String(cat.parentId) : "" });
    setErr("");
    setModal({ mode: "edit", cat });
  };

  const openDelete = (cat) => {
    setErr("");
    setModal({ mode: "delete", cat });
  };

  const closeModal = () => { setModal(null); setErr(""); };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) { setErr("El nombre es obligatorio"); return; }
    setBusy(true);
    setErr("");
    try {
      const parentId = form.parentId ? parseInt(form.parentId, 10) : null;
      if (modal.mode === "create") {
        await categoryService.create(name, parentId);
        showToast("Categoría creada correctamente");
      } else {
        await categoryService.update(modal.cat.id, name, parentId);
        showToast("Categoría actualizada");
      }
      await load();
      closeModal();
    } catch (e) {
      setErr(e.message || "Error al guardar");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setErr("");
    try {
      await categoryService.remove(modal.cat.id);
      showToast("Categoría eliminada");
      await load();
      closeModal();
    } catch (e) {
      setErr(e.message || "No se pudo eliminar");
    } finally {
      setBusy(false);
    }
  };

  /* ── parent options (exclude self when editing) ── */
  const parentOptions = cats.filter(c =>
    !modal?.cat || c.id !== modal.cat.id
  );

  /* ── top-level vs children ── */
  const topLevel  = filtered.filter(c => !c.parentId);
  const childMap  = filtered.reduce((acc, c) => {
    if (c.parentId) {
      acc[c.parentId] = acc[c.parentId] || [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {});

  return (
    <>
      <style>{`
        .cat{display:flex;flex-direction:column;gap:16px}
        .cat-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .cat-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .cat-sub{font-size:12.5px;color:var(--vs-500);margin-top:2px}
        .cat-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:all .18s;border:none}
        .cat-btn.pri{background:linear-gradient(135deg,var(--vt-700),var(--vt-500));color:#fff;box-shadow:0 3px 12px rgba(6,182,212,.28)}
        .cat-btn.pri:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(6,182,212,.38)}
        .cat-btn.ghost{border:1.5px solid var(--vs-200);background:var(--vw);color:var(--vs-700)}
        .cat-btn.ghost:hover{border-color:var(--vt-400);color:var(--vt-700)}
        .cat-btn.danger{background:#fee2e2;border:1.5px solid #fca5a5;color:#b91c1c}
        .cat-btn.danger:hover{background:#fecaca}
        .cat-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}

        /* Search bar */
        .cat-search{padding:9px 14px;border-radius:11px;border:1.5px solid var(--vs-200);background:var(--vs-50);font-size:13.5px;color:var(--vs-900);outline:none;transition:all .2s;width:100%;max-width:320px}
        .cat-search:focus{border-color:var(--vt-500);background:#fff;box-shadow:0 0 0 3px rgba(6,182,212,.1)}

        /* Stats */
        .cat-stats{display:flex;gap:10px;flex-wrap:wrap}
        .cat-stat{background:#fff;border:1px solid var(--vs-200);border-radius:12px;padding:10px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 1px 3px rgba(15,23,42,.04)}
        .cat-stat-icon{width:36px;height:36px;border-radius:10px;background:rgba(6,182,212,.1);display:flex;align-items:center;justify-content:center;color:var(--vt-600);flex-shrink:0}
        .cat-stat-val{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--vs-900);line-height:1}
        .cat-stat-lbl{font-size:11px;color:var(--vs-500);font-weight:600;margin-top:2px}

        /* Table */
        .cat-card{background:#fff;border:1px solid var(--vs-200);border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,.04)}
        .cat-thead{display:grid;grid-template-columns:1fr 160px 100px;gap:10px;padding:10px 16px;background:var(--vs-50);font-size:10.5px;font-weight:800;color:var(--vs-500);text-transform:uppercase;letter-spacing:.6px}
        .cat-row{display:grid;grid-template-columns:1fr 160px 100px;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid var(--vs-100);font-size:13px;color:var(--vs-700);transition:background .12s}
        .cat-row:hover{background:var(--vs-50)}
        .cat-row.child{background:linear-gradient(90deg,rgba(6,182,212,.03) 0%,transparent 100%);border-left:3px solid rgba(6,182,212,.25)}
        .cat-row.child .cat-name{padding-left:18px}
        .cat-name{display:flex;align-items:center;gap:7px;font-weight:700;color:var(--vs-900)}
        .cat-parent-badge{font-size:10.5px;font-weight:600;color:var(--vs-500);background:var(--vs-100);padding:2px 8px;border-radius:100px}
        .cat-actions{display:flex;gap:6px;justify-content:flex-end}
        .cat-ico-btn{width:30px;height:30px;border-radius:8px;border:1.5px solid var(--vs-200);background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--vs-500);transition:all .15s}
        .cat-ico-btn:hover.edit{border-color:var(--vt-400);color:var(--vt-600);background:rgba(6,182,212,.05)}
        .cat-ico-btn:hover.del{border-color:#fca5a5;color:#b91c1c;background:#fef2f2}
        .cat-empty{padding:40px 24px;text-align:center;color:var(--vs-400);font-size:13.5px}

        /* Modal overlay */
        .cat-ov{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(3px)}
        .cat-modal{width:100%;max-width:440px;background:#fff;border-radius:20px;border:1px solid var(--vs-200);box-shadow:0 20px 60px rgba(15,23,42,.2);overflow:hidden;animation:catSlide .22s ease}
        @keyframes catSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .cat-modal-head{padding:18px 20px 14px;border-bottom:1px solid var(--vs-100);display:flex;align-items:center;justify-content:space-between}
        .cat-modal-title{font-family:'Lexend',sans-serif;font-size:16px;font-weight:800;color:var(--vs-900)}
        .cat-modal-close{width:30px;height:30px;border-radius:8px;border:1.5px solid var(--vs-200);background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--vs-400);transition:all .15s}
        .cat-modal-close:hover{border-color:var(--vs-400);color:var(--vs-700)}
        .cat-modal-body{padding:20px}
        .cat-modal-foot{padding:14px 20px;border-top:1px solid var(--vs-100);display:flex;gap:8px;justify-content:flex-end}

        /* Form */
        .cat-field{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
        .cat-label{font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase;letter-spacing:.7px}
        .cat-input{padding:11px 14px;border:1.5px solid var(--vs-200);border-radius:11px;background:var(--vs-50);font-size:14px;font-weight:500;color:var(--vs-900);outline:none;transition:all .2s;width:100%}
        .cat-input:focus{border-color:var(--vt-500);background:#fff;box-shadow:0 0 0 3px rgba(6,182,212,.1)}
        .cat-input.err{border-color:#ef4444}
        .cat-err-msg{font-size:12px;font-weight:600;color:#b91c1c;background:#fef2f2;border:1px solid #fca5a5;padding:8px 12px;border-radius:9px;margin-bottom:10px}
        .cat-del-info{font-size:13.5px;color:var(--vs-700);line-height:1.6;margin-bottom:14px}
        .cat-del-name{font-weight:800;color:var(--vs-900)}

        /* Toast */
        .cat-toast{position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 18px;border-radius:12px;font-size:13px;font-weight:700;box-shadow:0 4px 20px rgba(0,0,0,.18);animation:catFade .25s ease}
        .cat-toast.ok{background:#f0fdf4;color:#15803d;border:1px solid #86efac}
        .cat-toast.err{background:#fef2f2;color:#b91c1c;border:1px solid #fca5a5}
        @keyframes catFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {toast && <div className={`cat-toast ${toast.type}`}>{toast.msg}</div>}

      <div className="cat">
        {/* ── Header ── */}
        <div className="cat-h">
          <div>
            <h1 className="cat-title">Categorías</h1>
            <p className="cat-sub">Gestiona las categorías de productos. Se reflejan automáticamente en el formulario y la tienda.</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              className="cat-search"
              placeholder="Buscar categoría..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button className="cat-btn pri" onClick={openCreate}>
              <IcoPlus /> Nueva categoría
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="cat-stats">
          <div className="cat-stat">
            <div className="cat-stat-icon"><IcoTag /></div>
            <div>
              <div className="cat-stat-val">{cats.length}</div>
              <div className="cat-stat-lbl">Total categorías</div>
            </div>
          </div>
          <div className="cat-stat">
            <div className="cat-stat-icon"><IcoTag /></div>
            <div>
              <div className="cat-stat-val">{cats.filter(c => !c.parentId).length}</div>
              <div className="cat-stat-lbl">Principales</div>
            </div>
          </div>
          <div className="cat-stat">
            <div className="cat-stat-icon"><IcoTag /></div>
            <div>
              <div className="cat-stat-val">{cats.filter(c => c.parentId).length}</div>
              <div className="cat-stat-lbl">Subcategorías</div>
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="cat-card">
          <div className="cat-thead">
            <span>Categoría</span>
            <span>Categoría padre</span>
            <span style={{ textAlign: "right" }}>Acciones</span>
          </div>

          {loading && (
            <div className="cat-empty">Cargando categorías...</div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="cat-empty">
              {query ? "No se encontraron categorías con ese nombre." : "No hay categorías. ¡Crea la primera!"}
            </div>
          )}

          {!loading && topLevel.map(cat => (
            <>
              {/* Parent row */}
              <div key={cat.id} className="cat-row">
                <div className="cat-name">
                  <IcoTag />
                  {cat.name}
                </div>
                <div style={{ color: "var(--vs-400)", fontSize: 12 }}>—</div>
                <div className="cat-actions">
                  <button className="cat-ico-btn edit" title="Editar" onClick={() => openEdit(cat)}><IcoPen /></button>
                  <button className="cat-ico-btn del" title="Eliminar" onClick={() => openDelete(cat)}><IcoTrash /></button>
                </div>
              </div>

              {/* Child rows */}
              {(childMap[cat.id] || []).map(child => (
                <div key={child.id} className="cat-row child">
                  <div className="cat-name">
                    <IcoTag />
                    {child.name}
                  </div>
                  <span className="cat-parent-badge">{cat.name}</span>
                  <div className="cat-actions">
                    <button className="cat-ico-btn edit" title="Editar" onClick={() => openEdit(child)}><IcoPen /></button>
                    <button className="cat-ico-btn del" title="Eliminar" onClick={() => openDelete(child)}><IcoTrash /></button>
                  </div>
                </div>
              ))}
            </>
          ))}
        </div>
      </div>

      {/* ── MODAL ── */}
      {modal && (
        <div className="cat-ov" onClick={closeModal}>
          <div className="cat-modal" onClick={e => e.stopPropagation()}>
            <div className="cat-modal-head">
              <div className="cat-modal-title">
                {modal.mode === "create" ? "Nueva categoría"
                 : modal.mode === "edit" ? "Editar categoría"
                 : "Eliminar categoría"}
              </div>
              <button className="cat-modal-close" onClick={closeModal}><IcoX /></button>
            </div>

            <div className="cat-modal-body">
              {err && <div className="cat-err-msg">{err}</div>}

              {/* ─ Create / Edit form ─ */}
              {modal.mode !== "delete" && (
                <form onSubmit={handleSubmit}>
                  <div className="cat-field">
                    <label className="cat-label">Nombre *</label>
                    <input
                      className={`cat-input${err && !form.name.trim() ? " err" : ""}`}
                      placeholder="Ej. Electrónica, Moda, Deportes..."
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      autoFocus
                    />
                  </div>

                  <div className="cat-field">
                    <label className="cat-label">Categoría padre <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10 }}>(opcional)</span></label>
                    <select
                      className="cat-input"
                      value={form.parentId}
                      onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                      style={{ appearance: "auto" }}
                    >
                      <option value="">Ninguna (categoría principal)</option>
                      {parentOptions.map(c => (
                        <option key={c.id} value={c.id}>{c.fullName || c.name}</option>
                      ))}
                    </select>
                  </div>
                </form>
              )}

              {/* ─ Delete confirm ─ */}
              {modal.mode === "delete" && (
                <div className="cat-del-info">
                  ¿Estás seguro de eliminar la categoría <span className="cat-del-name">«{modal.cat.name}»</span>?
                  <br /><br />
                  Esta acción no se puede deshacer. Si hay productos asignados a esta categoría, no se podrá eliminar.
                </div>
              )}
            </div>

            <div className="cat-modal-foot">
              <button className="cat-btn ghost" onClick={closeModal} disabled={busy}>
                Cancelar
              </button>
              {modal.mode === "delete" ? (
                <button className="cat-btn danger" onClick={handleDelete} disabled={busy}>
                  {busy ? "Eliminando..." : "Sí, eliminar"}
                </button>
              ) : (
                <button className="cat-btn pri" onClick={handleSubmit} disabled={busy}>
                  {busy ? "Guardando..." : modal.mode === "create" ? "Crear categoría" : "Guardar cambios"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
