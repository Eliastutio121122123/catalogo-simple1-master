import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { vendorCatalogService } from "../../services/odoo/vendorCatalogService";
import { toImageDataUrl } from "../../utils/imageDataUrl";

// ─── Iconos ───────────────────────────────────────────────────────────────────
const IcoPlus    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoEdit    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoTrash   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
const IcoEye     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoMore    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
const IcoGrid    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const IcoList    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IcoX       = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoChevron = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoCheck   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoCopy    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IcoLink    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IcoArrow   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const IcoBooks   = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IcoStar    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoQR      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3"/><rect x="16" y="5" width="3" height="3"/><rect x="16" y="16" width="3" height="3"/><rect x="5" y="16" width="3" height="3"/></svg>;
const IcoFilter  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_CATALOGS = [
  {
    id:1, name:"Nova Style", slug:"nova-style", category:"Moda",
    description:"Colección de moda femenina contemporánea con tendencias actuales.",
    cover:"🛍️", clr:"#f43f5e",
    products:32, activeProducts:28,
    views:1248, orders:89, revenue:148600,
    rating:4.8, reviews:124,
    status:"active", featured:true, shared:true,
    createdAt:"2024-11-02", updatedAt:"2025-01-28",
  },
  {
    id:2, name:"FitLife Store", slug:"fitlife-store", category:"Deportes",
    description:"Equipamiento y ropa deportiva para tu estilo de vida activo.",
    cover:"🏋️", clr:"#06b6d4",
    products:18, activeProducts:16,
    views:842, orders:54, revenue:96400,
    rating:4.6, reviews:67,
    status:"active", featured:true, shared:true,
    createdAt:"2024-11-15", updatedAt:"2025-01-25",
  },
  {
    id:3, name:"Glam Beauty Box", slug:"glam-beauty", category:"Belleza",
    description:"Productos de belleza y cuidado personal de marcas premium.",
    cover:"💄", clr:"#ec4899",
    products:24, activeProducts:20,
    views:960, orders:71, revenue:82300,
    rating:4.9, reviews:89,
    status:"active", featured:false, shared:true,
    createdAt:"2024-12-01", updatedAt:"2025-01-22",
  },
  {
    id:4, name:"Gourmet RD", slug:"gourmet-rd", category:"Alimentos",
    description:"Productos gourmet y artesanales de la gastronomía dominicana.",
    cover:"🍽️", clr:"#d97706",
    products:15, activeProducts:15,
    views:412, orders:38, revenue:26160,
    rating:4.7, reviews:42,
    status:"active", featured:false, shared:false,
    createdAt:"2025-01-05", updatedAt:"2025-01-20",
  },
  {
    id:5, name:"Casa & Deco", slug:"casa-deco", category:"Hogar",
    description:"Decoración y mobiliario para transformar tu hogar.",
    cover:"🪴", clr:"#16a34a",
    products:9, activeProducts:7,
    views:280, orders:12, revenue:38400,
    rating:4.4, reviews:18,
    status:"inactive", featured:false, shared:false,
    createdAt:"2025-01-10", updatedAt:"2025-01-18",
  },
  {
    id:6, name:"Tech Plus", slug:"tech-plus", category:"Electrónica",
    description:"Los mejores gadgets y accesorios tecnológicos del mercado.",
    cover:"💻", clr:"#1d4ed8",
    products:6, activeProducts:0,
    views:0, orders:0, revenue:0,
    rating:0, reviews:0,
    status:"draft", featured:false, shared:false,
    createdAt:"2025-01-28", updatedAt:"2025-01-28",
  },
];

const CATEGORIES = ["Todas", "Moda", "Deportes", "Belleza", "Alimentos", "Hogar", "Electrónica"];
const STATUSES   = ["Todos", "Activo", "Inactivo", "Borrador"];
const SORT_OPTS  = [
  { val:"revenue_desc", label:"Más ingresos"    },
  { val:"orders_desc",  label:"Más pedidos"     },
  { val:"views_desc",   label:"Más visitas"     },
  { val:"name_az",      label:"Nombre A–Z"      },
  { val:"products_desc",label:"Más productos"   },
  { val:"newest",       label:"Más reciente"    },
];

const STATUS_CFG = {
  active:   { label:"Activo",   bg:"#f0fdf4", clr:"#16a34a", dot:"#16a34a" },
  inactive: { label:"Inactivo", bg:"#fef2f2", clr:"#ef4444", dot:"#ef4444" },
  draft:    { label:"Borrador", bg:"#f8fafc", clr:"#64748b", dot:"#94a3b8" },
};

const fmt = n => "RD$" + (n || 0).toLocaleString("es-DO");

