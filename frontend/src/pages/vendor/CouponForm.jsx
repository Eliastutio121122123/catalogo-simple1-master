import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import couponService from "../../services/odoo/couponService";
import { vendorCatalogService } from "../../services/odoo/vendorCatalogService";

// ─── Iconos ───────────────────────────────────────────────────────────────────
const IcoBack    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoSave    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IcoCheck   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoWarn    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoRefresh = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IcoPercent = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
const IcoTag     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const IcoClock   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoUsers   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcoInfo    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcoShield  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcoX       = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// ─── Constantes ───────────────────────────────────────────────────────────────
const TABS = ["General", "Restricciones", "Uso"];

const EMPTY_FORM = {
  code: "", description: "",
  type: "percent",          // "percent" | "fixed"
  value: "",
  minOrder: "", maxDiscount: "",
  maxUses: "", maxUsesPerUser: "1",
  expiresAt: "",
  status: "active",
  catalogs: [],             // [] = todos
  onePerCustomer: true,
  newCustomersOnly: false,
};

const FALLBACK_CATALOG_TEXT = "CAT";

const fmt = n => "RD$" + (n || 0).toLocaleString("es-DO");

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
      {hint && !error && <span className="cf-hint">{hint}</span>}
    </div>
  );
}

function Input({ error, prefix, suffix, ...props }) {
  if (prefix || suffix) {
    return (
      <div className="cf-input-group">
        {prefix && <span className="cf-input-addon">{prefix}</span>}
        <input className={`cf-input cf-input-inner${error ? " err" : ""}`} {...props} />
        {suffix && <span className="cf-input-addon cf-input-addon-r">{suffix}</span>}
      </div>
    );
  }
  return <input className={`cf-input${error ? " err" : ""}`} {...props} />;
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
export default function CouponForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id && id !== "new");

  const [ready,   setReady  ] = useState(false);
  const [form,    setForm   ] = useState(EMPTY_FORM);
  const [errors,  setErrors ] = useState({});
  const [saving,  setSaving ] = useState(false);
  const [saved,   setSaved  ] = useState(false);
  const [tab,     setTab    ] = useState("General");
  const [catalogs, setCatalogs] = useState([]);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [catalogsError, setCatalogsError] = useState("");

  useEffect(() => {
    let mounted = true;

    const toFormState = (coupon) => ({
      ...EMPTY_FORM,
      ...coupon,
      value: coupon?.value != null ? String(coupon.value) : "",
      minOrder: coupon?.minOrder != null ? String(coupon.minOrder) : "",
      maxDiscount: coupon?.maxDiscount != null ? String(coupon.maxDiscount) : "",
      maxUses: coupon?.maxUses != null ? String(coupon.maxUses) : "",
      maxUsesPerUser: coupon?.maxUsesPerUser != null ? String(coupon.maxUsesPerUser) : "1",
      catalogs: Array.isArray(coupon?.catalogs) ? coupon.catalogs : [],
    });

    const load = async () => {
      setTimeout(() => setReady(true), 60);
      if (!isEdit) return;
      const coupon = await couponService.getById(id);
      if (mounted && coupon) setForm(toFormState(coupon));
    };

    load();
    return () => { mounted = false; };
  }, [id, isEdit]);

  useEffect(() => {
    let alive = true;
    const loadCatalogs = async () => {
      setCatalogsLoading(true);
      setCatalogsError("");
      try {
        const rows = await vendorCatalogService.list();
        const normalized = (Array.isArray(rows) ? rows : []).map((row) => {
          const name = row.name || "Catalogo";
          const fallback = (name || FALLBACK_CATALOG_TEXT).slice(0, 2).toUpperCase();
          return {
            id: row.id,
            name,
            imageUrl: row.image_url || "",
            fallbackText: fallback,
          };
        });
        if (alive) setCatalogs(normalized);
      } catch (err) {
        if (alive) setCatalogsError(err?.message || "No se pudieron cargar catalogos.");
      } finally {
        if (alive) setCatalogsLoading(false);
      }
    };
    loadCatalogs();
    return () => { alive = false; };
  }, []);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    set("code", code);
  };

  const validate = () => {
    const e = {};
    if (!form.code.trim())            e.code  = "El código es obligatorio";
    else if (!/^[A-Z0-9_-]{3,20}$/i.test(form.code.trim())) e.code = "Solo letras, números, guiones. 3–20 caracteres";
    if (!form.value || isNaN(form.value) || Number(form.value) <= 0)
      e.value = form.type === "percent" ? "Ingresa un porcentaje válido (1–100)" : "Ingresa un monto válido";
    if (form.type === "percent" && Number(form.value) > 100)
      e.value = "El porcentaje no puede superar 100%";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { setTab("General"); return; }
    setSaving(true);
    await couponService.save({
      ...(isEdit ? { id } : {}),
      ...form,
      value: Number(form.value) || 0,
      minOrder: form.minOrder === "" ? null : Number(form.minOrder),
      maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
      maxUses: form.maxUses === "" ? null : Number(form.maxUses),
      maxUsesPerUser: form.maxUsesPerUser === "" ? 1 : Number(form.maxUsesPerUser),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate("/vendor/coupons"), 1400);
  };

  const toggleCatalog = id => {
    set("catalogs", form.catalogs.includes(id)
      ? form.catalogs.filter(x => x !== id)
      : [...form.catalogs, id]
    );
  };

  // Preview del descuento
  const previewBase   = 2500;
  const previewDisc   = form.type === "percent"
    ? Math.min(previewBase * (Number(form.value) / 100), form.maxDiscount ? Number(form.maxDiscount) : Infinity)
    : Number(form.value) || 0;
  const previewTotal  = Math.max(previewBase - previewDisc, 0);
  const hasErrors     = Object.keys(errors).length > 0;

  return (
    <>
      <style>{`
        .cf { opacity:0; transform:translateY(6px); transition:opacity .35s ease, transform .35s ease; }
        .cf.in { opacity:1; transform:translateY(0); }

        /* ── Header ── */
        .cf-header { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
        .cf-back { width:36px; height:36px; border-radius:10px; border:1.5px solid var(--vs-200); background:var(--vw); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--vs-500); transition:all .18s; flex-shrink:0; }
        .cf-back:hover { border-color:var(--vt-400); color:var(--vt-600); }
        .cf-header-info { flex:1; min-width:0; }
        .cf-eyebrow { font-size:11px; font-weight:700; color:var(--vt-600); text-transform:uppercase; letter-spacing:1px; margin-bottom:3px; }
        .cf-h1 { font-family:'Lexend',sans-serif; font-size:clamp(16px,2vw,22px); font-weight:800; color:var(--vs-900); letter-spacing:-.4px; }
        .cf-header-btns { display:flex; gap:8px; flex-wrap:wrap; }
        .cf-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:10px; font-size:13px; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; transition:all .18s; white-space:nowrap; }
        .cf-btn-ghost   { border:1.5px solid var(--vs-200); background:var(--vw); color:var(--vs-600); }
        .cf-btn-ghost:hover { border-color:var(--vs-400); color:var(--vs-800); }
        .cf-btn-primary { border:none; background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); color:white; box-shadow:0 3px 12px rgba(6,182,212,.28); }
        .cf-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(6,182,212,.38); }
        .cf-btn-primary:disabled { opacity:.65; cursor:not-allowed; }
        .cf-btn-success { border:none; background:linear-gradient(135deg,#16a34a,#22c55e); color:white; box-shadow:0 3px 12px rgba(22,163,74,.28); }
        .cf-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:cfspin .65s linear infinite; flex-shrink:0; }
        @keyframes cfspin { to{ transform:rotate(360deg); } }

        /* ── Tabs ── */
        .cf-tabs { display:flex; gap:2px; background:var(--vs-100); border-radius:12px; padding:4px; border:1px solid var(--vs-200); margin-bottom:20px; width:fit-content; }
        .cf-tab  { padding:8px 16px; border-radius:9px; border:none; background:none; font-size:12.5px; font-weight:700; color:var(--vs-400); cursor:pointer; font-family:'Nunito',sans-serif; transition:all .15s; white-space:nowrap; position:relative; }
        .cf-tab.act { background:var(--vw); color:var(--vs-800); box-shadow:0 1px 5px rgba(15,23,42,.1); }
        .cf-tab.has-err::after { content:""; position:absolute; top:7px; right:8px; width:6px; height:6px; border-radius:50%; background:#ef4444; }

        /* ── Layout ── */
        .cf-layout { display:grid; grid-template-columns:1fr 260px; gap:16px; align-items:start; }
        @media(max-width:880px) { .cf-layout { grid-template-columns:1fr; } }
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
        .cf-input-group { display:flex; }
        .cf-input-addon { padding:11px 13px; background:var(--vs-100); border:1.5px solid var(--vs-200); font-size:13px; font-weight:700; color:var(--vs-500); white-space:nowrap; flex-shrink:0; }
        .cf-input-addon:first-child { border-right:none; border-radius:11px 0 0 11px; }
        .cf-input-addon-r { border-left:none; border-right-width:1.5px; border-radius:0 11px 11px 0; }
        .cf-input-inner { border-radius:0; flex:1; }
        .cf-input-inner:focus { border-radius:0; }
        .cf-input-group .cf-input-addon:first-child + .cf-input-inner:last-child { border-radius:0 11px 11px 0; }
        .cf-input-group .cf-input-inner:first-child { border-radius:11px 0 0 11px; }
        .cf-sel-wrap { position:relative; }
        .cf-sel  { appearance:none; cursor:pointer; }
        .cf-sel-wrap::after { content:""; position:absolute; right:13px; top:50%; transform:translateY(-50%); border-left:4px solid transparent; border-right:4px solid transparent; border-top:5px solid var(--vs-400); pointer-events:none; }
        .cf-err  { display:flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:#ef4444; }
        .cf-hint { font-size:11.5px; color:var(--vs-400); }
        .cf-g2   { display:grid; grid-template-columns:1fr 1fr; gap:13px; }
        @media(max-width:500px) { .cf-g2 { grid-template-columns:1fr; } }

        /* ── Tipo de descuento ── */
        .cf-type-opts { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .cf-type-opt  { display:flex; align-items:center; gap:11px; padding:13px 15px; border-radius:13px; border:1.5px solid var(--vs-200); cursor:pointer; transition:all .15s; background:var(--vs-50); }
        .cf-type-opt:hover:not(.sel) { border-color:var(--vs-300); }
        .cf-type-opt.sel { border-color:var(--vt-400); background:rgba(6,182,212,.06); }
        .cf-type-ico  { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:17px; flex-shrink:0; }
        .cf-type-name { font-size:13.5px; font-weight:700; color:var(--vs-800); }
        .cf-type-desc { font-size:11.5px; color:var(--vs-400); margin-top:1px; }
        .cf-type-chk  { margin-left:auto; color:var(--vt-600); display:flex; }

        /* ── Code row ── */
        .cf-code-row { display:flex; gap:8px; }
        .cf-code-row .cf-input { flex:1; font-family:monospace; font-size:15px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
        .cf-gen-btn { padding:11px 13px; border-radius:11px; border:1.5px solid var(--vs-200); background:var(--vs-50); font-size:12.5px; font-weight:700; color:var(--vs-600); font-family:'Nunito',sans-serif; cursor:pointer; transition:all .18s; white-space:nowrap; display:flex; align-items:center; gap:6px; flex-shrink:0; }
        .cf-gen-btn:hover { border-color:var(--vt-400); color:var(--vt-600); background:rgba(6,182,212,.05); }

        /* ── Toggle ── */
        .cf-toggle-row   { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 0; border-bottom:1px solid var(--vs-50); }
        .cf-toggle-row:last-child { border-bottom:none; }
        .cf-toggle-info  { flex:1; min-width:0; }
        .cf-toggle-label { font-size:13.5px; font-weight:700; color:var(--vs-800); margin-bottom:2px; display:flex; align-items:center; gap:6px; }
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
        .cf-status-opt.sel.inactive { border-color:var(--vs-300); background:var(--vs-50); }
        .cf-status-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .cf-status-name { font-size:13px; font-weight:700; color:var(--vs-800); }
        .cf-status-desc { font-size:11.5px; color:var(--vs-400); margin-top:1px; }
        .cf-status-chk  { margin-left:auto; color:var(--vt-600); display:flex; }

        /* ── Catálogos selector ── */
        .cf-cat-all { display:flex; align-items:center; gap:10px; padding:11px 13px; border-radius:12px; border:1.5px solid var(--vt-300); background:rgba(6,182,212,.05); margin-bottom:10px; cursor:pointer; transition:all .15s; }
        .cf-cat-all.off { border-color:var(--vs-200); background:var(--vs-50); }
        .cf-cat-all-ico { width:32px; height:32px; border-radius:9px; background:rgba(6,182,212,.12); display:flex; align-items:center; justify-content:center; font-size:16px; }
        .cf-cat-all-name { font-size:13px; font-weight:700; color:var(--vs-800); }
        .cf-cat-all-sub  { font-size:11.5px; color:var(--vs-400); }
        .cf-cat-all-chk  { margin-left:auto; }
        .cf-cat-list { display:flex; flex-direction:column; gap:6px; }
        .cf-cat-empty { padding:10px 12px; font-size:12.5px; color:var(--vs-500); }
        .cf-cat-item { display:flex; align-items:center; gap:10px; padding:9px 11px; border-radius:11px; border:1.5px solid var(--vs-200); cursor:pointer; transition:all .15s; background:var(--vs-50); }
        .cf-cat-item:hover { border-color:var(--vs-300); }
        .cf-cat-item.sel { border-color:var(--vt-300); background:rgba(6,182,212,.05); }
        .cf-cat-emoji { width:32px; height:32px; border-radius:10px; background:var(--vs-100); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:var(--vs-600); overflow:hidden; flex-shrink:0; border:1px solid var(--vs-200); }
        .cf-cat-emoji img { width:100%; height:100%; object-fit:cover; display:block; }
        .cf-cat-fallback { font-size:10px; letter-spacing:.6px; }
        .cf-cat-name  { font-size:13px; font-weight:600; color:var(--vs-800); flex:1; }
        .cf-cat-chk   { width:18px; height:18px; border-radius:5px; border:1.5px solid var(--vs-300); display:flex; align-items:center; justify-content:center; transition:all .15s; background:var(--vw); flex-shrink:0; }
        .cf-cat-chk.on { background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); border-color:transparent; box-shadow:0 2px 6px rgba(6,182,212,.3); }

        /* ── Preview cupón ── */
        .cf-preview { background:linear-gradient(135deg,#0f2044,#1a3a6e); border-radius:16px; padding:20px; position:relative; overflow:hidden; }
        .cf-preview::before { content:""; position:absolute; inset:0; background-image:repeating-linear-gradient(-55deg,transparent 0,transparent 18px,rgba(6,182,212,.04) 18px,rgba(6,182,212,.04) 20px); }
        .cf-preview-dots { position:absolute; top:0; bottom:0; left:50%; width:0; display:flex; flex-direction:column; justify-content:space-between; padding:0; transform:translateX(-50%); gap:0; }
        .cf-preview-dot  { width:22px; height:22px; border-radius:50%; background:var(--vbg,#f8fafc); flex-shrink:0; margin:0 -11px; }
        .cf-preview-top  { position:relative; z-index:1; display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
        .cf-preview-val  { font-family:'Lexend',sans-serif; font-size:36px; font-weight:800; color:white; line-height:1; }
        .cf-preview-type { font-size:12px; font-weight:700; color:rgba(255,255,255,.6); text-transform:uppercase; letter-spacing:1px; margin-top:4px; }
        .cf-preview-code-lbl { font-size:10px; font-weight:700; color:rgba(255,255,255,.5); text-transform:uppercase; letter-spacing:1.2px; margin-bottom:5px; }
        .cf-preview-code { font-family:monospace; font-size:18px; font-weight:800; color:white; letter-spacing:2px; background:rgba(255,255,255,.1); padding:7px 13px; border-radius:9px; border:1px dashed rgba(255,255,255,.25); }
        .cf-preview-bottom { position:relative; z-index:1; border-top:1px dashed rgba(255,255,255,.2); margin-top:16px; padding-top:14px; display:flex; justify-content:space-between; align-items:center; }
        .cf-preview-info { font-size:11.5px; color:rgba(255,255,255,.55); display:flex; align-items:center; gap:5px; }

        /* ── Resumen de ahorro ── */
        .cf-summary { background:var(--vw); border:1px solid var(--vs-200); border-radius:14px; overflow:hidden; }
        .cf-summary-head { padding:12px 16px; background:var(--vs-50); border-bottom:1px solid var(--vs-100); font-size:11px; font-weight:800; color:var(--vs-500); text-transform:uppercase; letter-spacing:.7px; }
        .cf-summary-body { padding:13px 16px; display:flex; flex-direction:column; gap:8px; }
        .cf-summary-row  { display:flex; justify-content:space-between; align-items:center; font-size:13px; color:var(--vs-600); font-weight:500; }
        .cf-summary-row.total { font-weight:800; color:var(--vs-900); font-size:14px; padding-top:8px; border-top:1px solid var(--vs-100); margin-top:2px; }
        .cf-summary-disc { color:#ef4444; font-weight:700; }
        .cf-summary-note { font-size:11px; color:var(--vs-400); padding:0 16px 12px; }

        /* ── Toast ── */
        .cf-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--vs-900); color:white; font-size:13px; font-weight:700; padding:10px 20px; border-radius:100px; box-shadow:0 6px 24px rgba(15,23,42,.25); z-index:300; animation:cftoast .25s ease; font-family:'Nunito',sans-serif; display:flex; align-items:center; gap:8px; }
        @keyframes cftoast { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>

      {saved && (
        <div className="cf-toast"><IcoCheck />Cupón guardado exitosamente</div>
      )}

      <div className={`cf${ready ? " in" : ""}`}>

        {/* ── Header ── */}
        <div className="cf-header">
          <button className="cf-back" onClick={() => navigate("/vendor/coupons")}>
            <IcoBack />
          </button>
          <div className="cf-header-info">
            <div className="cf-eyebrow">{isEdit ? "Editar cupón" : "Nuevo cupón"}</div>
            <h1 className="cf-h1">{isEdit ? form.code || "Cupón" : "Crear cupón de descuento"}</h1>
          </div>
          <div className="cf-header-btns">
            <button className="cf-btn cf-btn-ghost" onClick={() => navigate("/vendor/coupons")}>
              Cancelar
            </button>
            <button
              className={`cf-btn ${saved ? "cf-btn-success" : "cf-btn-primary"}`}
              onClick={handleSave}
              disabled={saving || saved}
            >
              {saved   ? <><IcoCheck />Guardado</> :
               saving  ? <><span className="cf-spin"/>Guardando...</> :
                          <><IcoSave />Guardar cupón</>}
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="cf-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`cf-tab${tab===t?" act":""}${t==="General"&&hasErrors?" has-err":""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="cf-layout">
          <div className="cf-main">

            {/* ══ TAB: GENERAL ══ */}
            {tab === "General" && (
              <>
                {/* Tipo de descuento */}
                <Card title="Tipo de descuento" icon={IcoTag} subtitle="¿Cómo quieres que aplique el descuento?">
                  <div className="cf-type-opts">
                    {[
                      { val:"percent", ico:"%",  name:"Porcentaje", desc:"Ej: 20% de descuento" },
                      { val:"fixed",   ico:"$",  name:"Monto fijo", desc:"Ej: RD$500 de descuento" },
                    ].map(t => (
                      <div
                        key={t.val}
                        className={`cf-type-opt${form.type===t.val?" sel":""}`}
                        onClick={() => set("type", t.val)}
                      >
                        <div className="cf-type-ico" style={{ background: t.val==="percent" ? "rgba(6,182,212,.12)" : "rgba(99,102,241,.12)" }}>
                          {t.ico}
                        </div>
                        <div>
                          <div className="cf-type-name">{t.name}</div>
                          <div className="cf-type-desc">{t.desc}</div>
                        </div>
                        {form.type===t.val && <span className="cf-type-chk"><IcoCheck /></span>}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Código y descripción */}
                <Card title="Información del cupón" icon={IcoInfo}>
                  <Field label="Código del cupón" required error={errors.code} hint="Solo letras mayúsculas, números y guiones. Ej: VERANO25">
                    <div className="cf-code-row">
                      <input
                        className={`cf-input${errors.code?" err":""}`}
                        style={{ fontFamily:"monospace", fontSize:15, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}
                        placeholder="VERANO25"
                        value={form.code}
                        onChange={e => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 20))}
                        maxLength={20}
                      />
                      <button type="button" className="cf-gen-btn" onClick={generateCode}>
                        <IcoRefresh />Generar
                      </button>
                    </div>
                  </Field>

                  <Field label="Descripción" hint="Visible solo para ti en el panel">
                    <textarea
                      className="cf-input"
                      style={{ minHeight:72, resize:"vertical", lineHeight:1.6 }}
                      placeholder="Ej: Descuento de verano para clientes frecuentes"
                      value={form.description}
                      onChange={e => set("description", e.target.value)}
                      maxLength={200}
                    />
                  </Field>
                </Card>

                {/* Valor */}
                <Card title="Valor del descuento" icon={IcoPercent}>
                  <div className="cf-g2">
                    <Field
                      label={form.type === "percent" ? "Porcentaje de descuento" : "Monto de descuento"}
                      required
                      error={errors.value}
                    >
                      <Input
                        type="number"
                        min={1}
                        max={form.type === "percent" ? 100 : undefined}
                        placeholder={form.type === "percent" ? "20" : "500"}
                        suffix={form.type === "percent" ? "%" : "RD$"}
                        value={form.value}
                        onChange={e => set("value", e.target.value)}
                        error={errors.value}
                      />
                    </Field>

                    {form.type === "percent" && (
                      <Field label="Descuento máximo" hint="Opcional — limita el monto máximo">
                        <Input
                          type="number"
                          min={0}
                          placeholder="1000"
                          prefix="RD$"
                          value={form.maxDiscount}
                          onChange={e => set("maxDiscount", e.target.value)}
                        />
                      </Field>
                    )}
                  </div>
                </Card>
              </>
            )}

            {/* ══ TAB: RESTRICCIONES ══ */}
            {tab === "Restricciones" && (
              <>
                <Card title="Condiciones de compra" icon={IcoShield} subtitle="Define cuándo puede usarse el cupón">
                  <div className="cf-g2">
                    <Field label="Compra mínima" hint="Opcional — monto mínimo del pedido">
                      <Input
                        type="number"
                        min={0}
                        placeholder="1500"
                        prefix="RD$"
                        value={form.minOrder}
                        onChange={e => set("minOrder", e.target.value)}
                      />
                    </Field>
                    <Field label="Fecha de expiración" hint="Opcional — el cupón expira a medianoche">
                      <input
                        className="cf-input"
                        type="date"
                        value={form.expiresAt}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={e => set("expiresAt", e.target.value)}
                      />
                    </Field>
                  </div>
                </Card>

                {/* Catálogos */}
                <Card title="Catálogos aplicables" icon={IcoTag} subtitle="¿A qué catálogos aplica este cupón?">
                  <div
                    className={`cf-cat-all${form.catalogs.length > 0 ? " off" : ""}`}
                    onClick={() => set("catalogs", [])}
                  >
                    <div className="cf-cat-all-ico">🌐</div>
                    <div>
                      <div className="cf-cat-all-name">Todos los catálogos</div>
                      <div className="cf-cat-all-sub">El cupón aplica a cualquier catálogo</div>
                    </div>
                    <div className="cf-cat-all-chk">
                      <div className={`cf-cat-chk${form.catalogs.length===0?" on":""}`}>
                        {form.catalogs.length===0 && <IcoCheck />}
                      </div>
                    </div>
                  </div>
                  <div className="cf-cat-list">
                    {catalogsLoading && (
                      <div className="cf-cat-empty">Cargando catalogos...</div>
                    )}
                    {!catalogsLoading && catalogsError && (
                      <div className="cf-cat-empty">{catalogsError}</div>
                    )}
                    {!catalogsLoading && !catalogsError && catalogs.length === 0 && (
                      <div className="cf-cat-empty">No hay catalogos disponibles.</div>
                    )}
                    {!catalogsLoading && !catalogsError && catalogs.map(cat => {
                      const sel = form.catalogs.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          className={`cf-cat-item${sel?" sel":""}`}
                          onClick={() => toggleCatalog(cat.id)}
                        >
                          <span className="cf-cat-emoji">
                            {cat.imageUrl ? (
                              <img src={cat.imageUrl} alt={cat.name} loading="lazy" />
                            ) : (
                              <span className="cf-cat-fallback">{cat.fallbackText}</span>
                            )}
                          </span>
                          <span className="cf-cat-name">{cat.name}</span>
                          <div className={`cf-cat-chk${sel?" on":""}`}>
                            {sel && <IcoCheck />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </>
            )}

            {/* ══ TAB: USO ══ */}
            {tab === "Uso" && (
              <>
                <Card title="Límites de uso" icon={IcoUsers} subtitle="Controla cuántas veces puede usarse el cupón">
                  <div className="cf-g2">
                    <Field label="Usos totales permitidos" hint="Opcional — deja vacío para usos ilimitados">
                      <Input
                        type="number"
                        min={1}
                        placeholder="100"
                        value={form.maxUses}
                        onChange={e => set("maxUses", e.target.value)}
                      />
                    </Field>
                    <Field label="Usos por cliente" hint="Cuántas veces puede usarlo cada cliente">
                      <Input
                        type="number"
                        min={1}
                        placeholder="1"
                        value={form.maxUsesPerUser}
                        onChange={e => set("maxUsesPerUser", e.target.value)}
                      />
                    </Field>
                  </div>
                </Card>

                <Card title="Restricciones de clientes" icon={IcoShield}>
                  <Toggle
                    on={form.onePerCustomer}
                    onChange={v => set("onePerCustomer", v)}
                    label="Un uso por cliente"
                    desc="Cada cliente solo puede canjear este cupón una vez"
                    icon={IcoUsers}
                  />
                  <Toggle
                    on={form.newCustomersOnly}
                    onChange={v => set("newCustomersOnly", v)}
                    label="Solo clientes nuevos"
                    desc="El cupón aplica únicamente a clientes sin órdenes previas"
                    icon={IcoShield}
                  />
                </Card>
              </>
            )}

          </div>

          {/* ── Sidebar ── */}
          <div className="cf-side">

            {/* Estado */}
            <Card title="Estado">
              <div className="cf-status-opts">
                {[
                  { val:"active",   dot:"#16a34a", name:"Activo",   desc:"El cupón está disponible para uso" },
                  { val:"inactive", dot:"#94a3b8", name:"Inactivo", desc:"El cupón está desactivado" },
                ].map(s => (
                  <div
                    key={s.val}
                    className={`cf-status-opt${form.status===s.val?` sel ${s.val}`:""}`}
                    onClick={() => set("status", s.val)}
                  >
                    <div className="cf-status-dot" style={{ background:s.dot }}/>
                    <div>
                      <div className="cf-status-name">{s.name}</div>
                      <div className="cf-status-desc">{s.desc}</div>
                    </div>
                    {form.status===s.val && <span className="cf-status-chk"><IcoCheck /></span>}
                  </div>
                ))}
              </div>
            </Card>

            {/* Preview visual del cupón */}
            <div className="cf-preview">
              <div className="cf-preview-top">
                <div>
                  <div className="cf-preview-val">
                    {form.value ? (form.type==="percent" ? `${form.value}%` : `RD$${Number(form.value).toLocaleString("es-DO")}`) : "—"}
                  </div>
                  <div className="cf-preview-type">
                    {form.type === "percent" ? "de descuento" : "de descuento fijo"}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div className="cf-preview-code-lbl">Código</div>
                  <div className="cf-preview-code">{form.code || "CÓDIGO"}</div>
                </div>
              </div>
              <div className="cf-preview-bottom">
                <div className="cf-preview-info">
                  <IcoClock />
                  {form.expiresAt
                    ? `Expira ${new Date(form.expiresAt).toLocaleDateString("es-DO",{day:"2-digit",month:"short",year:"numeric"})}`
                    : "Sin vencimiento"}
                </div>
                <div className="cf-preview-info">
                  <IcoUsers />
                  {form.maxUses ? `/${form.maxUses} usos` : "Ilimitado"}
                </div>
              </div>
            </div>

            {/* Resumen de ahorro */}
            {form.value && Number(form.value) > 0 && (
              <div className="cf-summary">
                <div className="cf-summary-head">Ejemplo de ahorro</div>
                <div className="cf-summary-body">
                  <div className="cf-summary-row">
                    <span>Pedido base</span>
                    <span>{fmt(previewBase)}</span>
                  </div>
                  <div className="cf-summary-row">
                    <span>Descuento aplicado</span>
                    <span className="cf-summary-disc">−{fmt(previewDisc)}</span>
                  </div>
                  <div className="cf-summary-row total">
                    <span>Total a pagar</span>
                    <span>{fmt(previewTotal)}</span>
                  </div>
                </div>
                <div className="cf-summary-note">
                  Basado en un pedido de {fmt(previewBase)}
                  {form.maxDiscount && form.type==="percent" ? ` · Máx. ${fmt(form.maxDiscount)}` : ""}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}


