import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import couponService from "../../services/odoo/couponService";

const IcoPlus    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoEdit    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoTrash   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
const IcoCopy    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IcoCheck   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoX       = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoMore    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
const IcoChevron = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoTag     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const IcoFilter  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const IcoCoupon  = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 5H3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><path d="M21 12H3v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5z"/><line x1="12" y1="12" x2="12" y2="17"/></svg>;
const IcoPercent = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
const IcoClock   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoUsers   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

const STATUSES  = ["Todos", "Activo", "Inactivo", "Expirado"];
const TYPES     = ["Todos", "Porcentaje", "Monto fijo"];
const SORT_OPTS = [
  { val:"uses_desc",    label:"Más usados"    },
  { val:"newest",       label:"Más reciente"  },
  { val:"value_desc",   label:"Mayor valor"   },
  { val:"expires_soon", label:"Expiran pronto"},
  { val:"code_az",      label:"Código A–Z"    },
];

const STATUS_CFG = {
  active:   { label:"Activo",   bg:"#f0fdf4", clr:"#16a34a", dot:"#16a34a" },
  inactive: { label:"Inactivo", bg:"#fef2f2", clr:"#ef4444", dot:"#ef4444" },
  expired:  { label:"Expirado", bg:"#f8fafc", clr:"#64748b", dot:"#94a3b8" },
};

const fmt    = n => "RD$" + (n || 0).toLocaleString("es-DO");
const fmtVal = c => c.type === "percent" ? `${c.value}%` : fmt(c.value);

