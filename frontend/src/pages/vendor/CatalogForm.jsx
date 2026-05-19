import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "qrcode";
import { vendorCatalogService } from "../../services/odoo/vendorCatalogService";
import vendorProductService from "../../services/odoo/vendorProductService";
import categoryService from "../../services/odoo/categoryService";
import { toImageDataUrl } from "../../utils/imageDataUrl";

// ─── Iconos ───────────────────────────────────────────────────────────────────
const IcoBack    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoSave    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IcoCheck   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoX       = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoSearch  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
const IcoLink    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IcoCopy    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IcoQR      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3"/><rect x="16" y="5" width="3" height="3"/><rect x="16" y="16" width="3" height="3"/><rect x="5" y="16" width="3" height="3"/></svg>;
const IcoWarn    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoStar    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoGlobe   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IcoTag     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const IcoPalette = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>;

// ─── Constantes ───────────────────────────────────────────────────────────────

const ACCENT_COLORS = ["#f43f5e","#f97316","#eab308","#22c55e","#06b6d4","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#64748b"];
const TABS = ["Información","Productos","Apariencia","Compartir","SEO"];


const EMPTY_FORM = {
  name:"", slug:"", description:"", category:"", imageUrl:"", accentColor:"#06b6d4",
  status:"draft", featured:false, shared:false, allowOrders:true, showPrices:true,
  passwordProtected:false, password:"",
  metaTitle:"", metaDesc:"",
  selectedProducts:[],
};

const MOCK_EDIT = {
  name:"Nova Style", slug:"nova-style",
  description:"Colección de moda femenina contemporánea con tendencias actuales. Encuentra las prendas perfectas para cada ocasión.",
  category:"Moda", imageUrl:"", accentColor:"#f43f5e",
  status:"active", featured:true, shared:true, allowOrders:true, showPrices:true,
  passwordProtected:false, password:"",
  metaTitle:"Nova Style — Moda Femenina Dominicana", metaDesc:"Descubre la mejor colección de moda femenina contemporánea.",
  selectedProducts:[1,2,5],
};

const fmt = n => "RD$" + (n || 0).toLocaleString("es-DO");
const isImageUrl = (value) =>
  typeof value === "string" && (value.startsWith("data:") || value.startsWith("http"));

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function Card({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="cf-card">
      <div className="cf-card-head">
        <div>
          <div className="cf-card-title">{Icon && <Icon />}{title}</div>
          {subtitle && <div className="cf-card-sub">{subtitle}</div>}
        </div>
      </div>
      <div className="cf-card-body">{children}</div>
    </div>
  );
}

function Field({ label, required, error, hint, children }) {
  return (
    <div className="cf-field">
      {label && (
        <label className="cf-label">
          {label}{required && <span className="cf-req">*</span>}
        </label>
      )}
      {children}
      {error && <span className="cf-err"><IcoWarn />{error}</span>}
      {hint  && !error && <span className="cf-hint">{hint}</span>}
    </div>
  );
}

function Input({ error, ...props }) {
  return <input className={`cf-input${error ? " err" : ""}`} {...props} />;
}

function Textarea({ error, ...props }) {
  return <textarea className={`cf-input cf-ta${error ? " err" : ""}`} {...props} />;
}

function Sel({ error, children, ...props }) {
  return (
    <div className="cf-sel-wrap">
      <select className={`cf-input cf-sel${error ? " err" : ""}`} {...props}>{children}</select>
    </div>
  );
}

