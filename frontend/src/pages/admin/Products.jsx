import { useEffect, useMemo, useState, useCallback } from "react";
import { downloadBrandedExcel } from "../../utils/brandedExcel";
import { api } from "../../services/odoo/odooClient";

const STATUS = ["all", "active", "low", "out"];

const statusLabel = (s) => {
  if (s === "active") return "Activo";
  if (s === "low") return "Bajo stock";
  if (s === "out") return "Agotado";
  if (s === "inactive") return "Inactivo";
  return s || "—";
};

const statusClass = (s) => {
  if (s === "active") return "badge ok";
  if (s === "low") return "badge warn";
  if (s === "out") return "badge err";
  if (s === "inactive") return "badge muted";
  return "badge muted";
};

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n || 0);

// ─── Modal Ver ───────────────────────────────────────────────────────────────
function ViewModal({ product, onClose }) {
  if (!product) return null;
  const rows = [
    ["ID",         product.id],
    ["Nombre",     product.name],
    ["SKU",        product.sku || "—"],
    ["Catálogo",   product.catalog || "—"],
    ["Vendedor",   product.vendor || "—"],
    ["Categoría",  product.category || "—"],
    ["Precio",     fmtMoney(product.price)],
    ["Costo",      fmtMoney(product.cost)],
    ["Stock",      Math.round(product.stock ?? 0)],
    ["Estado",     statusLabel(product.status)],
    ["Imagen",     product.hasImage ? "Sí" : "No"],
    ["Actualizado", product.updatedAt ? new Date(product.updatedAt).toLocaleString("es-DO") : "—"],
  ];
  return (
    <div className="mod-overlay" onClick={onClose}>
      <div className="mod-box" onClick={(e) => e.stopPropagation()}>
        <div className="mod-header">
          <h2 className="mod-title">Detalle del producto</h2>
          <button className="mod-close" onClick={onClose}>✕</button>
        </div>
        <div className="mod-body">
          <table className="detail-tbl">
            <tbody>
              {rows.map(([label, val]) => (
                <tr key={label}>
                  <td className="dt-lbl">{label}</td>
                  <td className="dt-val">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mod-footer">
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Editar ─────────────────────────────────────────────────────────────
function EditModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:   product?.name   ?? "",
    sku:    product?.sku    ?? "",
    price:  product?.price  ?? 0,
    cost:   product?.cost   ?? 0,
    active: product?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr   ] = useState(null);

  if (!product) return null;

  const set = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setErr("El nombre no puede estar vacío."); return; }
    setSaving(true);
    setErr(null);
    try {
      const updated = await api.put(`/api/admin/products/${product.rawId}`, {
        name:   form.name.trim(),
        sku:    form.sku.trim(),
        price:  parseFloat(form.price) || 0,
        cost:   parseFloat(form.cost)  || 0,
        active: form.active,
      });
      onSaved(updated);
      onClose();
    } catch (e) {
      setErr(e.message || "Error al guardar.");
      setSaving(false);
    }
  };

  return (
    <div className="mod-overlay" onClick={onClose}>
      <div className="mod-box" onClick={(e) => e.stopPropagation()}>
        <div className="mod-header">
          <h2 className="mod-title">Editar producto</h2>
          <button className="mod-close" onClick={onClose}>✕</button>
        </div>
        <div className="mod-body">
          {err && <div className="edit-err">{err}</div>}
          <div className="edit-grid">
            <label className="ed-lbl">
              Nombre *
              <input className="ed-input" value={form.name} onChange={set("name")} />
            </label>
            <label className="ed-lbl">
              SKU / Código interno
              <input className="ed-input" value={form.sku} onChange={set("sku")} />
            </label>
            <label className="ed-lbl">
              Precio de venta (DOP)
              <input className="ed-input" type="number" min="0" step="0.01" value={form.price} onChange={set("price")} />
            </label>
            <label className="ed-lbl">
              Costo estándar (DOP)
              <input className="ed-input" type="number" min="0" step="0.01" value={form.cost} onChange={set("cost")} />
            </label>
            <label className="ed-check">
              <input type="checkbox" checked={form.active} onChange={set("active")} />
              Producto activo
            </label>
          </div>
          <p className="ed-note">Catálogo, vendedor y stock se gestionan desde Odoo directamente.</p>
        </div>
        <div className="mod-footer">
          <button className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn primary" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Products page ────────────────────────────────────────────────────────────
export default function Products() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [products, setProducts] = useState([]);
  const [stats,    setStats   ] = useState({ total: 0, active: 0, low: 0, out: 0 });
  const [loading,  setLoading ] = useState(true);
  const [errMsg,   setErrMsg  ] = useState(null);

  // Modals
  const [viewProd, setViewProd] = useState(null);
  const [editProd, setEditProd] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setErrMsg(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (status !== "all") params.set("status", status);
      params.set("limit", "500");

      const data = await api.get(`/api/admin/products?${params.toString()}`);
      setProducts(data.items || []);
      setStats(data.stats || { total: 0, active: 0, low: 0, out: 0 });
    } catch (err) {
      setErrMsg(err.message || "Error al cargar los productos.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(debounce);
  }, [fetchProducts]);

  /* Client-side filtering for instant UX */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((row) => {
      const text = `${row.name} ${row.sku} ${row.catalog} ${row.vendor} ${row.category}`.toLowerCase();
      const matchSearch = !q || text.includes(q);
      const matchStatus = status === "all" || row.status === status;
      return matchSearch && matchStatus;
    });
  }, [search, status, products]);

  const handleExport = () => {
    if (!filtered.length) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadBrandedExcel({
      filename: `productos_${date}.xls`,
      sheetName: "Productos",
      reportTitle: "Reporte de Productos",
      columns: [
        { key: "id",        label: "ID" },
        { key: "name",      label: "Producto" },
        { key: "sku",       label: "SKU" },
        { key: "catalog",   label: "Catálogo" },
        { key: "vendor",    label: "Vendedor" },
        { key: "category",  label: "Categoría" },
        { key: "price",     label: "Precio", className: "td num", format: (_, row) => fmtMoney(row.price) },
        { key: "stock",     label: "Stock", className: "td num" },
        { key: "status",    label: "Estado",     format: (_, row) => statusLabel(row.status) },
        { key: "updatedAt", label: "Actualizado", format: (_, row) => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString("es-DO") : "-" },
      ],
      rows: filtered,
    });
  };

  /* Patch updated product in the local list without full reload */
  const handleProductSaved = (updated) => {
    setProducts((prev) =>
      prev.map((p) => (p.rawId === updated.rawId ? updated : p))
    );
  };

  return (
    <>
      <style>{`
        .prd-wrap{display:flex;flex-direction:column;gap:16px}
        .prd-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .prd-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
        .prd-sub{color:var(--slate-500);font-size:13px}
        .prd-actions{display:flex;gap:8px;flex-wrap:wrap}
        .btn{border:1px solid var(--slate-200);background:#fff;color:var(--slate-700);padding:9px 12px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer;transition:all .2s}
        .btn:hover{border-color:var(--blue-400,#60a5fa);color:var(--blue-600,#2563eb)}
        .btn.primary{border:none;background:linear-gradient(135deg,var(--blue-600),var(--teal-500));color:#fff}
        .btn.primary:hover{opacity:.9;transform:translateY(-1px)}

        .prd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        @media(max-width:1100px){.prd-stats{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.prd-stats{grid-template-columns:1fr}}
        .stat-card{background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px;display:flex;align-items:center;justify-content:space-between;transition:box-shadow .2s}
        .stat-card:hover{box-shadow:0 2px 12px rgba(0,0,0,.06)}
        .stat-label{font-size:11px;text-transform:uppercase;color:var(--slate-500);font-weight:800}
        .stat-value{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--slate-900)}
        .stat-pill{padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}
        .stat-pill.ok{background:rgba(16,185,129,.12);color:#0f766e}
        .stat-pill.warn{background:rgba(245,158,11,.12);color:#b45309}
        .stat-pill.err{background:rgba(239,68,68,.12);color:#b91c1c}
        .stat-pill.muted{background:rgba(148,163,184,.2);color:#475569}

        .prd-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid var(--slate-200);border-radius:14px;padding:12px}
        .search{display:flex;align-items:center;gap:8px;border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;background:#fff;min-width:220px;transition:border-color .2s}
        .search:focus-within{border-color:var(--blue-400,#60a5fa)}
        .search input{border:none;outline:none;background:none;font-size:13px;flex:1;color:var(--slate-700)}
        .sel{border:1px solid var(--slate-200);border-radius:10px;padding:8px 10px;font-size:13px;color:var(--slate-700);background:#fff;cursor:pointer}

        .prd-table{background:#fff;border:1px solid var(--slate-200);border-radius:16px;overflow:hidden}
        .prd-row{display:grid;grid-template-columns:1.1fr 0.9fr 0.9fr 0.7fr 0.6fr 0.6fr 0.55fr;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid var(--slate-100);transition:background .15s}
        .prd-row:hover:not(.head){background:var(--slate-50,#f8fafc)}
        .prd-row.head{background:var(--slate-50);font-size:11px;font-weight:800;color:var(--slate-500);text-transform:uppercase;border-top:none}
        .prd-main{display:flex;flex-direction:column;gap:2px}
        .prd-ttl{font-weight:800;color:var(--slate-900);font-size:13px}
        .prd-subtxt{font-size:12px;color:var(--slate-500)}
        .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:800;border-radius:999px;padding:4px 8px;border:1px solid transparent}
        .badge.ok{background:rgba(34,197,94,.12);color:#15803d}
        .badge.warn{background:rgba(245,158,11,.12);color:#b45309}
        .badge.err{background:rgba(239,68,68,.12);color:#b91c1c}
        .badge.muted{background:rgba(148,163,184,.2);color:#475569}
        .btn-xs{padding:6px 10px;border-radius:8px;border:1px solid var(--slate-200);background:#fff;font-size:11px;font-weight:700;color:var(--slate-600);cursor:pointer;transition:all .15s}
        .btn-xs:hover{border-color:var(--blue-400,#60a5fa);color:var(--blue-600,#2563eb)}
        .btn-xs.edit{border-color:var(--blue-200,#bfdbfe);color:var(--blue-600,#2563eb)}
        .btn-xs.edit:hover{background:var(--blue-50,#eff6ff);border-color:var(--blue-400,#60a5fa)}
        .act-cell{display:flex;gap:5px;align-items:center}
        .empty{padding:30px;text-align:center;color:var(--slate-500);font-size:13px}

        .prd-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:40px;color:var(--slate-500);font-size:14px}
        .prd-loading .spinner{width:20px;height:20px;border:3px solid var(--slate-200);border-top-color:var(--blue-600,#2563eb);border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .prd-error{padding:24px;text-align:center;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:14px;color:#b91c1c;font-size:13px;font-weight:600}
        .prd-error button{margin-top:10px;padding:8px 16px;border:1px solid rgba(239,68,68,.3);border-radius:10px;background:#fff;color:#b91c1c;font-weight:800;font-size:12px;cursor:pointer}
        .stock-val{font-family:'Lexend',sans-serif;font-size:13px;font-weight:800}
        .stock-val.ok{color:#15803d}
        .stock-val.warn{color:#b45309}
        .stock-val.err{color:#b91c1c}

        /* ── Modals ── */
        .mod-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px}
        .mod-box{background:#fff;border-radius:18px;width:100%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,.2);display:flex;flex-direction:column;max-height:90vh;overflow:hidden;animation:modIn .2s ease}
        @keyframes modIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .mod-header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid var(--slate-100)}
        .mod-title{font-family:'Lexend',sans-serif;font-size:17px;font-weight:800;color:var(--slate-900);margin:0}
        .mod-close{border:none;background:none;font-size:18px;cursor:pointer;color:var(--slate-400);line-height:1;padding:4px}
        .mod-close:hover{color:var(--slate-700)}
        .mod-body{padding:16px 20px;overflow-y:auto;flex:1}
        .mod-footer{padding:14px 20px;border-top:1px solid var(--slate-100);display:flex;justify-content:flex-end;gap:8px}

        /* View detail table */
        .detail-tbl{width:100%;border-collapse:collapse}
        .detail-tbl tr{border-bottom:1px solid var(--slate-100)}
        .detail-tbl tr:last-child{border-bottom:none}
        .dt-lbl{font-size:12px;font-weight:700;color:var(--slate-500);padding:9px 0;width:130px;vertical-align:top;text-transform:uppercase;letter-spacing:.04em}
        .dt-val{font-size:13px;font-weight:600;color:var(--slate-800);padding:9px 0}

        /* Edit form */
        .edit-grid{display:flex;flex-direction:column;gap:14px}
        .ed-lbl{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:700;color:var(--slate-500);text-transform:uppercase;letter-spacing:.04em}
        .ed-input{border:1px solid var(--slate-200);border-radius:10px;padding:9px 11px;font-size:13px;color:var(--slate-800);outline:none;transition:border-color .15s}
        .ed-input:focus{border-color:var(--blue-400,#60a5fa)}
        .ed-check{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--slate-700);cursor:pointer;margin-top:2px}
        .ed-check input{width:16px;height:16px;cursor:pointer;accent-color:var(--blue-600,#2563eb)}
        .ed-note{font-size:12px;color:var(--slate-400);margin-top:14px;padding-top:12px;border-top:1px solid var(--slate-100)}
        .edit-err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;color:#b91c1c;font-size:13px;font-weight:600;padding:10px 12px;margin-bottom:12px}
      `}</style>

      <div className="prd-wrap">
        <div className="prd-head">
          <div>
            <h1 className="prd-title">Productos</h1>
            <p className="prd-sub">Gestión de productos, precios y disponibilidad — datos en tiempo real de Odoo.</p>
          </div>
          <div className="prd-actions">
            <button className="btn" onClick={handleExport} disabled={!filtered.length}>Exportar</button>
            <button className="btn" onClick={fetchProducts} disabled={loading}>
              {loading ? "Cargando..." : "⟳ Actualizar"}
            </button>
          </div>
        </div>

        <div className="prd-stats">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total productos</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <span className="stat-pill muted">Total</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">En stock</div>
              <div className="stat-value">{stats.active}</div>
            </div>
            <span className="stat-pill ok">Listos</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Bajo stock</div>
              <div className="stat-value">{stats.low}</div>
            </div>
            <span className="stat-pill warn">Revisar</span>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Agotados</div>
              <div className="stat-value">{stats.out}</div>
            </div>
            <span className="stat-pill err">Urgente</span>
          </div>
        </div>

        <div className="prd-filters">
          <div className="search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar producto, SKU o catálogo" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="sel" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS.map((s) => <option key={s} value={s}>{s === "all" ? "Estado" : statusLabel(s)}</option>)}
          </select>
        </div>

        {errMsg && (
          <div className="prd-error">
            {errMsg}
            <br />
            <button onClick={fetchProducts}>Reintentar</button>
          </div>
        )}

        <div className="prd-table">
          <div className="prd-row head">
            <div>Producto</div>
            <div>Catálogo</div>
            <div>Vendedor</div>
            <div>Precio</div>
            <div>Stock</div>
            <div>Estado</div>
            <div>Acciones</div>
          </div>

          {loading ? (
            <div className="prd-loading">
              <div className="spinner" />
              Cargando productos desde Odoo...
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">No hay productos para los filtros actuales.</div>
          ) : (
            filtered.map((row) => (
              <div key={row.rawId || row.id} className="prd-row">
                <div className="prd-main">
                  <div className="prd-ttl">{row.name}</div>
                  <div className="prd-subtxt">{row.sku ? `${row.sku} · ` : ""}{row.id}</div>
                </div>
                <div className="prd-subtxt">{row.catalog || "—"}</div>
                <div className="prd-subtxt">{row.vendor || "—"}</div>
                <div className="prd-ttl">{fmtMoney(row.price)}</div>
                <div className={`stock-val ${row.status === "out" ? "err" : row.status === "low" ? "warn" : "ok"}`}>
                  {Math.round(row.stock)}
                </div>
                <div>
                  <span className={statusClass(row.status)}>{statusLabel(row.status)}</span>
                </div>
                <div className="act-cell">
                  <button
                    className="btn-xs"
                    title="Ver detalle"
                    onClick={() => setViewProd(row)}
                  >
                    Ver
                  </button>
                  <button
                    className="btn-xs edit"
                    title="Editar producto"
                    onClick={() => setEditProd(row)}
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {viewProd && (
        <ViewModal product={viewProd} onClose={() => setViewProd(null)} />
      )}
      {editProd && (
        <EditModal
          product={editProd}
          onClose={() => setEditProd(null)}
          onSaved={handleProductSaved}
        />
      )}
    </>
  );
}
