import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import vendorProductService from "../../services/odoo/vendorProductService";
import { downloadBrandedExcel } from "../../utils/brandedExcel";
import useCurrency from "../../hooks/useCurrency";
import { formatMoney } from "../../utils/formatCurrency";

// ─── Iconos ───────────────────────────────────────────────────────────────────
const IcoPlus    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoFilter  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const IcoEdit    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoTrash   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
const IcoEye     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoMore    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
const IcoGrid    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const IcoList    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IcoX       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoChevron = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoCheck   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoCopy    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IcoDownload= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoArrow   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const IcoEmpty   = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;

// ─── Datos mock ───────────────────────────────────────────────────────────────
const MOCK = [
  { id:1,  name:"Vestido Floral Verano",   sku:"VFV-001", catalog:"Nova Style",      category:"Moda",        price:1850,  stock:8,   sold:128, status:"active",   img:"👗", clr:"#f43f5e", featured:true  },
  { id:2,  name:"Blazer Oversize Gris",    sku:"BOG-002", catalog:"Nova Style",      category:"Moda",        price:3200,  stock:14,  sold:89,  status:"active",   img:"🧥", clr:"#64748b", featured:false },
  { id:3,  name:"Tenis Running Nike Air",  sku:"TNA-003", catalog:"FitLife Store",   category:"Deportes",    price:6500,  stock:3,   sold:67,  status:"active",   img:"👟", clr:"#f97316", featured:true  },
  { id:4,  name:"Sérum Vitamina C",        sku:"SVC-004", catalog:"Glam Beauty Box", category:"Belleza",     price:1850,  stock:22,  sold:55,  status:"active",   img:"🧴", clr:"#ec4899", featured:false },
  { id:5,  name:"Jeans Slim Azul",         sku:"JSA-005", catalog:"Nova Style",      category:"Moda",        price:1950,  stock:0,   sold:48,  status:"inactive", img:"👖", clr:"#1d4ed8", featured:false },
  { id:6,  name:"Set Yoga Premium",        sku:"SYP-006", catalog:"FitLife Store",   category:"Deportes",    price:3400,  stock:5,   sold:41,  status:"active",   img:"🧘", clr:"#7c3aed", featured:false },
  { id:7,  name:"Café Orgánico Especial",  sku:"COE-007", catalog:"Gourmet RD",      category:"Alimentos",   price:680,   stock:34,  sold:38,  status:"active",   img:"☕", clr:"#92400e", featured:false },
  { id:8,  name:"Perfume Bloom 50ml",      sku:"PB-008",  catalog:"Glam Beauty Box", category:"Belleza",     price:4200,  stock:7,   sold:29,  status:"active",   img:"🌸", clr:"#db2777", featured:true  },
  { id:9,  name:"Silla Ergonómica Pro",    sku:"SEP-009", catalog:"Casa & Deco",     category:"Hogar",       price:12800, stock:2,   sold:18,  status:"active",   img:"🪑", clr:"#0369a1", featured:false },
  { id:10, name:"Mochila Travel 40L",      sku:"MT-010",  catalog:"FitLife Store",   category:"Deportes",    price:3600,  stock:11,  sold:22,  status:"draft",    img:"🎒", clr:"#16a34a", featured:false },
  { id:11, name:"Camiseta Lino Premium",   sku:"CLP-011", catalog:"Nova Style",      category:"Moda",        price:980,   stock:0,   sold:15,  status:"inactive", img:"👕", clr:"#ca8a04", featured:false },
  { id:12, name:"Altavoz Bluetooth JBL",   sku:"ABJ-012", catalog:"Tech Plus",       category:"Electrónica", price:4800,  stock:6,   sold:33,  status:"active",   img:"🔊", clr:"#0f172a", featured:false },
];

const CATEGORIES = ["Todas", "Moda", "Deportes", "Belleza", "Alimentos", "Hogar", "Electrónica"];
const CATALOGS   = ["Todos", "Nova Style", "FitLife Store", "Glam Beauty Box", "Gourmet RD", "Casa & Deco", "Tech Plus"];
const STATUSES   = ["Todos", "Activo", "Inactivo", "Borrador"];
const SORT_OPTS  = [
  { val:"sold_desc",  label:"Más vendidos"    },
  { val:"name_az",    label:"Nombre A–Z"      },
  { val:"name_za",    label:"Nombre Z–A"      },
  { val:"price_asc",  label:"Precio: menor"   },
  { val:"price_desc", label:"Precio: mayor"   },
  { val:"stock_asc",  label:"Stock: menor"    },
];
const STATUS_CFG = {
  active:   { label:"Activo",   bg:"#f0fdf4", clr:"#16a34a", dot:"#16a34a" },
  inactive: { label:"Inactivo", bg:"#fef2f2", clr:"#ef4444", dot:"#ef4444" },
  draft:    { label:"Borrador", bg:"#f8fafc", clr:"#64748b", dot:"#94a3b8" },
};