function Toggle({ on, onChange, label, desc, icon: Icon }) {
  return (
    <div className="cf-toggle-row">
      <div className="cf-toggle-info">
        <div className="cf-toggle-label">{Icon && <><Icon />&nbsp;</>}{label}</div>
        {desc && <div className="cf-toggle-desc">{desc}</div>}
      </div>
      <button type="button" className={`cf-toggle ${on ? "on" : "off"}`} onClick={() => onChange(!on)}>
        <div className="cf-toggle-knob"/>
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CatalogForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id && id !== "new");

  const [ready,     setReady   ] = useState(false);
  const [form,      setForm    ] = useState(EMPTY_FORM);
  const [errors,    setErrors  ] = useState({});
  const [saving,    setSaving  ] = useState(false);
  const [saved,     setSaved   ] = useState(false);
  const [apiError,  setApiError] = useState("");
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imageChanged, setImageChanged] = useState(false);
  const [tab,       setTab     ] = useState("Información");
  const [prodSearch,setProdSrch] = useState("");
  const [copied,    setCopied  ] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError,   setQrError  ] = useState("");
  const [categories, setCategories] = useState([]);
  const fileRef = useRef(null);

  useEffect(() => { setTimeout(() => setReady(true), 60); }, []);

  // ─── Cargar categorías dinámicas del vendedor ──────────────────────────────
  const FALLBACK_CATEGORIES = ["Moda","Deportes","Belleza","Alimentos","Hogar","Electrónica","Servicios","Otros"];
  useEffect(() => {
    categoryService.list()
      .then((rows) => {
        const names = Array.isArray(rows) && rows.length > 0
          ? rows.map(r => r.name || r.fullName).filter(Boolean)
          : FALLBACK_CATEGORIES;
        setCategories(names);
      })
      .catch(() => setCategories(FALLBACK_CATEGORIES));
  }, []);


  const mapFromApi = raw => {
    const name = raw?.name || "";
    const slug = raw?.slug || name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60);
    const imageUrl = raw?.image_url || toImageDataUrl(raw?.image_1920) || "";
    return {
      ...EMPTY_FORM,
      name,
      slug,
      category: raw?.category || "",
      description: raw?.description || "",
      imageUrl,
      status: raw?.active ? "active" : "inactive",
      selectedProducts: Array.isArray(raw?.product_ids) ? raw.product_ids : [],
    };
  };

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await vendorCatalogService.get(id);
        if (!cancelled) {
          setForm(mapFromApi(data));
          setImageBase64("");
          setImageChanged(false);
        }
      } catch (err) {
        if (!cancelled) setApiError(err?.message || "Error cargando catálogo");
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  useEffect(() => {
    let active = true;
    setProductsLoading(true);
    setProductsError("");
    vendorProductService.list()
      .then((rows) => {
        if (!active) return;
        setAvailableProducts(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (!active) return;
        setProductsError(err?.message || "No se pudieron cargar los productos");
        setAvailableProducts([]);
      })
      .finally(() => {
        if (!active) return;
        setProductsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const set = (k, v) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      // Auto-slug desde nombre
      if (k === "name") {
        next.slug = v.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60);
      }
      return next;
    });
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = "El nombre es obligatorio";
    if (!form.description.trim()) e.description = "La descripción es obligatoria";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (status = form.status) => {
    if (!validate()) { setTab("Información"); return; }
    setSaving(true);
    setApiError("");
    try {
      const isRemoteUrl = (form.imageUrl || "").startsWith("http");
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description,
        status,
        product_ids: form.selectedProducts,
      };
      if (imageChanged) {
        payload.image_base64 = imageBase64 || "";
        payload.image_url = "";
      } else if (isRemoteUrl) {
        payload.image_url = form.imageUrl;
      }
      if (isEdit) {
        await vendorCatalogService.update(id, payload);
      } else {
        await vendorCatalogService.create(payload);
      }
      setSaved(true);
      setTimeout(() => navigate("/vendor/catalogs"), 1400);
    } catch (err) {
      setApiError(err?.message || "Error guardando catálogo");
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = id => {
    set("selectedProducts", form.selectedProducts.includes(id)
      ? form.selectedProducts.filter(x => x !== id)
      : [...form.selectedProducts, id]
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredProds = availableProducts.filter(p => {
    const q = prodSearch.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  const hasErrors = Object.keys(errors).length > 0;
  const selectedCount = form.selectedProducts.length;
  const slug = form.slug || (form.name || "mi-catalogo").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"").slice(0,60);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://catalogix.com";
  const catalogSlugOrId = isEdit && id ? id : slug;
  const publicUrl = catalogSlugOrId ? `${baseUrl}/catalog/${catalogSlugOrId}` : baseUrl;

  const canGenerateQr = Boolean(isEdit && id);

  useEffect(() => {
    if (!canGenerateQr) {
      setQrDataUrl("");
      setQrError("");
      setQrLoading(false);
      return;
    }
    let active = true;
    setQrLoading(true);
    setQrError("");
    QRCode.toDataURL(publicUrl, { width: 220, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!active) return;
        setQrDataUrl(url);
      })
      .catch((err) => {
        if (!active) return;
        setQrError(err?.message || "No se pudo generar el QR.");
        setQrDataUrl("");
      })
      .finally(() => {
        if (!active) return;
        setQrLoading(false);
      });
    return () => { active = false; };
  }, [canGenerateQr, publicUrl]);

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const filename = `qr-${slug || "catalogo"}.png`;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = filename;
    link.click();
  };

  const handleImageFile = file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : "";
      set("imageUrl", dataUrl);
      setImageBase64(base64);
      setImageChanged(true);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <style>{`
        .cf { opacity:0; transform:translateY(6px); transition:opacity .35s ease, transform .35s ease; }
        .cf.in { opacity:1; transform:translateY(0); }
        .cf-error-banner { margin:10px 0 16px; padding:10px 14px; border-radius:12px; background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; font-size:13px; font-weight:600; font-family:'Nunito',sans-serif; display:flex; align-items:center; gap:8px; }

        /* ── Header ── */
        .cf-header { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
        .cf-back { width:36px; height:36px; border-radius:10px; border:1.5px solid var(--vs-200); background:var(--vw); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--vs-500); transition:all .18s; flex-shrink:0; }
        .cf-back:hover { border-color:var(--vt-400); color:var(--vt-600); }
        .cf-header-info { flex:1; min-width:0; }
        .cf-eyebrow { font-size:11px; font-weight:700; color:var(--vt-600); text-transform:uppercase; letter-spacing:1px; margin-bottom:3px; }
        .cf-h1 { font-family:'Lexend',sans-serif; font-size:clamp(16px,2vw,22px); font-weight:800; color:var(--vs-900); letter-spacing:-.4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .cf-header-btns { display:flex; gap:8px; flex-wrap:wrap; }
        .cf-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:10px; font-size:13px; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; transition:all .18s; white-space:nowrap; }
        .cf-btn:disabled { opacity:.6; cursor:not-allowed; }
        .cf-btn-ghost   { border:1.5px solid var(--vs-200); background:var(--vw); color:var(--vs-600); }
        .cf-btn-ghost:hover { border-color:var(--vs-400); color:var(--vs-800); }
        .cf-btn-draft   { border:1.5px solid var(--vs-300); background:var(--vs-100); color:var(--vs-700); }
        .cf-btn-draft:hover { background:var(--vs-200); }
        .cf-btn-primary { border:none; background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); color:white; box-shadow:0 3px 12px rgba(6,182,212,.28); }
        .cf-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(6,182,212,.38); }
        .cf-btn-primary:disabled { opacity:.65; cursor:not-allowed; }
        .cf-btn-success { border:none; background:linear-gradient(135deg,#16a34a,#22c55e); color:white; box-shadow:0 3px 12px rgba(22,163,74,.28); }
        .cf-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:cfspin .65s linear infinite; flex-shrink:0; }
        @keyframes cfspin { to{ transform:rotate(360deg); } }

        /* ── Tabs ── */
        .cf-tabs { display:flex; gap:2px; background:var(--vs-100); border-radius:12px; padding:4px; border:1px solid var(--vs-200); margin-bottom:20px; width:fit-content; flex-wrap:wrap; }
        .cf-tab  { padding:8px 14px; border-radius:9px; border:none; background:none; font-size:12.5px; font-weight:700; color:var(--vs-400); cursor:pointer; font-family:'Nunito',sans-serif; transition:all .15s; white-space:nowrap; position:relative; }
        .cf-tab.act { background:var(--vw); color:var(--vs-800); box-shadow:0 1px 5px rgba(15,23,42,.1); }
        .cf-tab.has-err::after { content:""; position:absolute; top:7px; right:8px; width:6px; height:6px; border-radius:50%; background:#ef4444; }
        .cf-tab-badge { display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; border-radius:100px; background:var(--vt-500); color:white; font-size:10px; font-weight:800; padding:0 5px; margin-left:4px; }

        /* ── Layout ── */
        .cf-layout { display:grid; grid-template-columns:1fr 270px; gap:16px; align-items:start; }
        @media(max-width:940px) { .cf-layout { grid-template-columns:1fr; } }
        .cf-main { display:flex; flex-direction:column; gap:16px; }
        .cf-side { display:flex; flex-direction:column; gap:14px; }

        /* ── Card ── */
        .cf-card { background:var(--vw); border-radius:18px; border:1px solid var(--vs-200); box-shadow:0 2px 8px rgba(15,23,42,.04); overflow:hidden; }
        .cf-card-head  { padding:15px 20px 11px; border-bottom:1px solid var(--vs-100); }
        .cf-card-title { font-family:'Lexend',sans-serif; font-size:14px; font-weight:800; color:var(--vs-900); margin-bottom:2px; display:flex; align-items:center; gap:7px; }
        .cf-card-sub   { font-size:12px; color:var(--vs-400); font-weight:400; }
        .cf-card-body  { padding:18px 20px; display:flex; flex-direction:column; gap:15px; }

        /* ── Campos ── */
        .cf-field { display:flex; flex-direction:column; gap:5px; }
        .cf-label { font-size:11px; font-weight:800; color:var(--vs-500); text-transform:uppercase; letter-spacing:.7px; }
        .cf-req   { color:#ef4444; }
        .cf-input { width:100%; padding:11px 14px; border:1.5px solid var(--vs-200); border-radius:11px; background:var(--vs-50); font-size:14px; font-weight:500; color:var(--vs-900); font-family:'Nunito',sans-serif; outline:none; transition:all .2s; }
        .cf-input:focus { border-color:var(--vt-500); background:var(--vw); box-shadow:0 0 0 3px rgba(6,182,212,.1); }
        .cf-input.err   { border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,.08); }
        .cf-input::placeholder { color:var(--vs-400); font-weight:400; }
        .cf-ta   { min-height:95px; resize:vertical; line-height:1.65; }
        .cf-sel-wrap { position:relative; }
        .cf-sel  { appearance:none; cursor:pointer; }
        .cf-sel-wrap::after { content:""; position:absolute; right:13px; top:50%; transform:translateY(-50%); border-left:4px solid transparent; border-right:4px solid transparent; border-top:5px solid var(--vs-400); pointer-events:none; }
        .cf-err  { display:flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:#ef4444; }
        .cf-hint { font-size:11.5px; color:var(--vs-400); }

        /* Grid */
        .cf-g2 { display:grid; grid-template-columns:1fr 1fr; gap:13px; }
        @media(max-width:600px) { .cf-g2 { grid-template-columns:1fr; } }

        /* URL row */
        .cf-url-row { display:flex; }
        .cf-url-pre { padding:11px 12px; background:var(--vs-100); border:1.5px solid var(--vs-200); border-right:none; border-radius:11px 0 0 11px; font-size:12.5px; color:var(--vs-500); white-space:nowrap; flex-shrink:0; }
        .cf-url-input { border-radius:0 11px 11px 0; border-left:none; }

        /* ── Cover image ── */
        .cf-cover-row { display:flex; align-items:center; gap:14px; }
        .cf-cover-preview { width:92px; height:92px; border-radius:16px; display:flex; align-items:center; justify-content:center; border:1.5px solid var(--vs-200); flex-shrink:0; transition:all .2s; overflow:hidden; background:var(--vs-50); }
        .cf-cover-img { width:100%; height:100%; object-fit:cover; display:block; }
        .cf-cover-placeholder { font-size:11px; font-weight:700; color:var(--vs-400); text-align:center; padding:0 8px; }
        .cf-cover-actions { display:flex; flex-direction:column; gap:8px; }
        .cf-cover-upload { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
        .cf-cover-btn { padding:8px 13px; font-size:12px; }
        .cf-cover-hint { font-size:11.5px; color:var(--vs-400); }

        /* ── Color accent ── */
        .cf-colors { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
        .cf-color-sw { width:30px; height:30px; border-radius:8px; cursor:pointer; transition:all .15s; border:2.5px solid transparent; }
        .cf-color-sw:hover { transform:scale(1.1); }
        .cf-color-sw.sel { box-shadow:0 0 0 2px var(--vw), 0 0 0 4px var(--vt-500); }
        .cf-color-custom { width:32px; height:32px; border-radius:8px; border:1.5px dashed var(--vs-300); cursor:pointer; padding:2px; overflow:hidden; }

        /* ── Toggle ── */
        .cf-toggle-row   { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 0; border-bottom:1px solid var(--vs-50); }
        .cf-toggle-row:last-child { border-bottom:none; }
        .cf-toggle-info  { flex:1; min-width:0; }
        .cf-toggle-label { font-size:13.5px; font-weight:700; color:var(--vs-800); margin-bottom:2px; }
        .cf-toggle-desc  { font-size:12px; color:var(--vs-400); }
        .cf-toggle { width:42px; height:24px; border-radius:100px; border:none; cursor:pointer; position:relative; transition:all .2s; flex-shrink:0; }
        .cf-toggle.on  { background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); box-shadow:0 2px 8px rgba(6,182,212,.3); }
        .cf-toggle.off { background:var(--vs-200); }
        .cf-toggle-knob { position:absolute; top:3px; width:18px; height:18px; border-radius:50%; background:white; box-shadow:0 1px 4px rgba(0,0,0,.2); transition:left .2s; }
        .cf-toggle.on  .cf-toggle-knob { left:21px; }
        .cf-toggle.off .cf-toggle-knob { left:3px; }

        /* ── Status selector ── */
        .cf-status-opts { display:flex; flex-direction:column; gap:7px; }
        .cf-status-opt  { display:flex; align-items:center; gap:10px; padding:10px 13px; border-radius:12px; border:1.5px solid var(--vs-200); cursor:pointer; transition:all .15s; }
        .cf-status-opt:hover:not(.sel) { border-color:var(--vs-400); }
        .cf-status-opt.sel.active   { border-color:#bbf7d0; background:#f0fdf4; }
        .cf-status-opt.sel.draft    { border-color:var(--vs-300); background:var(--vs-50); }
        .cf-status-opt.sel.inactive { border-color:#fecaca; background:#fef2f2; }
        .cf-status-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .cf-status-name { font-size:13px; font-weight:700; color:var(--vs-800); }
        .cf-status-desc { font-size:11.5px; color:var(--vs-400); margin-top:1px; }
        .cf-status-chk  { margin-left:auto; color:var(--vt-600); display:flex; }

        /* ── Productos ── */
        .cf-prod-search-wrap { position:relative; margin-bottom:12px; }
        .cf-prod-search-ico  { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--vs-400); display:flex; pointer-events:none; }
        .cf-prod-search { width:100%; padding:10px 12px 10px 37px; border:1.5px solid var(--vs-200); border-radius:11px; background:var(--vs-50); font-size:13.5px; color:var(--vs-800); font-family:'Nunito',sans-serif; outline:none; transition:all .2s; }
        .cf-prod-search:focus { border-color:var(--vt-500); box-shadow:0 0 0 3px rgba(6,182,212,.1); }
        .cf-prod-search::placeholder { color:var(--vs-400); }
        .cf-prod-list { display:flex; flex-direction:column; gap:1px; max-height:380px; overflow-y:auto; }
        .cf-prod-list::-webkit-scrollbar { width:4px; }
        .cf-prod-list::-webkit-scrollbar-thumb { background:var(--vs-200); border-radius:2px; }
        .cf-prod-item { display:flex; align-items:center; gap:12px; padding:11px 12px; border-radius:11px; cursor:pointer; transition:background .13s; }
        .cf-prod-item:hover { background:var(--vs-50); }
        .cf-prod-item.sel  { background:rgba(6,182,212,.06); }
        .cf-prod-chk { width:18px; height:18px; border-radius:5px; border:1.5px solid var(--vs-300); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .15s; background:var(--vw); }
        .cf-prod-chk.on { background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); border-color:transparent; box-shadow:0 2px 6px rgba(6,182,212,.3); }
        .cf-prod-thumb { width:38px; height:38px; border-radius:9px; background:var(--vs-100); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; overflow:hidden; background-size:cover; background-position:center; }
        .cf-prod-thumb.img { color:transparent; }
        .cf-prod-name  { font-size:13px; font-weight:700; color:var(--vs-800); }
        .cf-prod-sku   { font-size:11px; color:var(--vs-400); font-family:monospace; margin-top:1px; }
        .cf-prod-price { font-family:'Lexend',sans-serif; font-size:13px; font-weight:800; color:var(--vs-900); margin-left:auto; white-space:nowrap; }
        .cf-prod-empty { text-align:center; padding:24px; color:var(--vs-400); font-size:13px; }
        .cf-selected-badge { display:inline-flex; align-items:center; gap:5px; padding:5px 11px; background:rgba(6,182,212,.1); border:1px solid rgba(6,182,212,.2); border-radius:100px; font-size:12px; font-weight:700; color:var(--vt-700); margin-bottom:10px; }

        /* ── Compartir ── */
        .cf-link-box { background:var(--vs-50); border:1.5px solid var(--vs-200); border-radius:13px; padding:14px 16px; }
        .cf-link-url { font-size:13px; color:var(--vt-600); font-weight:600; word-break:break-all; margin-bottom:10px; }
        .cf-link-btns { display:flex; gap:8px; flex-wrap:wrap; }
        .cf-link-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 13px; border-radius:9px; border:1.5px solid var(--vs-200); background:var(--vw); font-size:12.5px; font-weight:700; color:var(--vs-600); font-family:'Nunito',sans-serif; cursor:pointer; transition:all .15s; }
        .cf-link-btn:hover { border-color:var(--vt-400); color:var(--vt-600); }
        .cf-link-btn.copied { border-color:#bbf7d0; background:#f0fdf4; color:#16a34a; }

        /* QR placeholder */
        .cf-qr-preview { width:140px; height:140px; border-radius:14px; background:var(--vs-100); border:1.5px dashed var(--vs-300); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; color:var(--vs-400); font-size:11px; font-weight:600; margin:0 auto; overflow:hidden; }
        .cf-qr-img { width:100%; height:100%; object-fit:contain; background:white; }
        .cf-qr-msg { font-size:11px; color:var(--vs-400); font-weight:600; text-align:center; }

        /* ── SEO preview ── */
        .cf-seo-preview { background:white; border:1px solid var(--vs-200); border-radius:12px; padding:15px; }
        .cf-seo-url   { font-size:12px; color:#1a0dab; margin-bottom:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .cf-seo-title { font-size:17px; color:#1a0dab; margin-bottom:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .cf-seo-desc  { font-size:12.5px; color:#4d5156; line-height:1.55; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }

        /* ── Copied toast ── */
        .cf-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--vs-900); color:white; font-size:13px; font-weight:700; padding:10px 20px; border-radius:100px; box-shadow:0 6px 24px rgba(15,23,42,.25); z-index:300; animation:cftoast .25s ease; font-family:'Nunito',sans-serif; display:flex; align-items:center; gap:8px; }
        @keyframes cftoast { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>

      {copied && (
        <div className="cf-toast"><IcoCheck />Enlace copiado al portapapeles</div>
      )}

      <div className={`cf${ready ? " in" : ""}`}>

        {/* ── HEADER ── */}
        <div className="cf-header">
          <button className="cf-back" onClick={() => navigate("/vendor/catalogs")}><IcoBack /></button>
          <div className="cf-header-info">
            <div className="cf-eyebrow">{isEdit ? "Editar catálogo" : "Nuevo catálogo"}</div>
            <h1 className="cf-h1">{isEdit ? (form.name || "Sin nombre") : "Crear catálogo"}</h1>
          </div>
          <div className="cf-header-btns">
            <button className="cf-btn cf-btn-ghost" onClick={() => navigate("/vendor/catalogs")}>Cancelar</button>
            {isEdit && (
              <button className="cf-btn cf-btn-draft" onClick={() => handleSave("draft")}>Guardar borrador</button>
            )}
            <button
              className={`cf-btn ${saved ? "cf-btn-success" : "cf-btn-primary"}`}
              onClick={() => handleSave()}
              disabled={saving}
            >
              {saving ? <><span className="cf-spin"/>Guardando...</>
               : saved ? <><IcoCheck />¡Guardado!</>
               : <><IcoSave />{isEdit ? "Guardar cambios" : "Publicar catálogo"}</>}
            </button>
          </div>
        </div>
        {apiError && (
          <div className="cf-error-banner">
            <IcoWarn />{apiError}
          </div>
        )}

        {/* ── TABS ── */}
        <div className="cf-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`cf-tab${tab === t ? " act" : ""}${t === "Información" && hasErrors ? " has-err" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
              {t === "Productos" && selectedCount > 0 && (
                <span className="cf-tab-badge">{selectedCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── LAYOUT ── */}
        <div className="cf-layout">

          {/* ════ COLUMNA PRINCIPAL ════ */}
          <div className="cf-main">

            {/* ─── INFORMACIÓN ─── */}
            {tab === "Información" && (
              <>
                <Card title="Información básica" subtitle="Datos principales del catálogo">
                  <Field label="Nombre del catálogo" required error={errors.name}>
                    <Input placeholder="Ej. Nova Style, FitLife Store..." value={form.name} onChange={e => set("name", e.target.value)} error={errors.name} />
                  </Field>

                  <Field label="Descripción" required error={errors.description}>
                    <Textarea placeholder="Describe qué encontrará el cliente en este catálogo..." value={form.description} onChange={e => set("description", e.target.value)} rows={3} error={errors.description} />
                  </Field>

                  <div className="cf-g2">
                    <Field label="Categoría" required>
                      <Sel
                        value={form.category}
                        onChange={e => set("category", e.target.value)}
                      >
                        <option value="">— Selecciona una categoría —</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </Sel>
                    </Field>
                    <Field label="URL personalizada" hint={`catalogix.com/c/${slug}`}>
                      <div className="cf-url-row">
                        <span className="cf-url-pre">/c/</span>
                        <Input
                          className="cf-url-input"
                          placeholder="mi-catalogo"
                          value={form.slug}
                          onChange={e => set("slug", e.target.value.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,""))}
                          style={{ borderRadius:"0 11px 11px 0", borderLeft:"none" }}
                        />
                      </div>
                    </Field>
                  </div>
                </Card>

                <Card title="Configuración" subtitle="Opciones de visibilidad y comportamiento">
                  <div>
                    <Toggle on={form.shared}       onChange={v => set("shared", v)}       label="Catálogo público" desc="Visible para cualquier persona con el enlace" icon={IcoGlobe} />
                    <Toggle on={form.allowOrders}   onChange={v => set("allowOrders", v)}  label="Permitir pedidos" desc="Los clientes pueden comprar directamente" />
                    <Toggle on={form.showPrices}    onChange={v => set("showPrices", v)}   label="Mostrar precios" desc="Los precios son visibles en el catálogo" icon={IcoTag} />
                    <Toggle on={form.passwordProtected} onChange={v => set("passwordProtected", v)} label="Proteger con contraseña" desc="Solo quienes tengan la clave pueden ver el catálogo" />
                    {form.passwordProtected && (
                      <div style={{ paddingLeft:0, marginTop:10 }}>
                        <Field label="Contraseña de acceso">
                          <Input type="password" placeholder="Contraseña para el catálogo..." value={form.password} onChange={e => set("password", e.target.value)} />
                        </Field>
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}

            {/* ─── PRODUCTOS ─── */}
            {tab === "Productos" && (
              <Card title="Productos del catálogo" subtitle="Selecciona qué productos aparecerán en este catálogo">
                {selectedCount > 0 && (
                  <div className="cf-selected-badge">
                    <IcoCheck />{selectedCount} producto{selectedCount > 1 ? "s" : ""} seleccionado{selectedCount > 1 ? "s" : ""}
                    <button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--vt-500)", display:"flex", marginLeft:4 }} onClick={() => set("selectedProducts", [])}>
                      <IcoX />
                    </button>
                  </div>
                )}

                <div className="cf-prod-search-wrap">
                  <span className="cf-prod-search-ico"><IcoSearch /></span>
                  <input className="cf-prod-search" placeholder="Buscar por nombre o SKU..." value={prodSearch} onChange={e => setProdSrch(e.target.value)} />
                </div>

                <div className="cf-prod-list">
                  {productsLoading ? (
                    <div className="cf-prod-empty">Cargando productos...</div>
                  ) : productsError ? (
                    <div className="cf-prod-empty">{productsError}</div>
                  ) : filteredProds.length === 0 ? (
                    <div className="cf-prod-empty">No se encontraron productos</div>
                  ) : filteredProds.map(p => {
                    const sel = form.selectedProducts.includes(p.id);
                    return (
                      <div key={p.id} className={`cf-prod-item${sel ? " sel" : ""}`} onClick={() => toggleProduct(p.id)}>
                        <div className={`cf-prod-chk${sel ? " on" : ""}`}>
                          {sel && <IcoCheck style={{ color:"white" }}/>}
                        </div>
                        <div
                          className={`cf-prod-thumb${isImageUrl(p.img) ? " img" : ""}`}
                          style={isImageUrl(p.img) ? { backgroundImage: `url(${p.img})` } : undefined}
                        >
                          {!isImageUrl(p.img) && p.img}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="cf-prod-name">{p.name}</div>
                          <div className="cf-prod-sku">{p.sku} · {p.category}</div>
                        </div>
                        <div className="cf-prod-price">{fmt(p.price)}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontSize:12, color:"var(--vs-400)", textAlign:"center", paddingTop:8, borderTop:"1px solid var(--vs-100)" }}>
                  {filteredProds.length} de {availableProducts.length} productos disponibles
                </div>
              </Card>
            )}

            {/* ─── APARIENCIA ─── */}
            {tab === "Apariencia" && (
              <>
                <Card title="Portada" subtitle="Imagen y vista previa de la tarjeta del catálogo" icon={IcoPalette}>

                  <div className="cf-cover-row">
                    <div className="cf-cover-preview" style={{ background: form.imageUrl ? "var(--vw)" : `${form.accentColor}15` }}>
                      {form.imageUrl
                        ? <img className="cf-cover-img" src={form.imageUrl} alt="Portada del catálogo" />
                        : <div className="cf-cover-placeholder">Sin imagen</div>
                      }
                    </div>
                    <div className="cf-cover-actions">
                      <Field label="Imagen del catálogo" hint="Sube una imagen desde tu equipo">
                        <div className="cf-cover-upload">
                          <button type="button" className="cf-btn cf-btn-ghost cf-cover-btn" onClick={() => fileRef.current?.click()}>
                            Subir imagen
                          </button>
                          {form.imageUrl && (
                            <button
                              type="button"
                              className="cf-btn cf-btn-ghost cf-cover-btn"
                              onClick={() => {
                                set("imageUrl", "");
                                setImageBase64("");
                                setImageChanged(true);
                              }}
                            >
                              <IcoTrash />Quitar
                            </button>
                          )}
                          <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            style={{ display:"none" }}
                            onChange={e => handleImageFile(e.target.files?.[0])}
                          />
                        </div>
                        {form.imageUrl && (
                          <div className="cf-cover-hint">Imagen cargada</div>
                        )}
                      </Field>
                    </div>
                  </div>

                  <Field label="Color de acento">
                    <div className="cf-colors">
                      {ACCENT_COLORS.map(c => (
                        <div
                          key={c}
                          className={`cf-color-sw${form.accentColor === c ? " sel" : ""}`}
                          style={{ background:c }}
                          onClick={() => set("accentColor", c)}
                          title={c}
                        />
                      ))}
                      <input
                        type="color"
                        className="cf-color-custom"
                        value={form.accentColor}
                        onChange={e => set("accentColor", e.target.value)}
                        title="Color personalizado"
                      />
                    </div>
                  </Field>

                  {/* Mini preview */}
                  <div>
                    <label className="cf-label" style={{ marginBottom:8 }}>Vista previa de la tarjeta</label>
                    <div style={{ maxWidth:260, border:"1.5px solid var(--vs-200)", borderRadius:16, overflow:"hidden", boxShadow:"0 4px 16px rgba(15,23,42,.07)" }}>
                      <div
                        style={{
                          height:90,
                          background: form.imageUrl ? `url(${form.imageUrl}) center/cover no-repeat` : `${form.accentColor}18`,
                          display:"flex",
                          alignItems:"center",
                          justifyContent:"center",
                          fontSize:12,
                          color:"var(--vs-400)",
                          fontWeight:700,
                        }}
                      >
                        {!form.imageUrl && "Sin imagen"}
                      </div>
                      <div style={{ padding:"12px 14px" }}>
                        <div style={{ fontSize:11, fontWeight:800, color:form.accentColor, textTransform:"uppercase", letterSpacing:".8px", marginBottom:4 }}>
                          {form.category || "Categoría"}
                        </div>
                        <div style={{ fontFamily:"'Lexend',sans-serif", fontSize:15, fontWeight:800, color:"var(--vs-900)", marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {form.name || "Nombre del catálogo"}
                        </div>
                        <div style={{ fontSize:11.5, color:"var(--vs-400)", lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                          {form.description || "Descripción del catálogo..."}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* ─── COMPARTIR ─── */}
            {tab === "Compartir" && (
              <>
                <Card title="Enlace público" subtitle="Comparte tu catálogo con clientes" icon={IcoLink}>
                  <div className="cf-link-box">
                    <div className="cf-link-url">{publicUrl}</div>
                    <div className="cf-link-btns">
                      <button className={`cf-link-btn${copied ? " copied" : ""}`} onClick={copyLink}>
                        {copied ? <><IcoCheck />¡Copiado!</> : <><IcoCopy />Copiar enlace</>}
                      </button>
                      <button className="cf-link-btn" onClick={() => window.open(publicUrl, "_blank")}>
                        <IcoLink />Abrir catálogo
                      </button>
                    </div>
                  </div>
                </Card>

                <Card title="Código QR" subtitle="Descarga el QR de tu catálogo para imprimir o compartir" icon={IcoQR}>
                  <div className="cf-qr-preview">
                    {canGenerateQr ? (
                      qrLoading ? (
                        <span className="cf-qr-msg">Generando QR...</span>
                      ) : qrDataUrl ? (
                        <img className="cf-qr-img" src={qrDataUrl} alt="QR del catálogo" />
                      ) : (
                        <span className="cf-qr-msg">{qrError || "No se pudo generar el QR."}</span>
                      )
                    ) : (
                      <>
                        <IcoQR style={{ width:32, height:32 }} />
                        <span>QR disponible al publicar</span>
                      </>
                    )}
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <button
                      className="cf-btn cf-btn-ghost"
                      style={{ margin:"0 auto" }}
                      onClick={downloadQr}
                      disabled={!qrDataUrl}
                    >
                      <IcoQR />Descargar QR
                    </button>
                  </div>
                </Card>

                <Card title="Redes sociales" subtitle="Comparte directamente en tus canales de venta">
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {[
                      { label:"WhatsApp",  clr:"#25d366", emoji:"💬" },
                      { label:"Instagram", clr:"#e1306c", emoji:"📸" },
                      { label:"Facebook",  clr:"#1877f2", emoji:"📘" },
                    ].map(s => (
                      <button key={s.label} className="cf-btn cf-btn-ghost" style={{ justifyContent:"flex-start", gap:10, padding:"10px 14px" }}>
                        <span style={{ fontSize:18 }}>{s.emoji}</span>
                        <span>Compartir en {s.label}</span>
                      </button>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {/* ─── SEO ─── */}
            {tab === "SEO" && (
              <Card title="SEO y visibilidad" subtitle="Cómo aparece tu catálogo en motores de búsqueda">
                <Field label="Título SEO" hint={`${(form.metaTitle || form.name).length}/60 caracteres`}>
                  <Input
                    placeholder={form.name || "Título para Google..."}
                    value={form.metaTitle}
                    onChange={e => set("metaTitle", e.target.value)}
                    maxLength={60}
                  />
                </Field>
                <Field label="Descripción SEO" hint={`${(form.metaDesc || form.description).length}/160 caracteres`}>
                  <Textarea
                    placeholder={form.description || "Descripción breve para buscadores..."}
                    value={form.metaDesc}
                    onChange={e => set("metaDesc", e.target.value)}
                    maxLength={160}
                    rows={3}
                  />
                </Field>
                <Field label="URL del catálogo">
                  <div className="cf-url-row">
                    <span className="cf-url-pre">catalogix.com/c/</span>
                    <Input value={slug} readOnly style={{ borderRadius:"0 11px 11px 0", borderLeft:"none" }} />
                  </div>
                </Field>

                <div>
                  <label className="cf-label" style={{ marginBottom:9 }}>Vista previa en Google</label>
                  <div className="cf-seo-preview">
                    <div className="cf-seo-url">catalogix.com › c › {slug}</div>
                    <div className="cf-seo-title">{form.metaTitle || form.name || "Nombre del catálogo"}</div>
                    <div className="cf-seo-desc">{form.metaDesc || form.description || "Descripción de tu catálogo. Este texto aparecerá en los resultados de búsqueda."}</div>
                  </div>
                </div>
              </Card>
            )}

          </div>

          {/* ════ COLUMNA LATERAL ════ */}
          <div className="cf-side">

            {/* Estado */}
            <Card title="Estado del catálogo">
              <div className="cf-status-opts">
                {[
                  { val:"active",   label:"Activo",   desc:"Visible para clientes",      dot:"#16a34a" },
                  { val:"draft",    label:"Borrador",  desc:"Solo visible para ti",       dot:"#94a3b8" },
                  { val:"inactive", label:"Inactivo",  desc:"Oculto temporalmente",       dot:"#ef4444" },
                ].map(o => (
                  <div key={o.val} className={`cf-status-opt${form.status === o.val ? ` sel ${o.val}` : ""}`} onClick={() => set("status", o.val)}>
                    <div className="cf-status-dot" style={{ background:o.dot }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="cf-status-name">{o.label}</div>
                      <div className="cf-status-desc">{o.desc}</div>
                    </div>
                    {form.status === o.val && <span className="cf-status-chk"><IcoCheck /></span>}
                  </div>
                ))}
              </div>
            </Card>

            {/* Opciones */}
            <Card title="Opciones">
              <Toggle
                on={form.featured}
                onChange={v => set("featured", v)}
                label="Catálogo destacado"
                desc="Aparece primero en la lista"
                icon={IcoStar}
              />
              <Toggle
                on={form.shared}
                onChange={v => set("shared", v)}
                label="Catálogo público"
                desc="Cualquiera con el enlace puede verlo"
                icon={IcoGlobe}
              />
            </Card>

            {/* Resumen */}
            {selectedCount > 0 && (
              <Card title="Resumen">
                <div>
                  {[
                    { lbl:"Productos en catálogo", val: selectedCount },
                    { lbl:"Activos",    val: form.selectedProducts.filter(id => availableProducts.find(p => p.id === id)?.status === "active").length },
                    { lbl:"Ingresos potenciales",  val: fmt(form.selectedProducts.reduce((s, id) => { const p = availableProducts.find(x => x.id === id); return s + (p?.price || 0); }, 0)) },
                  ].map((r, i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid var(--vs-50)", fontSize:13 }}>
                      <span style={{ color:"var(--vs-500)", fontWeight:500 }}>{r.lbl}</span>
                      <span style={{ fontFamily:"'Lexend',sans-serif", fontWeight:800, color:"var(--vs-800)" }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Enlace rápido lateral */}
            {form.slug && (
              <Card title="Enlace público">
                <div style={{ fontSize:12, color:"var(--vt-600)", wordBreak:"break-all", marginBottom:10, fontWeight:600 }}>
                  {publicUrl}
                </div>
                <button className={`cf-btn cf-btn-ghost${copied ? " copied" : ""}`} style={{ width:"100%", justifyContent:"center", padding:"8px" }} onClick={copyLink}>
                  {copied ? <><IcoCheck />¡Copiado!</> : <><IcoCopy />Copiar enlace</>}
                </button>
              </Card>
            )}

            {/* Guardar móvil */}
            <button
              className={`cf-btn ${saved ? "cf-btn-success" : "cf-btn-primary"}`}
              style={{ width:"100%", justifyContent:"center" }}
              onClick={() => handleSave()}
              disabled={saving}
            >
              {saving ? <><span className="cf-spin"/>Guardando...</>
               : saved ? <><IcoCheck />¡Guardado!</>
               : <><IcoSave />{isEdit ? "Guardar cambios" : "Publicar catálogo"}</>}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}