// ─── Delete dialog ────────────────────────────────────────────────────────────
function DeleteDialog({ code, onConfirm, onCancel }) {
  return (
    <div className="vc-overlay" onClick={onCancel}>
      <div className="vc-dialog" onClick={e => e.stopPropagation()}>
        <div className="vc-d-ico">🏷️</div>
        <h3 className="vc-d-title">Eliminar cupón</h3>
        <p className="vc-d-msg">¿Seguro que deseas eliminar el cupón <strong>{code}</strong>? Los clientes que lo tengan no podrán seguir usándolo.</p>
        <div className="vc-d-btns">
          <button className="vc-d-cancel"  onClick={onCancel}>Cancelar</button>
          <button className="vc-d-confirm" onClick={onConfirm}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Context menu ─────────────────────────────────────────────────────────────
function RowMenu({ coupon, onEdit, onDuplicate, onToggle, onDelete, onCopyCode, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="vc-rmenu" ref={ref}>
      <button className="vc-rm-item" onClick={() => { onEdit();      onClose(); }}><IcoEdit />Editar</button>
      <button className="vc-rm-item" onClick={() => { onDuplicate(); onClose(); }}><IcoCopy />Duplicar</button>
      <button className="vc-rm-item" onClick={() => { onCopyCode();  onClose(); }}><IcoCopy />Copiar código</button>
      <button className="vc-rm-item" onClick={() => { onToggle();    onClose(); }}>
        {coupon.status === "active" ? <><IcoX />Desactivar</> : <><IcoCheck />Activar</>}
      </button>
      <div className="vc-rm-sep"/>
      <button className="vc-rm-item danger" onClick={() => { onDelete(); onClose(); }}><IcoTrash />Eliminar</button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Coupons() {
  const navigate = useNavigate();

  const [ready,      setReady    ] = useState(false);
  const [data,       setData     ] = useState([]);
  const [query,      setQuery    ] = useState("");
  const [statusFil,  setStatusFil] = useState("Todos");
  const [typeFil,    setTypeFil  ] = useState("Todos");
  const [sort,       setSort     ] = useState("uses_desc");
  const [menuOpen,   setMenuOpen ] = useState(null);
  const [toDelete,   setToDelete ] = useState(null);
  const [sortOpen,   setSortOpen ] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [copied,     setCopied   ] = useState(null);

  const sortRef   = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setReady(true), 60);
    couponService.list().then(setData).catch(() => setData([]));
  }, []);

  useEffect(() => {
    const h = e => {
      if (sortRef.current   && !sortRef.current.contains(e.target))   setSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Filtrar + ordenar ──
  const filtered = data
    .filter(c => {
      const q = query.toLowerCase();
      if (q && !c.code.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false;
      if (statusFil !== "Todos") {
        const map = { Activo:"active", Inactivo:"inactive", Expirado:"expired" };
        if (c.status !== map[statusFil]) return false;
      }
      if (typeFil !== "Todos") {
        const map = { Porcentaje:"percent", "Monto fijo":"fixed" };
        if (c.type !== map[typeFil]) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "uses_desc")    return b.uses - a.uses;
      if (sort === "value_desc")   return b.value - a.value;
      if (sort === "code_az")      return a.code.localeCompare(b.code);
      if (sort === "expires_soon") {
        if (!a.expiresAt) return 1;
        if (!b.expiresAt) return -1;
        return new Date(a.expiresAt) - new Date(b.expiresAt);
      }
      return 0;
    });

  const hasFilters = query || statusFil !== "Todos" || typeFil !== "Todos";
  const clearFilters = () => { setQuery(""); setStatusFil("Todos"); setTypeFil("Todos"); };
  const activeFiltersCount = (statusFil !== "Todos" ? 1 : 0) + (typeFil !== "Todos" ? 1 : 0);

  // ── Acciones ──
  const refreshData = () => couponService.list().then(setData).catch(() => {});
  const doDelete    = async id => { await couponService.delete(id); await refreshData(); setToDelete(null); };
  const doDuplicate = async cp => { await couponService.duplicate(cp.id); await refreshData(); };
  const doToggle    = async id => { await couponService.toggleStatus(id); await refreshData(); };
  const doCopyCode  = cp  => {
    navigator.clipboard.writeText(cp.code).catch(() => {});
    setCopied(cp.id);
    setTimeout(() => setCopied(null), 2000);
  };

  // KPIs
  const totalActive  = data.filter(c => c.status === "active").length;
  const totalUses    = data.reduce((s, c) => s + c.uses, 0);
  const totalPercent = data.filter(c => c.type === "percent").length;
  const totalFixed   = data.filter(c => c.type === "fixed").length;

  const sortLabel = SORT_OPTS.find(o => o.val === sort)?.label;

  return (
    <>
      <style>{`
        .vc { opacity:0; transform:translateY(6px); transition:opacity .35s ease, transform .35s ease; }
        .vc.in { opacity:1; transform:translateY(0); }

        /* ── Header ── */
        .vc-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
        .vc-h1  { font-family:'Lexend',sans-serif; font-size:clamp(18px,2.2vw,24px); font-weight:800; color:var(--vs-900); letter-spacing:-.5px; margin-bottom:3px; }
        .vc-sub { font-size:12.5px; color:var(--vs-400); font-weight:500; }
        .vc-header-r { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
        .vc-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:10px; font-size:13px; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; transition:all .18s; white-space:nowrap; }
        .vc-btn-ghost   { border:1.5px solid var(--vs-200); background:var(--vw); color:var(--vs-600); }
        .vc-btn-ghost:hover { border-color:var(--vt-400); color:var(--vt-600); }
        .vc-btn-primary { border:none; background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); color:white; box-shadow:0 3px 12px rgba(6,182,212,.28); }
        .vc-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(6,182,212,.38); }

        /* ── KPIs ── */
        .vc-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
        @media(max-width:860px) { .vc-kpis { grid-template-columns:repeat(2,1fr); } }
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
        .vc-dropdown { position:absolute; top:calc(100% + 6px); right:0; min-width:200px; background:var(--vw); border:1px solid var(--vs-200); border-radius:14px; box-shadow:0 12px 40px rgba(15,23,42,.12); z-index:100; overflow:hidden; animation:vcdd .15s ease; }
        @keyframes vcdd { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .vc-dd-section { padding:5px; }
        .vc-dd-lbl  { font-size:9.5px; font-weight:800; color:var(--vs-400); text-transform:uppercase; letter-spacing:.9px; padding:8px 10px 4px; }
        .vc-dd-item { display:flex; align-items:center; justify-content:space-between; width:100%; padding:9px 10px; border-radius:9px; border:none; background:none; font-size:13px; font-weight:600; color:var(--vs-700); cursor:pointer; font-family:'Nunito',sans-serif; transition:background .13s; text-align:left; }
        .vc-dd-item:hover { background:var(--vs-50); }
        .vc-dd-item.sel { background:rgba(6,182,212,.07); color:var(--vt-600); font-weight:700; }
        .vc-dd-chk { width:17px; height:17px; border-radius:5px; background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .vc-dd-sep  { height:1px; background:var(--vs-100); margin:4px 8px; }

        /* ── Sort ── */
        .vc-sort-wrap { position:relative; }

        /* ── Tabla ── */
        .vc-list-card { background:var(--vw); border-radius:18px; border:1px solid var(--vs-200); box-shadow:0 2px 8px rgba(15,23,42,.04); overflow:hidden; }
        .vc-list-head { display:grid; grid-template-columns:1fr 90px 110px 90px 100px 110px 52px; align-items:center; gap:10px; padding:9px 18px; background:var(--vs-50); border-bottom:1px solid var(--vs-200); }
        .vc-list-th   { font-size:9.5px; font-weight:800; color:var(--vs-400); text-transform:uppercase; letter-spacing:.8px; white-space:nowrap; }
        .vc-list-row  { display:grid; grid-template-columns:1fr 90px 110px 90px 100px 110px 52px; align-items:center; gap:10px; padding:14px 18px; border-bottom:1px solid var(--vs-50); transition:background .13s; }
        .vc-list-row:last-child { border-bottom:none; }
        .vc-list-row:hover { background:var(--vs-50); }
        @media(max-width:1000px) {
          .vc-list-head,.vc-list-row { grid-template-columns:1fr 90px 110px 52px !important; }
          .vc-col-hide { display:none !important; }
        }

        /* Celda código */
        .vc-code-cell { display:flex; align-items:center; gap:11px; }
        .vc-code-ico  { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
        .vc-code-name { font-family:'Lexend',sans-serif; font-size:13.5px; font-weight:800; color:var(--vs-900); letter-spacing:.5px; }
        .vc-code-desc { font-size:12px; color:var(--vs-400); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px; }
        .vc-copy-btn  { background:none; border:none; cursor:pointer; color:var(--vs-400); display:flex; padding:3px; border-radius:5px; transition:color .15s; }
        .vc-copy-btn:hover { color:var(--vt-600); }
        .vc-copy-btn.done { color:#16a34a; }

        /* Badge tipo */
        .vc-type-badge { display:inline-flex; align-items:center; gap:4px; padding:4px 9px; border-radius:8px; font-size:11.5px; font-weight:700; }
        .vc-type-percent { background:rgba(6,182,212,.1); color:var(--vt-700); }
        .vc-type-fixed   { background:rgba(99,102,241,.1); color:#6366f1; }

        /* Progress bar usos */
        .vc-uses-wrap { display:flex; flex-direction:column; gap:4px; }
        .vc-uses-txt  { font-size:12px; font-weight:700; color:var(--vs-700); }
        .vc-uses-bar  { height:4px; background:var(--vs-100); border-radius:100px; overflow:hidden; }
        .vc-uses-fill { height:100%; border-radius:100px; background:linear-gradient(90deg,var(--vt-700),var(--vt-500)); transition:width .3s; }

        /* Badge estado */
        .vc-badge { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:100px; font-size:11px; font-weight:700; white-space:nowrap; }
        .vc-badge-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }

        /* Expiración */
        .vc-exp { font-size:12.5px; font-weight:600; color:var(--vs-500); display:flex; align-items:center; gap:4px; }
        .vc-exp.soon { color:#f59e0b; }
        .vc-exp.past  { color:#ef4444; }
        .vc-exp.never { color:var(--vs-300); }

        /* Row actions */
        .vc-row-acts { display:flex; align-items:center; gap:4px; }
        .vc-icon-btn  { width:30px; height:30px; border-radius:8px; border:1.5px solid var(--vs-200); background:var(--vw); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--vs-400); transition:all .15s; }
        .vc-icon-btn:hover { border-color:var(--vt-400); color:var(--vt-600); }
        .vc-more-btn-wrap { position:relative; }
        .vc-more-btn  { width:30px; height:30px; border-radius:8px; border:1.5px solid var(--vs-200); background:var(--vw); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--vs-400); transition:all .15s; }
        .vc-more-btn:hover { border-color:var(--vs-400); color:var(--vs-700); }

        /* ── Context menu ── */
        .vc-rmenu { position:absolute; top:calc(100% + 5px); right:0; min-width:175px; background:var(--vw); border:1px solid var(--vs-200); border-radius:14px; box-shadow:0 12px 40px rgba(15,23,42,.12); z-index:200; padding:5px; animation:vcdd .13s ease; }
        .vc-rm-item { display:flex; align-items:center; gap:9px; width:100%; padding:9px 11px; border:none; background:none; font-size:13px; font-weight:600; color:var(--vs-700); cursor:pointer; font-family:'Nunito',sans-serif; border-radius:9px; transition:background .12s; text-align:left; }
        .vc-rm-item:hover { background:var(--vs-50); }
        .vc-rm-item.danger { color:#ef4444; }
        .vc-rm-item.danger:hover { background:#fef2f2; }
        .vc-rm-sep { height:1px; background:var(--vs-100); margin:4px 0; }

        /* ── Delete dialog ── */
        .vc-overlay { position:fixed; inset:0; background:rgba(15,23,42,.45); backdrop-filter:blur(4px); z-index:400; display:flex; align-items:center; justify-content:center; padding:20px; animation:vco .15s ease; }
        @keyframes vco { from{opacity:0} to{opacity:1} }
        .vc-dialog { background:var(--vw); border-radius:20px; padding:28px; max-width:400px; width:100%; box-shadow:0 24px 60px rgba(15,23,42,.2); animation:vcdi .2s ease; text-align:center; }
        @keyframes vcdi { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
        .vc-d-ico    { font-size:40px; margin-bottom:14px; }
        .vc-d-title  { font-family:'Lexend',sans-serif; font-size:18px; font-weight:800; color:var(--vs-900); margin-bottom:8px; }
        .vc-d-msg    { font-size:13.5px; color:var(--vs-500); line-height:1.6; margin-bottom:22px; }
        .vc-d-btns   { display:flex; gap:10px; }
        .vc-d-cancel  { flex:1; padding:12px; border-radius:12px; border:1.5px solid var(--vs-200); background:var(--vw); font-size:14px; font-weight:700; color:var(--vs-600); font-family:'Nunito',sans-serif; cursor:pointer; transition:all .15s; }
        .vc-d-cancel:hover { border-color:var(--vs-400); }
        .vc-d-confirm { flex:1; padding:12px; border-radius:12px; border:none; background:linear-gradient(135deg,#ef4444,#dc2626); font-size:14px; font-weight:700; color:white; font-family:'Nunito',sans-serif; cursor:pointer; transition:all .15s; box-shadow:0 3px 12px rgba(239,68,68,.28); }
        .vc-d-confirm:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(239,68,68,.38); }

        /* ── Empty state ── */
        .vc-empty { text-align:center; padding:56px 24px; }
        .vc-empty-ico { color:var(--vs-300); display:flex; justify-content:center; margin-bottom:16px; }
        .vc-empty-title { font-family:'Lexend',sans-serif; font-size:17px; font-weight:800; color:var(--vs-700); margin-bottom:7px; }
        .vc-empty-sub   { font-size:13px; color:var(--vs-400); margin-bottom:18px; }

        /* ── Toast ── */
        .vc-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--vs-900); color:white; font-size:13px; font-weight:700; padding:10px 20px; border-radius:100px; box-shadow:0 6px 24px rgba(15,23,42,.25); z-index:300; animation:vct .25s ease; font-family:'Nunito',sans-serif; display:flex; align-items:center; gap:8px; white-space:nowrap; }
        @keyframes vct { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

        /* ── Clear filters ── */
        .vc-clear-bar { display:flex; align-items:center; gap:10px; padding:10px 14px; background:rgba(6,182,212,.06); border:1px solid rgba(6,182,212,.15); border-radius:11px; margin-bottom:12px; }
        .vc-clear-txt { font-size:13px; font-weight:600; color:var(--vt-700); flex:1; }
        .vc-clear-btn { background:none; border:none; cursor:pointer; font-size:12.5px; font-weight:700; color:var(--vt-600); font-family:'Nunito',sans-serif; display:flex; align-items:center; gap:5px; padding:0; }
      `}</style>

      {copied && (
        <div className="vc-toast"><IcoCheck />Código copiado: {data.find(c=>c.id===copied)?.code}</div>
      )}

      {toDelete && (
        <DeleteDialog
          code={toDelete.code}
          onConfirm={() => doDelete(toDelete.id)}
          onCancel={() => setToDelete(null)}
        />
      )}

      <div className={`vc${ready ? " in" : ""}`}>

        {/* ── Header ── */}
        <div className="vc-header">
          <div>
            <h1 className="vc-h1">Cupones de descuento</h1>
            <p className="vc-sub">{data.length} cupones · {totalActive} activos · {totalUses} usos totales</p>
          </div>
          <div className="vc-header-r">
            <button className="vc-btn vc-btn-primary" onClick={() => navigate("/vendor/coupons/new")}>
              <IcoPlus />Nuevo cupón
            </button>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="vc-kpis">
          {[
            { ico:"🏷️",  bg:"rgba(6,182,212,.1)",   n: data.length,       lbl:"Total cupones"  },
            { ico:"✅",  bg:"rgba(22,163,74,.1)",   n: totalActive,       lbl:"Cupones activos"},
            { ico:"📊",  bg:"rgba(99,102,241,.1)",  n: totalUses,         lbl:"Usos totales"   },
            { ico:"💸",  bg:"rgba(245,158,11,.1)",  n: totalPercent + totalFixed, lbl:"Tipos distintos"},
          ].map(k => (
            <div className="vc-kpi" key={k.lbl}>
              <div className="vc-kpi-ico" style={{ background:k.bg }}>{k.ico}</div>
              <div className="vc-kpi-n">{k.n}</div>
              <div className="vc-kpi-lbl">{k.lbl}</div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="vc-toolbar">
          <div className="vc-search-wrap">
            <span className="vc-search-ico"><IcoSearch /></span>
            <input
              className="vc-search-input"
              placeholder="Buscar cupón o descripción..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && <button className="vc-search-x" onClick={() => setQuery("")}><IcoX /></button>}
          </div>

          <div className="vc-toolbar-r">
            {/* Filtros */}
            <div className="vc-dd-wrap" ref={filterRef}>
              <button
                className={`vc-dd-btn${filterOpen ? " open" : ""}`}
                onClick={() => setFilterOpen(v => !v)}
              >
                <IcoFilter />Filtros
                {activeFiltersCount > 0 && <span className="vc-dd-badge">{activeFiltersCount}</span>}
                <IcoChevron />
              </button>
              {filterOpen && (
                <div className="vc-dropdown" style={{ minWidth:220 }}>
                  <div className="vc-dd-section">
                    <div className="vc-dd-lbl">Estado</div>
                    {STATUSES.map(s => (
                      <button key={s} className={`vc-dd-item${statusFil===s?" sel":""}`} onClick={() => setStatusFil(s)}>
                        {s}{statusFil===s && <span className="vc-dd-chk"><IcoCheck /></span>}
                      </button>
                    ))}
                  </div>
                  <div className="vc-dd-sep"/>
                  <div className="vc-dd-section">
                    <div className="vc-dd-lbl">Tipo</div>
                    {TYPES.map(t => (
                      <button key={t} className={`vc-dd-item${typeFil===t?" sel":""}`} onClick={() => setTypeFil(t)}>
                        {t}{typeFil===t && <span className="vc-dd-chk"><IcoCheck /></span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ordenar */}
            <div className="vc-sort-wrap" ref={sortRef}>
              <button className={`vc-dd-btn${sortOpen?" open":""}`} onClick={() => setSortOpen(v => !v)}>
                {sortLabel}<IcoChevron />
              </button>
              {sortOpen && (
                <div className="vc-dropdown">
                  <div className="vc-dd-section">
                    {SORT_OPTS.map(o => (
                      <button key={o.val} className={`vc-dd-item${sort===o.val?" sel":""}`}
                        onClick={() => { setSort(o.val); setSortOpen(false); }}>
                        {o.label}{sort===o.val && <span className="vc-dd-chk"><IcoCheck /></span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <div className="vc-clear-bar">
            <span className="vc-clear-txt">{filtered.length} resultado{filtered.length!==1?"s":""} encontrado{filtered.length!==1?"s":""}</span>
            <button className="vc-clear-btn" onClick={clearFilters}><IcoX />Limpiar filtros</button>
          </div>
        )}

        {/* ── Tabla ── */}
        {filtered.length === 0 ? (
          <div className="vc-list-card">
            <div className="vc-empty">
              <div className="vc-empty-ico"><IcoCoupon /></div>
              <div className="vc-empty-title">{hasFilters ? "Sin resultados" : "Sin cupones aún"}</div>
              <div className="vc-empty-sub">{hasFilters ? "Prueba con otros filtros." : "Crea tu primer cupón de descuento."}</div>
              {!hasFilters && (
                <button className="vc-btn vc-btn-primary" onClick={() => navigate("/vendor/coupons/new")}>
                  <IcoPlus />Crear cupón
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="vc-list-card">
            <div className="vc-list-head">
              <div className="vc-list-th">Cupón</div>
              <div className="vc-list-th">Descuento</div>
              <div className="vc-list-th vc-col-hide">Usos</div>
              <div className="vc-list-th vc-col-hide">Mín. compra</div>
              <div className="vc-list-th vc-col-hide">Expira</div>
              <div className="vc-list-th">Estado</div>
              <div className="vc-list-th"/>
            </div>

            {filtered.map(cp => {
              const st      = STATUS_CFG[cp.status] || STATUS_CFG.inactive;
              const usesPct = cp.maxUses ? Math.round((cp.uses / cp.maxUses) * 100) : null;
              const expDate = cp.expiresAt ? new Date(cp.expiresAt) : null;
              const daysLeft = expDate ? Math.ceil((expDate - new Date()) / 86400000) : null;
              const expClass = !expDate ? "never" : daysLeft < 0 ? "past" : daysLeft < 7 ? "soon" : "";
              const expLabel = !expDate ? "Sin vencimiento" : daysLeft < 0 ? "Expirado" : daysLeft === 0 ? "Hoy" : daysLeft < 7 ? `${daysLeft}d` : expDate.toLocaleDateString("es-DO",{day:"2-digit",month:"short"});

              return (
                <div className="vc-list-row" key={cp.id}>

                  {/* Cupón */}
                  <div className="vc-code-cell">
                    <div className="vc-code-ico" style={{ background: cp.type==="percent" ? "rgba(6,182,212,.1)" : "rgba(99,102,241,.1)" }}>
                      {cp.type==="percent" ? "%" : "$"}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span className="vc-code-name">{cp.code}</span>
                        <button
                          className={`vc-copy-btn${copied===cp.id?" done":""}`}
                          onClick={() => doCopyCode(cp)}
                          title="Copiar código"
                        >
                          {copied===cp.id ? <IcoCheck /> : <IcoCopy />}
                        </button>
                      </div>
                      <div className="vc-code-desc">{cp.description}</div>
                    </div>
                  </div>

                  {/* Descuento */}
                  <div>
                    <span className={`vc-type-badge ${cp.type==="percent"?"vc-type-percent":"vc-type-fixed"}`}>
                      {cp.type==="percent" ? <IcoPercent /> : <IcoTag />}
                      {fmtVal(cp)}
                    </span>
                  </div>

                  {/* Usos */}
                  <div className="vc-col-hide">
                    <div className="vc-uses-wrap">
                      <span className="vc-uses-txt">
                        {cp.uses}{cp.maxUses ? `/${cp.maxUses}` : ""}
                      </span>
                      {cp.maxUses && (
                        <div className="vc-uses-bar">
                          <div className="vc-uses-fill" style={{ width:`${usesPct}%` }}/>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mínimo */}
                  <div className="vc-col-hide" style={{ fontSize:12.5, fontWeight:600, color:"var(--vs-600)" }}>
                    {cp.minOrder ? fmt(cp.minOrder) : <span style={{ color:"var(--vs-300)" }}>—</span>}
                  </div>

                  {/* Expira */}
                  <div className="vc-col-hide">
                    <span className={`vc-exp${expClass ? " "+expClass : ""}`}>
                      {expClass === "never" ? null : <IcoClock />}
                      {expLabel}
                    </span>
                  </div>

                  {/* Estado */}
                  <div>
                    <span className="vc-badge" style={{ background:st.bg, color:st.clr }}>
                      <span className="vc-badge-dot" style={{ background:st.dot }}/>
                      {st.label}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="vc-row-acts">
                    <button className="vc-icon-btn" onClick={() => navigate(`/vendor/coupons/${cp.id}`)} title="Editar">
                      <IcoEdit />
                    </button>
                    <div className="vc-more-btn-wrap">
                      <button className="vc-more-btn" onClick={() => setMenuOpen(menuOpen===cp.id ? null : cp.id)}>
                        <IcoMore />
                      </button>
                      {menuOpen===cp.id && (
                        <RowMenu
                          coupon={cp}
                          onEdit={() => navigate(`/vendor/coupons/${cp.id}`)}
                          onDuplicate={() => doDuplicate(cp)}
                          onToggle={() => doToggle(cp.id)}
                          onDelete={() => setToDelete(cp)}
                          onCopyCode={() => doCopyCode(cp)}
                          onClose={() => setMenuOpen(null)}
                        />
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