// ─── Delete dialog ────────────────────────────────────────────────────────────
function DeleteDialog({ name, onConfirm, onCancel }) {
  return (
    <div className="vc-overlay" onClick={onCancel}>
      <div className="vc-dialog" onClick={e => e.stopPropagation()}>
        <div className="vc-d-ico">📚</div>
        <h3 className="vc-d-title">Eliminar catálogo</h3>
        <p className="vc-d-msg">¿Seguro que deseas eliminar <strong>{name}</strong>? Se perderán todos los datos del catálogo. Los productos seguirán disponibles.</p>
        <div className="vc-d-btns">
          <button className="vc-d-cancel"  onClick={onCancel}>Cancelar</button>
          <button className="vc-d-confirm" onClick={onConfirm}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Context menu ─────────────────────────────────────────────────────────────
function RowMenu({ catalog, onEdit, onView, onDuplicate, onToggle, onDelete, onCopyLink, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { 
      if (e.target.closest('.vc-more-btn') || e.target.closest('.vc-list-more-btn')) return;
      if (ref.current && !ref.current.contains(e.target)) onClose(); 
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="vc-rmenu" ref={ref}>
      <button className="vc-rm-item" onClick={() => { onView();      onClose(); }}><IcoEye  />Ver catálogo</button>
      <button className="vc-rm-item" onClick={() => { onEdit();      onClose(); }}><IcoEdit />Editar</button>
      <button className="vc-rm-item" onClick={() => { onDuplicate(); onClose(); }}><IcoCopy />Duplicar</button>
      <button className="vc-rm-item" onClick={() => { onCopyLink();  onClose(); }}><IcoLink />Copiar enlace</button>
      <button className="vc-rm-item" onClick={() => { onToggle();    onClose(); }}>
        {catalog.status === "active" ? <><IcoX />Desactivar</> : <><IcoCheck />Activar</>}
      </button>
      <div className="vc-rm-sep"/>
      <button className="vc-rm-item danger" onClick={() => { onDelete(); onClose(); }}><IcoTrash />Eliminar</button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Catalogs() {
  const navigate = useNavigate();

  const [ready,      setReady     ] = useState(false);
  const [data,       setData      ] = useState([]);
  const [loading,    setLoading   ] = useState(true);
  const [apiError,   setApiError  ] = useState("");
  const [query,      setQuery     ] = useState("");
  const [category,   setCategory  ] = useState("Todas");
  const [statusFil,  setStatusFil ] = useState("Todos");
  const [sort,       setSort      ] = useState("revenue_desc");
  const [view,       setView      ] = useState("grid");
  const [menuOpen,   setMenuOpen  ] = useState(null);
  const [toDelete,   setToDelete  ] = useState(null);
  const [sortOpen,   setSortOpen  ] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [copied,     setCopied    ] = useState(null);
  const [qrMap,      setQrMap     ] = useState({});
  const [qrErrors,   setQrErrors  ] = useState({});

  const sortRef   = useRef(null);
  const filterRef = useRef(null);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://catalogix.com";
  const catalogPublicUrl = (cat) => `${baseUrl}/catalog/${cat?.id || cat?.slug}`;

  useEffect(() => { setTimeout(() => setReady(true), 60); }, []);

  const mapCatalog = raw => {
    const name = raw?.name || "";
    const slug = raw?.slug || name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60);
    const imageUrl = raw?.image_url || toImageDataUrl(raw?.image_1920) || "";
    return {
      id: raw?.id,
      name,
      slug,
      category: raw?.category || "General",
      description: raw?.description || "",
      imageUrl,
      cover: raw?.cover || "📚",
      clr: raw?.clr || "#06b6d4",
      products: raw?.product_count ?? 0,
      activeProducts: raw?.product_count ?? 0,
      views: 0,
      orders: 0,
      revenue: 0,
      rating: 0,
      reviews: 0,
      status: raw?.active ? "active" : "inactive",
      featured: false,
      shared: true,
      createdAt: raw?.create_date || new Date().toISOString(),
      updatedAt: raw?.write_date || new Date().toISOString(),
    };
  };

  const loadCatalogs = async () => {
    setLoading(true);
    setApiError("");
    try {
      const rows = await vendorCatalogService.list();
      setData((rows || []).map(mapCatalog));
    } catch (err) {
      setApiError(err?.message || "Error cargando catálogos");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    const h = e => {
      if (sortRef.current   && !sortRef.current.contains(e.target))   setSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!data.length) return;
    const pending = data.filter(c => c?.id && !qrMap[c.id] && !qrErrors[c.id]);
    if (!pending.length) return;
    let active = true;
    (async () => {
      const results = await Promise.all(
        pending.map(async c => {
          try {
            const url = catalogPublicUrl(c);
            const qr = await QRCode.toDataURL(url, { width: 140, margin: 1, errorCorrectionLevel: "M" });
            return { id: c.id, qr };
          } catch (err) {
            return { id: c.id, error: err?.message || "No se pudo generar el QR." };
          }
        })
      );
      if (!active) return;
      setQrMap(prev => {
        const next = { ...prev };
        results.forEach(r => { if (r.qr) next[r.id] = r.qr; });
        return next;
      });
      setQrErrors(prev => {
        const next = { ...prev };
        results.forEach(r => { if (r.error) next[r.id] = r.error; });
        return next;
      });
    })();
    return () => { active = false; };
  }, [data, qrMap, qrErrors, baseUrl]);

  // ── Filtrar + ordenar ──
  const filtered = data
    .filter(c => {
      const q = query.toLowerCase();
      if (q && !c.name.toLowerCase().includes(q) && !c.category.toLowerCase().includes(q)) return false;
      if (category !== "Todas" && c.category !== category) return false;
      if (statusFil !== "Todos") {
        const map = { Activo:"active", Inactivo:"inactive", Borrador:"draft" };
        if (c.status !== map[statusFil]) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "name_az")       return a.name.localeCompare(b.name);
      if (sort === "revenue_desc")  return b.revenue - a.revenue;
      if (sort === "orders_desc")   return b.orders - a.orders;
      if (sort === "views_desc")    return b.views - a.views;
      if (sort === "products_desc") return b.products - a.products;
      if (sort === "newest")        return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const hasFilters = query || category !== "Todas" || statusFil !== "Todos";
  const clearFilters = () => { setQuery(""); setCategory("Todas"); setStatusFil("Todos"); };
  const activeFiltersCount = (category !== "Todas" ? 1 : 0) + (statusFil !== "Todos" ? 1 : 0);
  const emptyTitle = loading ? "Cargando catálogos..." : (hasFilters ? "Sin resultados" : "Sin catálogos aún");
  const emptySub = loading
    ? "Estamos consultando tus catálogos."
    : (hasFilters ? "Prueba con otros filtros" : "Crea tu primer catálogo para empezar a vender");

  // ── Acciones ──
  const doDelete = async id => {
    try {
      await vendorCatalogService.remove(id);
      await loadCatalogs();
    } catch (err) {
      setApiError(err?.message || "Error eliminando catálogo");
    } finally {
      setToDelete(null);
    }
  };

  const doDuplicate = async cat => {
    try {
      await vendorCatalogService.create({
        name: `${cat.name} (copia)`,
        category: cat.category || "",
        description: cat.description || "",
        status: "draft",
      });
      await loadCatalogs();
    } catch (err) {
      setApiError(err?.message || "Error duplicando catálogo");
    }
  };

  const doToggle = async id => {
    const current = data.find(c => c.id === id);
    if (!current) return;
    const nextStatus = current.status === "active" ? "inactive" : "active";
    try {
      await vendorCatalogService.patch(id, { status: nextStatus });
      await loadCatalogs();
    } catch (err) {
      setApiError(err?.message || "Error actualizando catálogo");
    }
  };
  const doCopyLink  = cat => {
    navigator.clipboard.writeText(catalogPublicUrl(cat)).catch(() => {});
    setCopied(cat.id);
    setTimeout(() => setCopied(null), 2000);
  };
  const downloadQr = cat => {
    const qr = qrMap[cat.id];
    if (!qr) return;
    const filename = `qr-${cat.slug || cat.id}.png`;
    const link = document.createElement("a");
    link.href = qr;
    link.download = filename;
    link.click();
  };

  const sortLabel = SORT_OPTS.find(o => o.val === sort)?.label;

  // KPIs globales
  const totalRevenue  = data.reduce((s, c) => s + c.revenue, 0);
  const totalOrders   = data.reduce((s, c) => s + c.orders, 0);
  const totalViews    = data.reduce((s, c) => s + c.views, 0);
  const totalProducts = data.reduce((s, c) => s + c.products, 0);

  return (
    <>
      <style>{`
        .vc { opacity:0; transform:translateY(6px); transition:opacity .35s ease, transform .35s ease; }
        .vc.in { opacity:1; transform:translateY(0); }
        .vc-error-banner { margin:4px 0 14px; padding:10px 14px; border-radius:12px; background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; font-size:13px; font-weight:600; font-family:'Nunito',sans-serif; display:flex; align-items:center; gap:8px; }

        /* ── Header ── */
        .vc-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
        .vc-h1  { font-family:'Lexend',sans-serif; font-size:clamp(18px,2.2vw,24px); font-weight:800; color:var(--vs-900); letter-spacing:-.5px; margin-bottom:3px; }
        .vc-sub { font-size:12.5px; color:var(--vs-400); font-weight:500; }
        .vc-header-r { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
        .vc-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:10px; font-size:13px; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; transition:all .18s; white-space:nowrap; }
        .vc-btn-ghost { border:1.5px solid var(--vs-200); background:var(--vw); color:var(--vs-600); }
        .vc-btn-ghost:hover { border-color:var(--vt-400); color:var(--vt-600); }
        .vc-btn-primary { border:none; background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); color:white; box-shadow:0 3px 12px rgba(6,182,212,.28); }
        .vc-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(6,182,212,.38); }

        /* ── KPIs globales ── */
        .vc-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
        @media(max-width:860px) { .vc-kpis { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:480px) { .vc-kpis { grid-template-columns:1fr 1fr; } }
        .vc-kpi { background:var(--vw); border:1px solid var(--vs-200); border-radius:14px; padding:16px 18px; box-shadow:0 1px 4px rgba(15,23,42,.04); }
        .vc-kpi-ico { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; margin-bottom:10px; }
        .vc-kpi-n   { font-family:'Lexend',sans-serif; font-size:22px; font-weight:800; color:var(--vs-900); letter-spacing:-.5px; line-height:1; margin-bottom:4px; }
        .vc-kpi-lbl { font-size:12px; color:var(--vs-400); font-weight:500; }

        /* ── Toolbar ── */
        .vc-toolbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
        .vc-search-wrap  { flex:1; min-width:180px; max-width:310px; position:relative; }
        .vc-search-ico   { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--vs-400); display:flex; pointer-events:none; }
        .vc-search-input { width:100%; padding:10px 35px 10px 38px; border:1.5px solid var(--vs-200); border-radius:11px; background:var(--vw); font-size:13.5px; font-weight:500; color:var(--vs-800); font-family:'Nunito',sans-serif; outline:none; transition:all .2s; }
        .vc-search-input::placeholder { color:var(--vs-400); font-weight:400; }
        .vc-search-input:focus { border-color:var(--vt-500); box-shadow:0 0 0 3px rgba(6,182,212,.1); }
        .vc-search-x { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--vs-400); display:flex; padding:3px; border-radius:5px; transition:color .15s; }
        .vc-search-x:hover { color:var(--vs-700); }
        .vc-toolbar-r { display:flex; align-items:center; gap:8px; margin-left:auto; }

        /* ── Dropdowns ── */
        .vc-dd-wrap { position:relative; }
        .vc-dd-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 13px; border-radius:10px; border:1.5px solid var(--vs-200); background:var(--vw); font-size:13px; font-weight:700; color:var(--vs-600); font-family:'Nunito',sans-serif; cursor:pointer; transition:all .18s; white-space:nowrap; }
        .vc-dd-btn:hover, .vc-dd-btn.open { border-color:var(--vt-400); color:var(--vt-600); background:rgba(6,182,212,.04); }
        .vc-dd-badge { background:var(--vt-500); color:white; font-size:10px; font-weight:800; padding:1px 6px; border-radius:100px; }
        .vc-dropdown { position:absolute; top:calc(100% + 6px); left:0; min-width:185px; background:var(--vw); border:1px solid var(--vs-200); border-radius:14px; box-shadow:0 12px 40px rgba(15,23,42,.12); z-index:100; overflow:hidden; animation:vcdd .15s ease; }
        .vc-dropdown.right { left:auto; right:0; }
        @keyframes vcdd { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .vc-dd-section { padding:5px; }
        .vc-dd-lbl  { font-size:9.5px; font-weight:800; color:var(--vs-400); text-transform:uppercase; letter-spacing:.9px; padding:8px 10px 4px; }
        .vc-dd-item { display:flex; align-items:center; justify-content:space-between; width:100%; padding:9px 10px; border-radius:9px; border:none; background:none; font-size:13px; font-weight:600; color:var(--vs-700); cursor:pointer; font-family:'Nunito',sans-serif; transition:background .13s; text-align:left; }
        .vc-dd-item:hover { background:var(--vs-50); }
        .vc-dd-item.sel { background:rgba(6,182,212,.07); color:var(--vt-600); font-weight:700; }
        .vc-dd-chk { width:17px; height:17px; border-radius:5px; background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .vc-dd-sep  { height:1px; background:var(--vs-100); margin:4px 8px; }

        /* ── Vista toggle ── */
        .vc-view-wrap { display:flex; background:var(--vs-100); border-radius:9px; padding:3px; gap:2px; border:1px solid var(--vs-200); }
        .vc-v-btn { width:32px; height:32px; border-radius:7px; border:none; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--vs-400); transition:all .15s; }
        .vc-v-btn.act { background:var(--vw); color:var(--vs-700); box-shadow:0 1px 4px rgba(15,23,42,.1); }

        /* ── Grid de catálogos ── */
        .vc-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px; }

        /* Tarjeta */
        .vc-card { position:relative; background:var(--vw); border:1.5px solid var(--vs-200); border-radius:18px; transition:all .22s; cursor:default; }
        .vc-card:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(15,23,42,.08); border-color:var(--vs-300); z-index:2; }
        .vc-card-cover { height:130px; display:flex; align-items:center; justify-content:center; font-size:52px; position:relative; background-position:center; background-size:cover; border-radius: 17px 17px 0 0; }
        .vc-card-badge-featured { position:absolute; top:10px; left:10px; display:flex; align-items:center; gap:4px; font-size:9.5px; font-weight:800; background:#fef9c3; color:#d97706; padding:3px 9px; border-radius:100px; border:1px solid #fde68a; }
        .vc-card-status { position:absolute; top:10px; right:10px; }
        .vc-card-body { padding:15px 17px 13px; }
        .vc-card-cat  { font-size:10px; font-weight:800; color:var(--vt-600); text-transform:uppercase; letter-spacing:.9px; margin-bottom:5px; }
        .vc-card-name { font-family:'Lexend',sans-serif; font-size:16px; font-weight:800; color:var(--vs-900); letter-spacing:-.3px; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .vc-card-desc { font-size:12.5px; color:var(--vs-400); line-height:1.55; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:13px; }
        .vc-card-meta { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; padding:12px 0; border-top:1px solid var(--vs-100); border-bottom:1px solid var(--vs-100); margin-bottom:13px; }
        .vc-meta-item { text-align:center; }
        .vc-meta-n    { font-family:'Lexend',sans-serif; font-size:16px; font-weight:800; color:var(--vs-900); line-height:1; }
        .vc-meta-lbl  { font-size:10px; color:var(--vs-400); margin-top:2px; }
        .vc-card-rating { display:flex; align-items:center; gap:4px; font-size:12px; font-weight:700; color:var(--vs-600); margin-bottom:12px; }
        .vc-rating-stars { color:#f59e0b; display:flex; gap:1px; }
        .vc-card-actions { display:flex; gap:7px; }
        .vc-card-btn { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; padding:8px; border-radius:10px; border:1.5px solid var(--vs-200); background:var(--vs-50); font-size:12.5px; font-weight:700; color:var(--vs-600); font-family:'Nunito',sans-serif; cursor:pointer; transition:all .16s; }
        .vc-card-btn:hover { border-color:var(--vt-400); color:var(--vt-600); background:rgba(6,182,212,.04); }
        .vc-card-btn.primary { background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); border-color:transparent; color:white; }
        .vc-card-btn.primary:hover { box-shadow:0 4px 12px rgba(6,182,212,.3); transform:translateY(-1px); background:linear-gradient(135deg,var(--vt-600),var(--vt-400)); color:white; }
        .vc-more-btn-wrap { position:relative; }
        .vc-more-btn { width:36px; height:36px; border-radius:10px; border:1.5px solid var(--vs-200); background:var(--vs-50); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--vs-400); transition:all .15s; flex-shrink:0; }
        .vc-more-btn:hover { border-color:var(--vs-400); color:var(--vs-700); }

        /* Badge estado */
        .vc-badge { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:100px; font-size:11px; font-weight:700; white-space:nowrap; }
        .vc-badge-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }

        /* ── Vista Lista ── */
        .vc-list-card { background:var(--vw); border-radius:18px; border:1px solid var(--vs-200); box-shadow:0 2px 8px rgba(15,23,42,.04); }
        .vc-list-head { display:grid; grid-template-columns:52px 1fr 90px 100px 90px 95px 90px 70px 50px; align-items:center; gap:10px; padding:9px 18px; background:var(--vs-50); border-bottom:1px solid var(--vs-200); border-radius: 17px 17px 0 0; }
        .vc-list-th   { font-size:9.5px; font-weight:800; color:var(--vs-400); text-transform:uppercase; letter-spacing:.8px; white-space:nowrap; }
        .vc-list-row  { position:relative; display:grid; grid-template-columns:52px 1fr 90px 100px 90px 95px 90px 70px 50px; align-items:center; gap:10px; padding:13px 18px; border-bottom:1px solid var(--vs-50); transition:background .13s; cursor:default; }
        .vc-list-row:last-child { border-bottom:none; }
        .vc-list-row:hover { background:var(--vs-50); z-index:2; }
        @media(max-width:1000px) {
          .vc-list-head,.vc-list-row { grid-template-columns:52px 1fr 90px 70px 50px !important; }
          .vc-lth-orders,.vc-ltd-orders,.vc-lth-views,.vc-ltd-views,.vc-lth-products,.vc-ltd-products { display:none !important; }
        }
        .vc-list-cover { width:46px; height:46px; border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; background-position:center; background-size:cover; overflow:hidden; }
        .vc-list-name  { font-size:13.5px; font-weight:700; color:var(--vs-800); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .vc-list-cat   { font-size:11px; color:var(--vs-400); font-weight:500; margin-top:1px; }
        .vc-list-n     { font-family:'Lexend',sans-serif; font-size:13.5px; font-weight:800; color:var(--vs-900); text-align:right; }
        .vc-list-sub   { font-size:10px; color:var(--vs-400); text-align:right; display:block; margin-top:1px; }
        .vc-list-acts  { display:flex; align-items:center; gap:2px; }
        .vc-list-act   { width:28px; height:28px; border-radius:7px; border:none; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--vs-300); transition:all .13s; }
        .vc-list-act:hover          { background:var(--vs-100); color:var(--vs-600); }
        .vc-list-act.edit:hover   { background:rgba(6,182,212,.1); color:var(--vt-600); }
        .vc-list-act.trash:hover  { background:rgba(239,68,68,.1); color:#ef4444; }
        .vc-list-more-wrap { position:relative; }

        /* â”€â”€ QR â”€â”€ */
        .vc-qr { display:flex; gap:10px; align-items:center; padding:8px 10px; border:1px dashed var(--vs-200); border-radius:12px; background:var(--vs-50); margin:10px 0 12px; }
        .vc-qr-img { width:72px; height:72px; border-radius:10px; background:white; border:1px solid var(--vs-200); object-fit:contain; }
        .vc-qr-ph { width:72px; height:72px; border-radius:10px; display:flex; align-items:center; justify-content:center; background:var(--vw); border:1px dashed var(--vs-200); color:var(--vs-400); font-size:11px; text-align:center; padding:6px; }
        .vc-qr-info { display:flex; flex-direction:column; gap:6px; min-width:0; }
        .vc-qr-title { font-size:12px; font-weight:800; color:var(--vs-700); }
        .vc-qr-sub { font-size:11.5px; color:var(--vs-400); }
        .vc-qr-btn { align-self:flex-start; padding:6px 10px; font-size:11.5px; border-radius:9px; border:1.5px solid var(--vs-200); background:var(--vw); font-weight:700; color:var(--vs-600); font-family:'Nunito',sans-serif; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
        .vc-qr-btn:disabled { opacity:.5; cursor:not-allowed; }
        .vc-list-qr { display:flex; align-items:center; justify-content:center; gap:6px; }
        .vc-list-qr-img { width:34px; height:34px; border-radius:8px; border:1px solid var(--vs-200); background:white; object-fit:contain; }
        .vc-list-qr-ph { width:34px; height:34px; border-radius:8px; border:1px dashed var(--vs-200); display:flex; align-items:center; justify-content:center; font-size:10px; color:var(--vs-400); background:var(--vw); }
        .vc-list-qr-btn { width:30px; height:30px; border-radius:8px; border:1.5px solid var(--vs-200); background:var(--vw); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--vs-600); }
        .vc-list-qr-btn:disabled { opacity:.5; cursor:not-allowed; }

        /* Row menu */
        .vc-rmenu { position:absolute; top:calc(100% + 4px); right:0; width:165px; background:var(--vw); border:1px solid var(--vs-200); border-radius:13px; box-shadow:0 8px 28px rgba(15,23,42,.12); z-index:200; overflow:hidden; padding:5px; animation:vcdd .14s ease; }
        .vc-rm-item { display:flex; align-items:center; gap:9px; width:100%; padding:9px 10px; border-radius:8px; border:none; background:none; font-size:13px; font-weight:600; color:var(--vs-700); cursor:pointer; font-family:'Nunito',sans-serif; transition:background .13s; text-align:left; }
        .vc-rm-item:hover { background:var(--vs-50); }
        .vc-rm-item.danger { color:#ef4444; }
        .vc-rm-item.danger:hover { background:rgba(239,68,68,.07); }
        .vc-rm-sep { height:1px; background:var(--vs-100); margin:4px 8px; }

        /* ── Copiado toast ── */
        .vc-copied-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--vs-900); color:white; font-size:13px; font-weight:700; padding:10px 20px; border-radius:100px; box-shadow:0 6px 24px rgba(15,23,42,.25); z-index:300; animation:vctoast .25s ease; font-family:'Nunito',sans-serif; display:flex; align-items:center; gap:8px; }
        @keyframes vctoast { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

        /* ── Empty ── */
        .vc-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:60px 24px; background:var(--vw); border-radius:18px; border:1px solid var(--vs-200); }
        .vc-empty-ico   { color:var(--vs-300); }
        .vc-empty-title { font-family:'Lexend',sans-serif; font-size:15px; font-weight:800; color:var(--vs-600); }
        .vc-empty-sub   { font-size:13px; color:var(--vs-400); }

        /* ── Footer ── */
        .vc-foot { display:flex; align-items:center; justify-content:space-between; padding:11px 18px; border-top:1px solid var(--vs-100); background:var(--vs-50); border-radius:0 0 18px 18px; flex-wrap:wrap; gap:8px; margin-top:-1px; }
        .vc-foot-info { font-size:12.5px; color:var(--vs-400); font-weight:500; }
        .vc-foot-info strong { color:var(--vs-700); font-weight:700; }

        /* ── Modal ── */
        .vc-overlay { position:fixed; inset:0; background:rgba(15,23,42,.55); backdrop-filter:blur(5px); z-index:200; display:flex; align-items:center; justify-content:center; animation:vcfade .18s ease; }
        @keyframes vcfade { from{opacity:0} to{opacity:1} }
        .vc-dialog  { background:var(--vw); border-radius:20px; padding:28px 28px 24px; max-width:380px; width:90%; text-align:center; animation:vcscale .18s ease; box-shadow:0 24px 60px rgba(15,23,42,.2); }
        @keyframes vcscale { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .vc-d-ico    { font-size:36px; margin-bottom:12px; }
        .vc-d-title  { font-family:'Lexend',sans-serif; font-size:17px; font-weight:800; color:var(--vs-900); margin-bottom:8px; }
        .vc-d-msg    { font-size:13.5px; color:var(--vs-500); line-height:1.65; margin-bottom:20px; }
        .vc-d-btns   { display:flex; gap:10px; }
        .vc-d-cancel  { flex:1; padding:11px; border-radius:11px; border:1.5px solid var(--vs-200); background:var(--vw); font-size:13.5px; font-weight:700; color:var(--vs-600); font-family:'Nunito',sans-serif; cursor:pointer; transition:all .15s; }
        .vc-d-cancel:hover { border-color:var(--vs-400); }
        .vc-d-confirm { flex:1; padding:11px; border-radius:11px; border:none; background:linear-gradient(135deg,#ef4444,#dc2626); color:white; font-size:13.5px; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; box-shadow:0 3px 12px rgba(239,68,68,.28); transition:all .15s; }
        .vc-d-confirm:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(239,68,68,.38); }
      `}</style>

      {toDelete && <DeleteDialog name={toDelete.name} onConfirm={() => doDelete(toDelete.id)} onCancel={() => setToDelete(null)} />}
      {copied && (
        <div className="vc-copied-toast">
          <IcoCheck />Enlace copiado al portapapeles
        </div>
      )}

      <div className={`vc${ready ? " in" : ""}`}>

        {/* ── HEADER ── */}
        <div className="vc-header">
          <div>
            <h1 className="vc-h1">Catálogos</h1>
            <p className="vc-sub">{data.length} catálogos en total</p>
          </div>
          <div className="vc-header-r">
            <button className="vc-btn vc-btn-ghost">
              <IcoQR />Ver QR
            </button>
            <button className="vc-btn vc-btn-primary" onClick={() => navigate("/vendor/catalogs/new")}>
              <IcoPlus />Nuevo catálogo
            </button>
          </div>
        </div>
        {apiError && (
          <div className="vc-error-banner">
            <IcoX />{apiError}
          </div>
        )}

        {/* ── KPIS ── */}
        <div className="vc-kpis">
          {[
            { ico:"📚", n:totalProducts, lbl:"Productos totales",   bg:"rgba(6,182,212,.08)",   ic:"var(--vt-600)"  },
            { ico:"📦", n:totalOrders,   lbl:"Pedidos totales",     bg:"rgba(37,99,235,.08)",   ic:"var(--vb-600)"  },
            { ico:"👁️", n:totalViews,    lbl:"Visitas totales",     bg:"rgba(124,58,237,.08)",  ic:"#7c3aed"        },
            { ico:"💰", n:fmt(totalRevenue), lbl:"Ingresos totales", bg:"rgba(22,163,74,.08)",  ic:"#16a34a", isStr:true },
          ].map((k, i) => (
            <div key={i} className="vc-kpi">
              <div className="vc-kpi-ico" style={{ background:k.bg, color:k.ic }}>{k.ico}</div>
              <div className="vc-kpi-n" style={{ fontSize: k.isStr ? 16 : 22 }}>{k.n}</div>
              <div className="vc-kpi-lbl">{k.lbl}</div>
            </div>
          ))}
        </div>

        {/* ── TOOLBAR ── */}
        <div className="vc-toolbar">
          <div className="vc-search-wrap">
            <span className="vc-search-ico"><IcoSearch /></span>
            <input className="vc-search-input" placeholder="Buscar catálogo..." value={query} onChange={e => setQuery(e.target.value)} />
            {query && <button className="vc-search-x" onClick={() => setQuery("")}><IcoX /></button>}
          </div>

          {/* Filtros */}
          <div className="vc-dd-wrap" ref={filterRef}>
            <button className={`vc-dd-btn${filterOpen ? " open" : ""}`} onClick={() => setFilterOpen(v => !v)}>
              <IcoFilter />Filtros
              {activeFiltersCount > 0 && <span className="vc-dd-badge">{activeFiltersCount}</span>}
              <IcoChevron />
            </button>
            {filterOpen && (
              <div className="vc-dropdown" style={{ minWidth:200 }}>
                <div className="vc-dd-section">
                  <div className="vc-dd-lbl">Categoría</div>
                  {CATEGORIES.map(c => (
                    <button key={c} className={`vc-dd-item${category === c ? " sel" : ""}`} onClick={() => setCategory(c)}>
                      {c}{category === c && <span className="vc-dd-chk"><IcoCheck /></span>}
                    </button>
                  ))}
                </div>
                <div className="vc-dd-sep"/>
                <div className="vc-dd-section">
                  <div className="vc-dd-lbl">Estado</div>
                  {STATUSES.map(s => (
                    <button key={s} className={`vc-dd-item${statusFil === s ? " sel" : ""}`} onClick={() => setStatusFil(s)}>
                      {s}{statusFil === s && <span className="vc-dd-chk"><IcoCheck /></span>}
                    </button>
                  ))}
                </div>
                {hasFilters && (
                  <>
                    <div className="vc-dd-sep"/>
                    <div className="vc-dd-section">
                      <button className="vc-dd-item" style={{ color:"#ef4444" }} onClick={() => { clearFilters(); setFilterOpen(false); }}>
                        <IcoX />Limpiar filtros
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="vc-toolbar-r">
            {/* Ordenar */}
            <div className="vc-dd-wrap" ref={sortRef}>
              <button className={`vc-dd-btn${sortOpen ? " open" : ""}`} onClick={() => setSortOpen(v => !v)}>
                {sortLabel}<IcoChevron />
              </button>
              {sortOpen && (
                <div className="vc-dropdown right">
                  <div className="vc-dd-section">
                    {SORT_OPTS.map(o => (
                      <button key={o.val} className={`vc-dd-item${sort === o.val ? " sel" : ""}`} onClick={() => { setSort(o.val); setSortOpen(false); }}>
                        {o.label}{sort === o.val && <span className="vc-dd-chk"><IcoCheck /></span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vista */}
            <div className="vc-view-wrap">
              <button className={`vc-v-btn${view === "grid" ? " act" : ""}`} onClick={() => setView("grid")}><IcoGrid /></button>
              <button className={`vc-v-btn${view === "list" ? " act" : ""}`} onClick={() => setView("list")}><IcoList /></button>
            </div>
          </div>
        </div>

        {/* ── CONTENIDO ── */}
        {filtered.length === 0 ? (
          <div className="vc-empty">
            <div className="vc-empty-ico"><IcoBooks /></div>
            <span className="vc-empty-title">{emptyTitle}</span>
            <span className="vc-empty-sub">{emptySub}</span>
            {hasFilters && !loading
              ? <button className="vc-btn vc-btn-ghost" onClick={clearFilters}><IcoX />Limpiar filtros</button>
              : (!loading && <button className="vc-btn vc-btn-primary" onClick={() => navigate("/vendor/catalogs/new")}><IcoPlus />Crear catálogo</button>)
            }
          </div>

        ) : view === "grid" ? (
          <>
            <div className="vc-grid">
              {filtered.map(cat => {
                const st = STATUS_CFG[cat.status];
                return (
                  <div key={cat.id} className="vc-card">
                    {/* Cover */}
                    <div
                      className="vc-card-cover"
                      style={{ background: cat.imageUrl ? `url(${cat.imageUrl}) center/cover no-repeat` : `${cat.clr}14` }}
                    >
                      {!cat.imageUrl && <span>{cat.cover}</span>}
                      {cat.featured && (
                        <div className="vc-card-badge-featured"><IcoStar />Destacado</div>
                      )}
                      <div className="vc-card-status">
                        <span className="vc-badge" style={{ background:st.bg, color:st.clr }}>
                          <span className="vc-badge-dot" style={{ background:st.dot }}/>{st.label}
                        </span>
                      </div>
                    </div>

                    {/* Cuerpo */}
                    <div className="vc-card-body">
                      <div className="vc-card-cat">{cat.category}</div>
                      <div className="vc-card-name" title={cat.name}>{cat.name}</div>
                      <div className="vc-card-desc">{cat.description}</div>

                      {/* Métricas */}
                      <div className="vc-card-meta">
                        <div className="vc-meta-item">
                          <div className="vc-meta-n">{cat.products}</div>
                          <div className="vc-meta-lbl">Productos</div>
                        </div>
                        <div className="vc-meta-item">
                          <div className="vc-meta-n">{cat.orders}</div>
                          <div className="vc-meta-lbl">Pedidos</div>
                        </div>
                        <div className="vc-meta-item">
                          <div className="vc-meta-n" style={{ fontSize:14 }}>{cat.revenue > 0 ? fmt(cat.revenue) : "—"}</div>
                          <div className="vc-meta-lbl">Ingresos</div>
                        </div>
                      </div>

                      {/* Rating */}
                      {cat.rating > 0 ? (
                        <div className="vc-card-rating">
                          <div className="vc-rating-stars">
                            {[1,2,3,4,5].map(i => (
                              <span key={i} style={{ opacity: i <= Math.round(cat.rating) ? 1 : .25 }}><IcoStar /></span>
                            ))}
                          </div>
                          <span>{cat.rating}</span>
                          <span style={{ color:"var(--vs-400)" }}>({cat.reviews} reseñas)</span>
                        </div>
                      ) : (
                        <div className="vc-card-rating" style={{ color:"var(--vs-300)" }}>Sin reseñas aún</div>
                      )}

                      {/* QR */}
                      <div className="vc-qr">
                        {qrMap[cat.id] ? (
                          <img className="vc-qr-img" src={qrMap[cat.id]} alt={`QR de ${cat.name}`} />
                        ) : (
                          <div className="vc-qr-ph">{qrErrors[cat.id] ? "QR no disponible" : "Generando QR..."}</div>
                        )}
                        <div className="vc-qr-info">
                          <div className="vc-qr-title">QR del catÃ¡logo</div>
                          <div className="vc-qr-sub">
                            {qrMap[cat.id] ? "Listo para compartir" : (qrErrors[cat.id] || "Generando...")}
                          </div>
                          <button className="vc-qr-btn" onClick={() => downloadQr(cat)} disabled={!qrMap[cat.id]}>
                            <IcoQR />Descargar QR
                          </button>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="vc-card-actions">
                        <button className="vc-card-btn" onClick={() => navigate(`/vendor/products?catalog=${cat.id}`)}>
                          <IcoEye />Ver productos
                        </button>
                        <button className="vc-card-btn primary" onClick={() => navigate(`/vendor/catalogs/${cat.id}/edit`)}>
                          <IcoEdit />Editar
                        </button>
                        <div className="vc-more-btn-wrap">
                          <button className="vc-more-btn" onClick={() => setMenuOpen(menuOpen === cat.id ? null : cat.id)}>
                            <IcoMore />
                          </button>
                          {menuOpen === cat.id && (
                            <RowMenu
                              catalog={cat}
                              onView={()      => navigate(`/vendor/products?catalog=${cat.id}`)}
                              onEdit={()      => navigate(`/vendor/catalogs/${cat.id}/edit`)}
                              onDuplicate={()  => doDuplicate(cat)}
                              onToggle={()     => doToggle(cat.id)}
                              onDelete={()     => setToDelete(cat)}
                              onCopyLink={()   => doCopyLink(cat)}
                              onClose={()      => setMenuOpen(null)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer grid */}
            <div className="vc-foot" style={{ background:"transparent", border:"none", paddingLeft:0, marginTop:8 }}>
              <span className="vc-foot-info">Mostrando <strong>{filtered.length}</strong> de <strong>{data.length}</strong> catálogos</span>
              {hasFilters && (
                <button style={{ fontSize:12, fontWeight:700, color:"var(--vt-600)", background:"none", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }} onClick={clearFilters}>
                  Limpiar filtros
                </button>
              )}
            </div>
          </>

        ) : (
          /* ── LISTA ── */
          <div className="vc-list-card">
            <div className="vc-list-head">
              <span className="vc-list-th">Catálogo</span>
              <span className="vc-list-th"/>
              <span className="vc-list-th vc-lth-products" style={{ textAlign:"right" }}>Productos</span>
              <span className="vc-list-th vc-lth-orders"   style={{ textAlign:"right" }}>Pedidos</span>
              <span className="vc-list-th vc-lth-views"    style={{ textAlign:"right" }}>Visitas</span>
              <span className="vc-list-th" style={{ textAlign:"right" }}>Ingresos</span>
              <span className="vc-list-th">Estado</span>
              <span className="vc-list-th" style={{ textAlign:"center" }}>QR</span>
              <span className="vc-list-th"/>
            </div>

            {filtered.map(cat => {
              const st = STATUS_CFG[cat.status];
              return (
                <div key={cat.id} className="vc-list-row">
                  <div
                    className="vc-list-cover"
                    style={{ background: cat.imageUrl ? `url(${cat.imageUrl}) center/cover no-repeat` : `${cat.clr}14` }}
                  >
                    {!cat.imageUrl && <span>{cat.cover}</span>}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div className="vc-list-name">{cat.name}</div>
                    <div className="vc-list-cat">{cat.category}</div>
                  </div>
                  <div className="vc-ltd-products" style={{ textAlign:"right" }}>
                    <div className="vc-list-n">{cat.products}</div>
                    <span className="vc-list-sub">{cat.activeProducts} activos</span>
                  </div>
                  <div className="vc-ltd-orders" style={{ textAlign:"right" }}>
                    <div className="vc-list-n">{cat.orders}</div>
                  </div>
                  <div className="vc-ltd-views" style={{ textAlign:"right" }}>
                    <div className="vc-list-n">{cat.views.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div className="vc-list-n" style={{ fontSize:13 }}>{cat.revenue > 0 ? fmt(cat.revenue) : "—"}</div>
                  </div>
                  <div>
                    <span className="vc-badge" style={{ background:st.bg, color:st.clr }}>
                      <span className="vc-badge-dot" style={{ background:st.dot }}/>{st.label}
                    </span>
                  </div>
                  <div className="vc-list-qr">
                    {qrMap[cat.id] ? (
                      <img className="vc-list-qr-img" src={qrMap[cat.id]} alt={`QR de ${cat.name}`} />
                    ) : (
                      <div className="vc-list-qr-ph">QR</div>
                    )}
                    <button className="vc-list-qr-btn" onClick={() => downloadQr(cat)} disabled={!qrMap[cat.id]}>
                      <IcoQR />
                    </button>
                  </div>
                  <div className="vc-list-acts">
                    <button className="vc-list-act edit"  onClick={() => navigate(`/vendor/catalogs/${cat.id}/edit`)}><IcoEdit /></button>
                    <button className="vc-list-act trash" onClick={() => setToDelete(cat)}><IcoTrash /></button>
                    <div className="vc-list-more-wrap">
                      <button className="vc-list-act vc-list-more-btn" onClick={() => setMenuOpen(menuOpen === cat.id ? null : cat.id)}><IcoMore /></button>
                      {menuOpen === cat.id && (
                        <RowMenu
                          catalog={cat}
                          onView={()      => navigate(`/vendor/products?catalog=${cat.id}`)}
                          onEdit={()      => navigate(`/vendor/catalogs/${cat.id}/edit`)}
                          onDuplicate={()  => doDuplicate(cat)}
                          onToggle={()     => doToggle(cat.id)}
                          onDelete={()     => setToDelete(cat)}
                          onCopyLink={()   => doCopyLink(cat)}
                          onClose={()      => setMenuOpen(null)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="vc-foot">
              <span className="vc-foot-info">Mostrando <strong>{filtered.length}</strong> de <strong>{data.length}</strong> catálogos</span>
              {hasFilters && (
                <button style={{ fontSize:12, fontWeight:700, color:"var(--vt-600)", background:"none", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }} onClick={clearFilters}>
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