// ─── Confirm delete dialog ────────────────────────────────────────────────────
function DeleteDialog({ name, onConfirm, onCancel }) {
  return (
    <div className="vpx-overlay" onClick={onCancel}>
      <div className="vpx-dialog" onClick={e => e.stopPropagation()}>
        <div className="vpx-d-ico">🗑️</div>
        <h3 className="vpx-d-title">Eliminar producto</h3>
        <p className="vpx-d-msg">¿Seguro que deseas eliminar <strong>{name}</strong>? Esta acción no se puede deshacer.</p>
        <div className="vpx-d-btns">
          <button className="vpx-d-cancel"  onClick={onCancel}>Cancelar</button>
          <button className="vpx-d-confirm" onClick={onConfirm}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Row context menu ─────────────────────────────────────────────────────────
function RowMenu({ product, onEdit, onView, onDuplicate, onToggle, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="vpx-rmenu" ref={ref}>
      <button className="vpx-rm-item" onClick={() => { onView();      onClose(); }}><IcoEye  />Ver detalle</button>
      <button className="vpx-rm-item" onClick={() => { onEdit();      onClose(); }}><IcoEdit />Editar</button>
      <button className="vpx-rm-item" onClick={() => { onDuplicate(); onClose(); }}><IcoCopy />Duplicar</button>
      <button className="vpx-rm-item" onClick={() => { onToggle();    onClose(); }}>
        {product.status === "active" ? <><IcoX />Desactivar</> : <><IcoCheck />Activar</>}
      </button>
      <div className="vpx-rm-sep"/>
      <button className="vpx-rm-item danger" onClick={() => { onDelete(); onClose(); }}><IcoTrash />Eliminar</button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Products() {
  const navigate = useNavigate();
  const { byCode } = useCurrency();
  const fmt = (n, currency = "DOP") => formatMoney(n, currency, { maximumFractionDigits: 2, byCode });

  const [ready,      setReady     ] = useState(false);
  const [data,       setData      ] = useState([]);
  const [loading,    setLoading   ] = useState(false);
  const [error,      setError     ] = useState("");
  const [query,      setQuery     ] = useState("");
  const [category,   setCategory  ] = useState("Todas");
  const [catalog,    setCatalog   ] = useState("Todos");
  const [statusFil,  setStatusFil ] = useState("Todos");
  const [sort,       setSort      ] = useState("sold_desc");
  const [view,       setView      ] = useState("list");
  const [selected,   setSelected  ] = useState(new Set());
  const [menuOpen,   setMenuOpen  ] = useState(null);
  const [toDelete,   setToDelete  ] = useState(null);
  const [sortOpen,   setSortOpen  ] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const sortRef   = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => { setTimeout(() => setReady(true), 60); }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await vendorProductService.list();
      setData(rows);
    } catch (err) {
      setData([]);
      setError(err?.message || "No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const h = e => {
      if (sortRef.current   && !sortRef.current.contains(e.target))   setSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Filtro + ordenado ──
  const filtered = data
    .filter(p => {
      const q = query.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      if (category !== "Todas" && p.category !== category) return false;
      if (catalog  !== "Todos" && p.catalog  !== catalog)  return false;
      if (statusFil !== "Todos") {
        const map = { Activo:"active", Inactivo:"inactive", Borrador:"draft" };
        if (p.status !== map[statusFil]) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "name_az")    return a.name.localeCompare(b.name);
      if (sort === "name_za")    return b.name.localeCompare(a.name);
      if (sort === "price_asc")  return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "stock_asc")  return a.stock - b.stock;
      return b.sold - a.sold;
    });

  const hasFilters = query || category !== "Todas" || catalog !== "Todos" || statusFil !== "Todos";
  const clearFilters = () => { setQuery(""); setCategory("Todas"); setCatalog("Todos"); setStatusFil("Todos"); };

  // ── Selección ──
  const toggleSel   = id => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll   = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));
  const allChecked  = selected.size > 0 && selected.size === filtered.length;
  const someChecked = selected.size > 0 && selected.size < filtered.length;

  // ── Acciones ──
  const doDelete = async (id) => {
    try {
      await vendorProductService.remove(id);
      setSelected(s => { const n = new Set(s); n.delete(id); return n; });
      await loadProducts();
    } catch (err) {
      setError(err?.message || "No se pudo eliminar el producto.");
    } finally {
      setToDelete(null);
    }
  };

  const doDuplicate = async (p) => {
    try {
      await vendorProductService.create({
        name: `${p.name} (copia)`,
        sku: `${p.sku}-C`,
        price: p.price,
        category: p.category,
        catalog: p.catalog,
        status: "draft",
      });
      await loadProducts();
    } catch (err) {
      setError(err?.message || "No se pudo duplicar el producto.");
    }
  };

  const doToggle = async (id) => {
    const current = data.find(p => String(p.id) === String(id));
    const nextStatus = current && current.status === "active" ? "inactive" : "active";
    try {
      await vendorProductService.update(id, { status: nextStatus });
      await loadProducts();
    } catch (err) {
      setError(err?.message || "No se pudo actualizar el estado.");
    }
  };
  const doBulkDel = async () => {
    setLoading(true);
    try {
      await Promise.all(Array.from(selected).map(id => vendorProductService.remove(id)));
      setSelected(new Set());
      await loadProducts();
    } catch (err) {
      setError("Ocurrió un error al eliminar algunos productos.");
      setLoading(false);
    }
  };

  const doBulkAct = async () => {
    setLoading(true);
    try {
      await Promise.all(Array.from(selected).map(id => vendorProductService.update(id, { status: "active" })));
      setSelected(new Set());
      await loadProducts();
    } catch (err) {
      setError("Ocurrió un error al activar algunos productos.");
      setLoading(false);
    }
  };

  const exportExcelLegacy = () => {
    const rows = selected.size ? filtered.filter(p => selected.has(p.id)) : filtered;
    if (!rows.length) {
      setError("No hay productos para exportar.");
      return;
    }
    setError("");
    const esc = (val) => String(val ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const header = ["ID","Nombre","SKU","Catálogo","Categoría","Precio","Stock","Estado","Vendidos"];
    const bodyRows = rows.map(p => ([
      p.id,
      p.name,
      p.sku,
      p.catalog,
      p.category,
      p.price,
      p.stock,
      p.status,
      p.sold ?? 0,
    ].map(esc)));
    const table = `
      <table border="1" cellpadding="6" cellspacing="0">
        <thead>
          <tr style="background:#f1f5f9;font-weight:700;">
            ${header.map(h => `<th>${esc(h)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${bodyRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    `;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${table}</body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `productos_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const rows = selected.size ? filtered.filter((p) => selected.has(p.id)) : filtered;
    if (!rows.length) {
      setError("No hay productos para exportar.");
      return;
    }
    setError("");

    const statusLabel = (s) => {
      if (s === "active") return "Activo";
      if (s === "inactive") return "Inactivo";
      if (s === "draft") return "Borrador";
      return s || "-";
    };

    const date = new Date().toISOString().slice(0, 10);
    downloadBrandedExcel({
      filename: `productos_${date}.xls`,
      sheetName: "Productos",
      reportTitle: "Reporte de Productos",
      columns: [
        { key: "id", label: "ID", className: "td num" },
        { key: "name", label: "Nombre" },
        { key: "sku", label: "SKU" },
        { key: "catalog", label: "Catalogo" },
        { key: "category", label: "Categoria" },
        { key: "price", label: "Precio", className: "td num" },
        { key: "stock", label: "Stock", className: "td num" },
        { key: "status", label: "Estado", format: (_, row) => statusLabel(row.status) },
        { key: "sold", label: "Vendidos", className: "td num", format: (_, row) => row.sold ?? 0 },
      ],
      rows,
    });
  };

  const sortLabel  = SORT_OPTS.find(o => o.val === sort)?.label;
  const activeFiltersCount = (category !== "Todas" ? 1 : 0) + (catalog !== "Todos" ? 1 : 0) + (statusFil !== "Todos" ? 1 : 0);

  // Resumen KPIs
  const kpis = [
    { label:"Activos",    val: data.filter(p => p.status === "active").length,           bg:"#f0fdf4", clr:"#16a34a", dot:"#16a34a" },
    { label:"Inactivos",  val: data.filter(p => p.status === "inactive").length,         bg:"#fef2f2", clr:"#ef4444", dot:"#ef4444" },
    { label:"Borradores", val: data.filter(p => p.status === "draft").length,            bg:"#f8fafc", clr:"#64748b", dot:"#94a3b8" },
    { label:"Stock bajo", val: data.filter(p => p.stock > 0 && p.stock <= 5).length,    bg:"#fffbeb", clr:"#d97706", dot:"#d97706" },
    { label:"Sin stock",  val: data.filter(p => p.stock === 0).length,                  bg:"#fef2f2", clr:"#ef4444", dot:"#ef4444" },
  ];

  return (
    <>
      <style>{`
        /* ── Variables heredadas de VendorLayout ── */
        .vpx { opacity:0; transform:translateY(6px); transition:opacity .35s ease, transform .35s ease; }
        .vpx.in { opacity:1; transform:translateY(0); }

        /* ── Header ── */
        .vpx-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:18px; }
        .vpx-h1  { font-family:'Lexend',sans-serif; font-size:clamp(18px,2.2vw,24px); font-weight:800; color:var(--vs-900); letter-spacing:-.5px; margin-bottom:3px; }
        .vpx-sub { font-size:12.5px; color:var(--vs-400); font-weight:500; }
        .vpx-header-r { display:flex; gap:8px; flex-wrap:wrap; }

        /* ── Botones ── */
        .vpx-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:10px; font-size:13px; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; transition:all .18s; white-space:nowrap; }
        .vpx-btn-ghost   { border:1.5px solid var(--vs-200); background:var(--vw); color:var(--vs-600); }
        .vpx-btn-ghost:hover { border-color:var(--vt-400); color:var(--vt-600); }
        .vpx-btn-primary { border:none; background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); color:white; box-shadow:0 3px 12px rgba(6,182,212,.28); }
        .vpx-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(6,182,212,.38); }

        /* ── KPI chips ── */
        .vpx-kpis { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
        .vpx-kpi  { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:100px; border:1px solid; font-size:11.5px; font-weight:700; }
        .vpx-kpi-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .vpx-kpi-n   { font-family:'Lexend',sans-serif; font-size:13px; font-weight:800; }

        /* ── Toolbar ── */
        .vpx-toolbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
        .vpx-search-wrap  { flex:1; min-width:180px; max-width:320px; position:relative; }
        .vpx-search-ico   { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--vs-400); display:flex; pointer-events:none; }
        .vpx-search-input { width:100%; padding:10px 36px 10px 38px; border:1.5px solid var(--vs-200); border-radius:11px; background:var(--vw); font-size:13.5px; font-weight:500; color:var(--vs-800); font-family:'Nunito',sans-serif; outline:none; transition:all .2s; }
        .vpx-search-input::placeholder { color:var(--vs-400); font-weight:400; }
        .vpx-search-input:focus { border-color:var(--vt-500); box-shadow:0 0 0 3px rgba(6,182,212,.1); }
        .vpx-search-x { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--vs-400); display:flex; padding:3px; border-radius:5px; transition:color .15s; }
        .vpx-search-x:hover { color:var(--vs-700); }
        .vpx-toolbar-r { display:flex; align-items:center; gap:8px; margin-left:auto; }

        /* ── Dropdown ── */
        .vpx-dd-wrap { position:relative; }
        .vpx-dd-btn  { display:inline-flex; align-items:center; gap:6px; padding:9px 13px; border-radius:10px; border:1.5px solid var(--vs-200); background:var(--vw); font-size:13px; font-weight:700; color:var(--vs-600); font-family:'Nunito',sans-serif; cursor:pointer; transition:all .18s; white-space:nowrap; }
        .vpx-dd-btn:hover, .vpx-dd-btn.open { border-color:var(--vt-400); color:var(--vt-600); background:rgba(6,182,212,.04); }
        .vpx-dd-badge { background:var(--vt-500); color:white; font-size:10px; font-weight:800; padding:1px 6px; border-radius:100px; }
        .vpx-dropdown { position:absolute; top:calc(100% + 6px); left:0; min-width:190px; background:var(--vw); border:1px solid var(--vs-200); border-radius:14px; box-shadow:0 12px 40px rgba(15,23,42,.12); z-index:100; overflow:hidden; animation:vpxdd .15s ease; }
        .vpx-dropdown.right { left:auto; right:0; }
        @keyframes vpxdd { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .vpx-dd-section { padding:5px; }
        .vpx-dd-lbl  { font-size:9.5px; font-weight:800; color:var(--vs-400); text-transform:uppercase; letter-spacing:.9px; padding:8px 10px 4px; }
        .vpx-dd-item { display:flex; align-items:center; justify-content:space-between; width:100%; padding:9px 10px; border-radius:9px; border:none; background:none; font-size:13px; font-weight:600; color:var(--vs-700); cursor:pointer; font-family:'Nunito',sans-serif; transition:background .13s; text-align:left; }
        .vpx-dd-item:hover { background:var(--vs-50); }
        .vpx-dd-item.sel  { background:rgba(6,182,212,.07); color:var(--vt-600); font-weight:700; }
        .vpx-dd-checkmark { width:17px; height:17px; border-radius:5px; background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .vpx-dd-sep  { height:1px; background:var(--vs-100); margin:4px 8px; }

        /* ── Vista toggle ── */
        .vpx-view-wrap { display:flex; background:var(--vs-100); border-radius:9px; padding:3px; gap:2px; border:1px solid var(--vs-200); }
        .vpx-v-btn { width:32px; height:32px; border-radius:7px; border:none; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--vs-400); transition:all .15s; }
        .vpx-v-btn.act { background:var(--vw); color:var(--vs-700); box-shadow:0 1px 4px rgba(15,23,42,.1); }

        /* ── Bulk bar ── */
        .vpx-bulk { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:10px 16px; background:rgba(6,182,212,.06); border:1px solid rgba(6,182,212,.2); border-radius:12px; margin-bottom:12px; animation:vpxbulk .2s ease; }
        @keyframes vpxbulk { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
        .vpx-bulk-info { font-size:13px; font-weight:700; color:var(--vt-700); flex:1; min-width:0; }
        .vpx-bulk-n    { font-family:'Lexend',sans-serif; color:var(--vt-500); }
        .vpx-bulk-btn  { display:inline-flex; align-items:center; gap:6px; padding:7px 13px; border-radius:9px; border:1.5px solid; font-size:12.5px; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; transition:all .15s; }
        .vpx-bulk-btn.green { border-color:rgba(22,163,74,.3); background:rgba(22,163,74,.08); color:#16a34a; }
        .vpx-bulk-btn.green:hover { background:rgba(22,163,74,.14); }
        .vpx-bulk-btn.red   { border-color:rgba(239,68,68,.25); background:rgba(239,68,68,.07); color:#ef4444; }
        .vpx-bulk-btn.red:hover { background:rgba(239,68,68,.13); }
        .vpx-bulk-x { background:none; border:none; cursor:pointer; color:var(--vs-400); display:flex; padding:4px; border-radius:6px; transition:color .15s; }
        .vpx-bulk-x:hover { color:var(--vs-700); }

        /* ── Tabla ── */
        .vpx-card { background:var(--vw); border-radius:18px; border:1px solid var(--vs-200); box-shadow:0 2px 8px rgba(15,23,42,.04); overflow:hidden; }
        .vpx-thead { display:grid; grid-template-columns:36px 46px 1fr 110px 88px 88px 85px 88px 44px; align-items:center; gap:10px; padding:9px 18px; background:var(--vs-50); border-bottom:1px solid var(--vs-200); }
        .vpx-th { font-size:9.5px; font-weight:800; color:var(--vs-400); text-transform:uppercase; letter-spacing:.8px; white-space:nowrap; }
        .vpx-tr { display:grid; grid-template-columns:36px 46px 1fr 110px 88px 88px 85px 88px 44px; align-items:center; gap:10px; padding:13px 18px; border-bottom:1px solid var(--vs-50); transition:background .13s; }
        .vpx-tr:last-child { border-bottom:none; }
        .vpx-tr:hover { background:var(--vs-50); }
        .vpx-tr.sel   { background:rgba(6,182,212,.04); }

        @media(max-width:1000px) {
          .vpx-thead,.vpx-tr { grid-template-columns:36px 46px 1fr 85px 88px 44px !important; }
          .vpx-th-cat,.vpx-td-cat,.vpx-th-sold,.vpx-td-sold { display:none !important; }
        }
        @media(max-width:640px) {
          .vpx-thead,.vpx-tr { grid-template-columns:36px 1fr 85px 44px !important; }
          .vpx-th-img,.vpx-td-img,.vpx-th-price,.vpx-td-price,.vpx-th-stock,.vpx-td-stock { display:none !important; }
        }

        /* Checkbox */
        .vpx-chk { width:17px; height:17px; border-radius:5px; border:1.5px solid var(--vs-300); cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .15s; background:var(--vw); }
        .vpx-chk.on   { background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); border-color:transparent; box-shadow:0 2px 6px rgba(6,182,212,.3); }
        .vpx-chk.half { background:rgba(6,182,212,.15); border-color:var(--vt-400); }

        /* Thumbnail */
        .vpx-thumb { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:19px; flex-shrink:0; overflow:hidden; }
        .vpx-thumb-img { width:100%; height:100%; object-fit:cover; display:block; }

        /* Nombre + SKU */
        .vpx-name  { font-size:13.5px; font-weight:700; color:var(--vs-800); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer; transition:color .14s; }
        .vpx-name:hover { color:var(--vt-600); }
        .vpx-sku   { font-size:10.5px; color:var(--vs-400); font-weight:500; margin-top:1px; font-family:monospace; letter-spacing:.3px; }
        .vpx-feat  { display:inline-flex; align-items:center; gap:2px; font-size:9px; font-weight:800; color:#d97706; background:#fef3c7; border-radius:100px; padding:1px 6px; margin-left:5px; vertical-align:middle; }

        /* Precio */
        .vpx-price { font-family:'Lexend',sans-serif; font-size:13.5px; font-weight:800; color:var(--vs-900); white-space:nowrap; text-align:right; }

        /* Stock */
        .vpx-stock     { text-align:right; }
        .vpx-stock-n   { font-family:'Lexend',sans-serif; font-size:13.5px; font-weight:800; }
        .vpx-stock-n.ok  { color:#16a34a; }
        .vpx-stock-n.low { color:#d97706; }
        .vpx-stock-n.out { color:#ef4444; }
        .vpx-stock-tag { font-size:9.5px; color:var(--vs-400); display:block; margin-top:1px; }

        /* Vendidos */
        .vpx-sold { font-family:'Lexend',sans-serif; font-size:13px; font-weight:700; color:var(--vs-700); text-align:right; }

        /* Badge estado */
        .vpx-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 11px; border-radius:100px; font-size:11px; font-weight:700; white-space:nowrap; }
        .vpx-badge-dot { width:5px; height:5px; border-radius:50%; }

        /* Acciones fila */
        .vpx-acts { display:flex; align-items:center; gap:2px; }
        .vpx-act  { width:28px; height:28px; border-radius:7px; border:none; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--vs-300); transition:all .13s; }
        .vpx-act:hover        { background:var(--vs-100); color:var(--vs-600); }
        .vpx-act.edit:hover   { background:rgba(6,182,212,.1);  color:var(--vt-600); }
        .vpx-act.trash:hover  { background:rgba(239,68,68,.1); color:#ef4444; }
        .vpx-more-wrap { position:relative; }

        /* Row menu */
        .vpx-rmenu { position:absolute; top:calc(100% + 4px); right:0; width:160px; background:var(--vw); border:1px solid var(--vs-200); border-radius:13px; box-shadow:0 8px 28px rgba(15,23,42,.12); z-index:50; overflow:hidden; padding:5px; animation:vpxdd .14s ease; }
        .vpx-rm-item { display:flex; align-items:center; gap:9px; width:100%; padding:9px 10px; border-radius:8px; border:none; background:none; font-size:13px; font-weight:600; color:var(--vs-700); cursor:pointer; font-family:'Nunito',sans-serif; transition:background .13s; text-align:left; }
        .vpx-rm-item:hover { background:var(--vs-50); color:var(--vs-900); }
        .vpx-rm-item.danger { color:#ef4444; }
        .vpx-rm-item.danger:hover { background:rgba(239,68,68,.07); }
        .vpx-rm-sep  { height:1px; background:var(--vs-100); margin:4px 8px; }

        /* ── Vista grid ── */
        .vpx-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px,1fr)); gap:14px; padding:16px; }
        .vpx-gc   { border:1.5px solid var(--vs-200); border-radius:15px; overflow:hidden; background:var(--vw); transition:all .2s; cursor:pointer; }
        .vpx-gc:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(15,23,42,.08); border-color:var(--vt-300); }
        .vpx-gc.sel   { border-color:var(--vt-500); box-shadow:0 0 0 3px rgba(6,182,212,.14); }
        .vpx-gc-top   { height:115px; display:flex; align-items:center; justify-content:center; font-size:44px; position:relative; overflow:hidden; }
        .vpx-gc-chk   { position:absolute; top:10px; left:10px; }
        .vpx-gc-st    { position:absolute; top:10px; right:10px; }
        .vpx-gc-body  { padding:12px; }
        .vpx-gc-name  { font-size:13px; font-weight:700; color:var(--vs-800); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
        .vpx-gc-sku   { font-size:10px; color:var(--vs-400); font-family:monospace; margin-bottom:8px; }
        .vpx-gc-row   { display:flex; align-items:center; justify-content:space-between; }
        .vpx-gc-price { font-family:'Lexend',sans-serif; font-size:14px; font-weight:800; color:var(--vs-900); }
        .vpx-gc-stk   { font-size:12px; font-weight:700; }
        .vpx-gc-btns  { display:flex; gap:6px; padding:10px 12px; border-top:1px solid var(--vs-100); background:var(--vs-50); }
        .vpx-gc-btn   { flex:1; padding:7px; border-radius:8px; border:1.5px solid var(--vs-200); background:var(--vw); font-size:12px; font-weight:700; color:var(--vs-600); font-family:'Nunito',sans-serif; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px; transition:all .15s; }
        .vpx-gc-btn:hover { border-color:var(--vt-400); color:var(--vt-600); }
        .vpx-gc-btn.pri { background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); border-color:transparent; color:white; }
        .vpx-gc-btn.pri:hover { box-shadow:0 3px 10px rgba(6,182,212,.3); transform:none; }

        /* ── Empty state ── */
        .vpx-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:60px 24px; }
        .vpx-empty-ico   { color:var(--vs-300); }
        .vpx-empty-title { font-family:'Lexend',sans-serif; font-size:15px; font-weight:800; color:var(--vs-600); }
        .vpx-empty-sub   { font-size:13px; color:var(--vs-400); }

        /* ── Footer ── */
        .vpx-foot { display:flex; align-items:center; justify-content:space-between; padding:11px 18px; border-top:1px solid var(--vs-100); background:var(--vs-50); flex-wrap:wrap; gap:8px; }
        .vpx-foot-info { font-size:12.5px; color:var(--vs-400); font-weight:500; }
        .vpx-foot-info strong { color:var(--vs-700); font-weight:700; }
        .vpx-foot-clr  { font-size:12px; font-weight:700; color:var(--vt-600); background:none; border:none; cursor:pointer; font-family:'Nunito',sans-serif; transition:color .15s; padding:0; }
        .vpx-foot-clr:hover { color:var(--vt-400); }

        /* ── Confirm modal ── */
        .vpx-overlay { position:fixed; inset:0; background:rgba(15,23,42,.55); backdrop-filter:blur(5px); z-index:200; display:flex; align-items:center; justify-content:center; animation:vpxfade .18s ease; }
        @keyframes vpxfade { from{opacity:0} to{opacity:1} }
        .vpx-dialog { background:var(--vw); border-radius:20px; padding:28px 28px 24px; max-width:370px; width:90%; text-align:center; animation:vpxscale .18s ease; box-shadow:0 24px 60px rgba(15,23,42,.2); }
        @keyframes vpxscale { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .vpx-d-ico     { font-size:36px; margin-bottom:12px; }
        .vpx-d-title   { font-family:'Lexend',sans-serif; font-size:17px; font-weight:800; color:var(--vs-900); margin-bottom:8px; }
        .vpx-d-msg     { font-size:13.5px; color:var(--vs-500); line-height:1.65; margin-bottom:20px; }
        .vpx-d-btns    { display:flex; gap:10px; }
        .vpx-d-cancel  { flex:1; padding:11px; border-radius:11px; border:1.5px solid var(--vs-200); background:var(--vw); font-size:13.5px; font-weight:700; color:var(--vs-600); font-family:'Nunito',sans-serif; cursor:pointer; transition:all .15s; }
        .vpx-d-cancel:hover  { border-color:var(--vs-400); }
        .vpx-d-confirm { flex:1; padding:11px; border-radius:11px; border:none; background:linear-gradient(135deg,#ef4444,#dc2626); color:white; font-size:13.5px; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; box-shadow:0 3px 12px rgba(239,68,68,.28); transition:all .15s; }
        .vpx-d-confirm:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(239,68,68,.38); }
      `}</style>

      {toDelete && <DeleteDialog name={toDelete.name} onConfirm={() => doDelete(toDelete.id)} onCancel={() => setToDelete(null)} />}

      <div className={`vpx${ready ? " in" : ""}`}>

        {/* ── HEADER ── */}
        <div className="vpx-header">
          <div>
            <h1 className="vpx-h1">Productos</h1>
            <p className="vpx-sub">{data.length} productos en total</p>
          </div>
          <div className="vpx-header-r">
            <button className="vpx-btn vpx-btn-ghost" onClick={exportExcel}><IcoDownload />Exportar</button>
            <button className="vpx-btn vpx-btn-primary" onClick={() => navigate("/vendor/products/new")}>
              <IcoPlus />Nuevo producto
            </button>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="vpx-kpis">
          {kpis.map(k => (
            <div key={k.label} className="vpx-kpi" style={{ background:k.bg, color:k.clr, borderColor: k.bg === "#f8fafc" ? "var(--vs-200)" : "transparent" }}>
              <span className="vpx-kpi-dot" style={{ background:k.dot }}/>
              <span className="vpx-kpi-n">{k.val}</span>
              <span>{k.label}</span>
            </div>
          ))}
        </div>

        {/* ── TOOLBAR ── */}
        <div className="vpx-toolbar">
          <div className="vpx-search-wrap">
            <span className="vpx-search-ico"><IcoSearch /></span>
            <input className="vpx-search-input" placeholder="Nombre o SKU..." value={query} onChange={e => setQuery(e.target.value)} />
            {query && <button className="vpx-search-x" onClick={() => setQuery("")}><IcoX /></button>}
          </div>

          {/* Filtros */}
          <div className="vpx-dd-wrap" ref={filterRef}>
            <button className={`vpx-dd-btn${filterOpen ? " open" : ""}`} onClick={() => setFilterOpen(v => !v)}>
              <IcoFilter />Filtros
              {activeFiltersCount > 0 && <span className="vpx-dd-badge">{activeFiltersCount}</span>}
              <IcoChevron />
            </button>
            {filterOpen && (
              <div className="vpx-dropdown" style={{ minWidth:210 }}>
                <div className="vpx-dd-section">
                  <div className="vpx-dd-lbl">Categoría</div>
                  {CATEGORIES.map(c => (
                    <button key={c} className={`vpx-dd-item${category === c ? " sel" : ""}`} onClick={() => setCategory(c)}>
                      {c}{category === c && <span className="vpx-dd-checkmark"><IcoCheck /></span>}
                    </button>
                  ))}
                </div>
                <div className="vpx-dd-sep"/>
                <div className="vpx-dd-section">
                  <div className="vpx-dd-lbl">Estado</div>
                  {STATUSES.map(s => (
                    <button key={s} className={`vpx-dd-item${statusFil === s ? " sel" : ""}`} onClick={() => setStatusFil(s)}>
                      {s}{statusFil === s && <span className="vpx-dd-checkmark"><IcoCheck /></span>}
                    </button>
                  ))}
                </div>
                <div className="vpx-dd-sep"/>
                <div className="vpx-dd-section">
                  <div className="vpx-dd-lbl">Catálogo</div>
                  {CATALOGS.map(c => (
                    <button key={c} className={`vpx-dd-item${catalog === c ? " sel" : ""}`} onClick={() => setCatalog(c)}>
                      {c}{catalog === c && <span className="vpx-dd-checkmark"><IcoCheck /></span>}
                    </button>
                  ))}
                </div>
                {hasFilters && (
                  <>
                    <div className="vpx-dd-sep"/>
                    <div className="vpx-dd-section">
                      <button className="vpx-dd-item" style={{ color:"#ef4444" }} onClick={() => { clearFilters(); setFilterOpen(false); }}>
                        <IcoX />Limpiar filtros
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="vpx-toolbar-r">
            {/* Ordenar */}
            <div className="vpx-dd-wrap" ref={sortRef}>
              <button className={`vpx-dd-btn${sortOpen ? " open" : ""}`} onClick={() => setSortOpen(v => !v)}>
                {sortLabel}<IcoChevron />
              </button>
              {sortOpen && (
                <div className="vpx-dropdown right">
                  <div className="vpx-dd-section">
                    {SORT_OPTS.map(o => (
                      <button key={o.val} className={`vpx-dd-item${sort === o.val ? " sel" : ""}`} onClick={() => { setSort(o.val); setSortOpen(false); }}>
                        {o.label}{sort === o.val && <span className="vpx-dd-checkmark"><IcoCheck /></span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vista */}
            <div className="vpx-view-wrap">
              <button className={`vpx-v-btn${view === "list" ? " act" : ""}`} onClick={() => setView("list")}><IcoList /></button>
              <button className={`vpx-v-btn${view === "grid" ? " act" : ""}`} onClick={() => setView("grid")}><IcoGrid /></button>
            </div>
          </div>
        </div>

        {/* ── BULK BAR ── */}
        {selected.size > 0 && (
          <div className="vpx-bulk">
            <span className="vpx-bulk-info">
              <span className="vpx-bulk-n">{selected.size}</span> producto{selected.size > 1 ? "s" : ""} seleccionado{selected.size > 1 ? "s" : ""}
            </span>
            <button className="vpx-bulk-btn green" onClick={doBulkAct}><IcoCheck />Activar</button>
            <button className="vpx-bulk-btn red"   onClick={doBulkDel}><IcoTrash />Eliminar</button>
            <button className="vpx-bulk-x" onClick={() => setSelected(new Set())}><IcoX /></button>
          </div>
        )}

        {/* ── CARD CONTENIDO ── */}
        <div className="vpx-card">

          {error && (
            <div style={{ padding: "10px 16px", color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="vpx-empty">
              <div className="vpx-empty-ico"><IcoEmpty /></div>
              <span className="vpx-empty-title">Cargando productos...</span>
            </div>

          ) : filtered.length === 0 ? (
            <div className="vpx-empty">
              <div className="vpx-empty-ico"><IcoEmpty /></div>
              <span className="vpx-empty-title">{hasFilters ? "Sin resultados" : "Sin productos aún"}</span>
              <span className="vpx-empty-sub">{hasFilters ? "Prueba con otros filtros o búsqueda" : "Crea tu primer producto para comenzar"}</span>
              {hasFilters
                ? <button className="vpx-btn vpx-btn-ghost" onClick={clearFilters}><IcoX />Limpiar filtros</button>
                : <button className="vpx-btn vpx-btn-primary" onClick={() => navigate("/vendor/products/new")}><IcoPlus />Crear producto</button>
              }
            </div>

          ) : view === "list" ? (
            <>
              {/* Cabecera tabla */}
              <div className="vpx-thead">
                <div className={`vpx-chk${allChecked ? " on" : someChecked ? " half" : ""}`} onClick={toggleAll} style={{ cursor:"pointer" }}>
                  {(allChecked || someChecked) && <IcoCheck style={{ color: allChecked ? "white" : "var(--vt-500)" }}/>}
                </div>
                <span className="vpx-th vpx-th-img">Img</span>
                <span className="vpx-th">Producto</span>
                <span className="vpx-th vpx-th-cat">Catálogo</span>
                <span className="vpx-th vpx-th-price" style={{ textAlign:"right" }}>Precio</span>
                <span className="vpx-th vpx-th-stock" style={{ textAlign:"right" }}>Stock</span>
                <span className="vpx-th vpx-th-sold"  style={{ textAlign:"right" }}>Vendidos</span>
                <span className="vpx-th">Estado</span>
                <span className="vpx-th"/>
              </div>

              {/* Filas */}
              {filtered.map(p => {
                const st  = STATUS_CFG[p.status];
                const chk = selected.has(p.id);
                const stockClass = p.stock === 0 ? "out" : p.stock <= 5 ? "low" : "ok";
                const stockTag   = p.stock === 0 ? "Agotado" : p.stock <= 5 ? "Stock bajo" : "En stock";
                return (
                  <div key={p.id} className={`vpx-tr${chk ? " sel" : ""}`}>
                    <div className={`vpx-chk${chk ? " on" : ""}`} onClick={() => toggleSel(p.id)} style={{ cursor:"pointer" }}>
                      {chk && <IcoCheck style={{ color:"white" }}/>}
                    </div>
                    <div className="vpx-td-img">
                      <div className="vpx-thumb" style={{ background:`${p.clr}18` }}>
                        {String(p.img || "").startsWith("data:")
                          ? <img className="vpx-thumb-img" src={p.img} alt={p.name} />
                          : <span>{p.img}</span>
                        }
                      </div>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div className="vpx-name" onClick={() => navigate(`/vendor/products/${p.id}/edit`)} title={p.name}>
                        {p.name}
                        {p.featured && <span className="vpx-feat">⭐ Destacado</span>}
                      </div>
                      <div className="vpx-sku">{p.sku}</div>
                    </div>
                    <div className="vpx-td-cat" style={{ fontSize:12.5, color:"var(--vs-500)", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {p.catalog}
                    </div>
                    <div className="vpx-td-price">
                            <span className="vpx-price">{fmt(p.price, p.currency)}</span>
                    </div>
                    <div className="vpx-td-stock vpx-stock">
                      <span className={`vpx-stock-n ${stockClass}`}>{p.stock}</span>
                      <span className="vpx-stock-tag">{stockTag}</span>
                    </div>
                    <div className="vpx-td-sold">
                      <span className="vpx-sold">{p.sold}</span>
                    </div>
                    <div>
                      <span className="vpx-badge" style={{ background:st.bg, color:st.clr }}>
                        <span className="vpx-badge-dot" style={{ background:st.dot }}/>
                        {st.label}
                      </span>
                    </div>
                    <div className="vpx-acts">
                      <button className="vpx-act edit"  title="Editar"   onClick={() => navigate(`/vendor/products/${p.id}/edit`)}><IcoEdit /></button>
                      <button className="vpx-act trash" title="Eliminar" onClick={() => setToDelete(p)}><IcoTrash /></button>
                      <div className="vpx-more-wrap">
                        <button className="vpx-act" onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}><IcoMore /></button>
                        {menuOpen === p.id && (
                          <RowMenu
                            product={p}
                            onView={()      => navigate(`/vendor/products/${p.id}`)}
                            onEdit={()      => navigate(`/vendor/products/${p.id}/edit`)}
                            onDuplicate={()  => doDuplicate(p)}
                            onToggle={()     => doToggle(p.id)}
                            onDelete={()     => setToDelete(p)}
                            onClose={()      => setMenuOpen(null)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Footer */}
              <div className="vpx-foot">
                <span className="vpx-foot-info">
                  Mostrando <strong>{filtered.length}</strong> de <strong>{data.length}</strong> productos
                </span>
                {hasFilters && (
                  <button className="vpx-foot-clr" onClick={clearFilters}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            </>

          ) : (
            /* Vista grid */
            <>
              <div className="vpx-grid">
                {filtered.map(p => {
                  const st  = STATUS_CFG[p.status];
                  const chk = selected.has(p.id);
                  const stockClass = p.stock === 0 ? "out" : p.stock <= 5 ? "low" : "ok";
                  return (
                    <div key={p.id} className={`vpx-gc${chk ? " sel" : ""}`}>
                      <div className="vpx-gc-top" style={{ background:`${p.clr}12` }}>
                        {String(p.img || "").startsWith("data:")
                          ? <img className="vpx-thumb-img" src={p.img} alt={p.name} />
                          : <span>{p.img}</span>
                        }
                        <div className="vpx-gc-chk">
                          <div className={`vpx-chk${chk ? " on" : ""}`} onClick={() => toggleSel(p.id)} style={{ cursor:"pointer" }}>
                            {chk && <IcoCheck style={{ color:"white" }}/>}
                          </div>
                        </div>
                        <div className="vpx-gc-st">
                          <span className="vpx-badge" style={{ background:st.bg, color:st.clr, fontSize:10 }}>
                            <span className="vpx-badge-dot" style={{ background:st.dot }}/>{st.label}
                          </span>
                        </div>
                      </div>
                      <div className="vpx-gc-body">
                        <div className="vpx-gc-name" title={p.name}>{p.name}</div>
                        <div className="vpx-gc-sku">{p.sku}</div>
                        <div className="vpx-gc-row">
                          <span className="vpx-gc-price">{fmt(p.price, p.currency)}</span>
                          <span className={`vpx-gc-stk vpx-stock-n ${stockClass}`}>
                            {p.stock === 0 ? "Agotado" : `${p.stock} ud.`}
                          </span>
                        </div>
                      </div>
                      <div className="vpx-gc-btns">
                        <button className="vpx-gc-btn" onClick={() => setToDelete(p)}><IcoTrash /></button>
                        <button className="vpx-gc-btn pri" onClick={() => navigate(`/vendor/products/${p.id}/edit`)}>
                          <IcoEdit />Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="vpx-foot">
                <span className="vpx-foot-info">
                  Mostrando <strong>{filtered.length}</strong> de <strong>{data.length}</strong> productos
                </span>
                {hasFilters && <button className="vpx-foot-clr" onClick={clearFilters}>Limpiar filtros</button>}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
