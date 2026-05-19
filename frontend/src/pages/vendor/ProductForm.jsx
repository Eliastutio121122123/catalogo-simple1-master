import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import vendorProductService from "../../services/odoo/vendorProductService";
import { vendorCatalogService } from "../../services/odoo/vendorCatalogService";
import useCurrency from "../../hooks/useCurrency";
import { toImageDataUrl } from "../../utils/imageDataUrl";
import { formatMoney, symbolForCurrency } from "../../utils/formatCurrency";

// ─── Iconos ───────────────────────────────────────────────────────────────────
const IcoBack    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoSave    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IcoPlus    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoX       = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoUpload  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
const IcoTrash   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
const IcoInfo    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcoCheck   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoRefresh = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IcoTag     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const IcoStar    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoWarn    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

// ─── Constantes ───────────────────────────────────────────────────────────────
const CATEGORIES  = ["Moda","Deportes","Belleza","Alimentos","Hogar","Electrónica","Servicios","Otros"];
const CATALOGS    = ["Nova Style","FitLife Store","Glam Beauty Box","Gourmet RD","Casa & Deco","Tech Plus"];
const UNITS       = ["unidad","par","caja","kit","litro","kg","gramo","paquete","docena"];
const COLORS_PRE  = ["#ef4444","#f97316","#eab308","#22c55e","#06b6d4","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#64748b","#1e293b","#fafafa"];
const SIZES_PRE   = ["XS","S","M","L","XL","XXL","Único","28","30","32","34","36","38","40","42"];

const EMPTY = {
  name:"", sku:"", description:"", category:"", catalog:"",
  price:"", comparePrice:"", cost:"", currency:"DOP", unit:"unidad",
  stock:"", minStock:"5", weight:"",
  status:"draft", featured:false, taxable:true,
  images:[], tags:[],
  colors:[], sizes:[],
};

const MOCK_EDIT = {
  name:"Vestido Floral Verano", sku:"VFV-001",
  description:"Hermoso vestido floral perfecto para el verano. Tela liviana y transpirable, ideal para el clima caribeño. Disponible en múltiples colores y tallas.",
  category:"Moda", catalog:"Nova Style",
  price:"1850", comparePrice:"2200", cost:"750", currency:"DOP", unit:"unidad",
  stock:"8", minStock:"5", weight:"0.3",
  status:"active", featured:true, taxable:true,
  images:[], tags:["verano","vestido","floral"],
  colors:["#ef4444","#ec4899","#f97316"], sizes:["XS","S","M","L","XL"],
};

const fromApiProduct = (product) => {
  if (!product) return { ...EMPTY };
  const categ = Array.isArray(product.categ_id) ? product.categ_id[1] : "";
  const catalog = Array.isArray(product.catalog_id) ? product.catalog_id[1] : "";
  const currency = Array.isArray(product.currency_id) ? product.currency_id[1] : (product.currency_id || "DOP");
  const imagesBase64 = Array.isArray(product.images_base64) ? product.images_base64.slice(0, 4) : [];
  const images = imagesBase64.map(toImageDataUrl).filter(Boolean);

  const colorsFromApi = Array.isArray(product.colors) ? product.colors : [];
  let colors = colorsFromApi
    .map((c) => {
      if (!c) return null;
      if (typeof c === "string") return c;
      if (typeof c.hex === "string" && c.hex.trim()) return c.hex.trim();
      if (typeof c.name === "string" && c.name.trim().startsWith("#")) return c.name.trim();
      return null;
    })
    .filter(Boolean);

  const sizesFromApi = Array.isArray(product.sizes) ? product.sizes : [];
  let sizes = sizesFromApi.filter(Boolean).map(String);

  // Don't treat storefront fallbacks as real variants in the vendor form.
  if (colors.length === 1 && String(colors[0]).toLowerCase() === "#94a3b8") colors = [];
  if (sizes.length === 1 && sizes[0].toLowerCase() === "único") sizes = [];
  return {
    ...EMPTY,
    name: product.name || "",
    sku: product.default_code || "",
    description: product.description_sale || "",
    category: categ || "",
    catalog: catalog || "",
    price: product.list_price != null ? String(product.list_price) : "",
    cost: product.standard_price != null ? String(product.standard_price) : "",
    currency: String(currency || "DOP").toUpperCase(),
    stock: product.catalog_stock_qty != null
      ? String(product.catalog_stock_qty)
      : (product.qty_available != null ? String(product.qty_available) : ""),
    minStock: product.min_stock != null ? String(product.min_stock) : "5",
    status: product.active === false ? "inactive" : "active",
    images,
    colors,
    sizes,
  };
};

const TABS = ["General","Imágenes","Precios","Inventario","Variantes","SEO"];

// ─── Mini componentes ─────────────────────────────────────────────────────────
function Card({ title, subtitle, children }) {
  return (
    <div className="pf-card">
      <div className="pf-card-head">
        <p className="pf-card-title">{title}</p>
        {subtitle && <p className="pf-card-sub">{subtitle}</p>}
      </div>
      <div className="pf-card-body">{children}</div>
    </div>
  );
}

function Field({ label, required, error, hint, children, row }) {
  return (
    <div className={`pf-field${row ? " row" : ""}`}>
      {label && (
        <label className="pf-label">
          {label}{required && <span className="pf-req">*</span>}
        </label>
      )}
      {children}
      {error && <span className="pf-err"><IcoWarn />{error}</span>}
      {hint && !error && <span className="pf-hint">{hint}</span>}
    </div>
  );
}

function Input({ error, className="", ...props }) {
  return <input className={`pf-input${error ? " err" : ""} ${className}`} {...props} />;
}

function Textarea({ error, ...props }) {
  return <textarea className={`pf-input pf-ta${error ? " err" : ""}`} {...props} />;
}

function Sel({ error, children, ...props }) {
  return (
    <div className="pf-sel-wrap">
      <select className={`pf-input pf-sel${error ? " err" : ""}`} {...props}>{children}</select>
    </div>
  );
}

function Toggle({ on, onChange, label, desc, icon: Icon }) {
  return (
    <div className="pf-toggle-row">
      <div className="pf-toggle-info">
        <div className="pf-toggle-label">{Icon && <Icon />}{label}</div>
        {desc && <div className="pf-toggle-desc">{desc}</div>}
      </div>
      <button type="button" className={`pf-toggle ${on ? "on" : "off"}`} onClick={() => onChange(!on)}>
        <div className="pf-toggle-knob"/>
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProductForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id && id !== "new");

  const MAX_IMAGES = 4;
  const { currencies, byCode, base } = useCurrency();

  const [ready,    setReady   ] = useState(false);
  const [form,     setForm    ] = useState(isEdit ? MOCK_EDIT : EMPTY);
  const [errors,   setErrors  ] = useState({});
  const [saving,   setSaving  ] = useState(false);
  const [saved,    setSaved   ] = useState(false);
  const [loading,  setLoading ] = useState(false);
  const [saveError,setSaveError] = useState("");
  const [catalogOptions, setCatalogOptions] = useState(CATALOGS);
  const [tab,      setTab     ] = useState("General");
  const [tagInput, setTagInput] = useState("");
  const [newSize,  setNewSize ] = useState("");
  const [imageBase64s, setImageBase64s] = useState([]);
  const [imageChanged, setImageChanged] = useState(false);
  const imageInputRef = useRef(null);
  const [dzActive, setDzActive] = useState(false);
  const dragCounterRef = useRef(0);

  const currencyOptions = (currencies && currencies.length)
    ? currencies
    : [
        { code: "DOP", symbol: "RD$", name: "Peso dominicano" },
        { code: "USD", symbol: "$", name: "DÃ³lar estadounidense" },
        { code: "EUR", symbol: "â‚¬", name: "Euro" },
      ];
  const currencySymbol = symbolForCurrency(form?.currency, byCode);
  const baseCurrencyCode = String(base || "").trim().toUpperCase();

  // If the form has a currency that isn't available from the API (e.g. default "DOP"
  // while Odoo only has "USD" active), switch to a valid default to prevent save errors.
  useEffect(() => {
    if (isEdit) return;
    const hasOptions = Array.isArray(currencyOptions) && currencyOptions.length > 0;
    if (!hasOptions) return;

    const current = String(form?.currency || "").trim().toUpperCase();
    const isCurrentValid = !!(current && byCode && byCode[current]);
    if (isCurrentValid) return;

    const baseValid = !!(baseCurrencyCode && byCode && byCode[baseCurrencyCode]);
    const fallback = baseValid
      ? baseCurrencyCode
      : String(currencyOptions[0]?.code || "").trim().toUpperCase();

    if (fallback && fallback !== current) setForm((f) => ({ ...f, currency: fallback }));
  }, [isEdit, byCode, baseCurrencyCode, currencyOptions, form?.currency]);

  useEffect(() => { setTimeout(() => setReady(true), 60); }, []);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    setLoading(true);
    setSaveError("");
    vendorProductService.getById(id)
      .then((product) => {
        if (!active) return;
        setForm(fromApiProduct(product));
        setImageBase64s(Array.isArray(product?.images_base64) ? product.images_base64.slice(0, MAX_IMAGES) : []);
        setImageChanged(false);
      })
      .catch((err) => {
        if (!active) return;
        setSaveError(err?.message || "No se pudo cargar el producto.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => { active = false; };
  }, [id, isEdit]);

  useEffect(() => {
    let active = true;
    vendorCatalogService.list()
      .then((rows) => {
        if (!active) return;
        const names = Array.isArray(rows) ? rows.map(r => r.name).filter(Boolean) : [];
        if (names.length) {
          const uniq = Array.from(new Set(names));
          setCatalogOptions(uniq);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const genSKU = () => {
    const words  = form.name.trim().toUpperCase().split(" ").slice(0, 3);
    const prefix = words.map(w => w.slice(0, 2)).join("").slice(0, 6);
    const num    = String(Math.floor(Math.random() * 900) + 100);
    set("sku", `${prefix}-${num}`);
  };

  const addTag = val => {
    const t = val.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-áéíóúñ]/g, "");
    if (t && !form.tags.includes(t) && form.tags.length < 15) set("tags", [...form.tags, t]);
    setTagInput("");
  };

  const toggleColor = hex => set("colors", form.colors.includes(hex) ? form.colors.filter(c => c !== hex) : [...form.colors, hex]);
  const toggleSize  = s   => set("sizes",  form.sizes.includes(s)   ? form.sizes.filter(x => x !== s)   : [...form.sizes, s]);

  const readAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });

  const loadImageFromFile = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo decodificar la imagen."));
    };
    img.src = url;
  });

  const rasterizeFileToJpeg = async (file) => {
    const maxDim = 1400;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo procesar la imagen.");

    const draw = (source, iw, ih) => {
      const scale = Math.min(1, maxDim / Math.max(iw, ih));
      const w = Math.max(1, Math.round(iw * scale));
      const h = Math.max(1, Math.round(ih * scale));
      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(source, 0, 0, w, h);
      return canvas.toDataURL("image/jpeg", 0.92);
    };

    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(file);
        try {
          return draw(bitmap, bitmap.width, bitmap.height);
        } finally {
          if (typeof bitmap.close === "function") bitmap.close();
        }
      } catch {
        // fallback a <img> con objectURL
      }
    }

    const img = await loadImageFromFile(file);
    const iw = img.naturalWidth || img.width || 0;
    const ih = img.naturalHeight || img.height || 0;
    if (!iw || !ih) throw new Error("Imagen inválida.");
    return draw(img, iw, ih);
  };

  const normalizeImageFileToDataUrl = async (file) => {
    const type = String(file?.type || "").toLowerCase();
    if (type === "image/jpeg" || type === "image/png") {
      return await readAsDataURL(file);
    }
    // Convierte WEBP/AVIF/BMP/GIF/etc a JPG usando canvas.
    return await rasterizeFileToJpeg(file);
  };

  const base64ByteSize = (b64) => {
    if (!b64) return 0;
    const clean = String(b64).trim().replace(/\s+/g, "");
    const padMatch = clean.match(/=+$/);
    const pad = padMatch ? padMatch[0].length : 0;
    const bytes = Math.floor((clean.length * 3) / 4) - pad;
    return Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  };

  const handleImageFiles = async (files) => {
    const picked = Array.from(files || []).filter(Boolean);
    if (!picked.length) return;

    const currentImages = Array.isArray(form.images) ? form.images.filter(Boolean).slice(0, MAX_IMAGES) : [];
    const currentBase64s = Array.isArray(imageBase64s) ? imageBase64s.filter(Boolean).slice(0, MAX_IMAGES) : [];
    const spacesLeft = MAX_IMAGES - currentImages.length;
    if (spacesLeft <= 0) return;

    const maxBytes = 5 * 1024 * 1024;
    const filesToProcess = picked.slice(0, spacesLeft);

    const nextImages = [...currentImages];
    const nextBase64s = [...currentBase64s];

    let added = 0;
    for (const file of filesToProcess) {
      if (!file || !String(file.type || "").startsWith("image/")) continue;
      if (file.size && file.size > maxBytes) continue;
      try {
        const dataUrl = await normalizeImageFileToDataUrl(file);
        const base64 = dataUrl.includes(",") ? dataUrl.split(",", 2)[1] : "";
        if (!base64) continue;
        if (base64ByteSize(base64) > maxBytes) continue;
        nextImages.push(dataUrl);
        nextBase64s.push(base64);
        added += 1;
      } catch {
        // Silencioso: si una imagen falla, no bloquea el resto.
      }
      if (nextImages.length >= MAX_IMAGES) break;
    }

    if (!added) {
      setSaveError("No se pudo procesar ninguna imagen seleccionada.");
      setTab("Imágenes");
      return;
    }

    setSaveError("");
    setForm((f) => ({ ...f, images: nextImages }));
    setImageBase64s(nextBase64s);
    setImageChanged(true);
  };

  const openImagePicker = () => {
    if (!canAddMoreImages) return;
    imageInputRef.current?.click();
  };

  const onDzDragEnter = (e) => {
    if (!canAddMoreImages) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setDzActive(true);
  };

  const onDzDragOver = (e) => {
    if (!canAddMoreImages) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const onDzDragLeave = (e) => {
    if (!canAddMoreImages) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDzActive(false);
    }
  };

  const onDzDrop = (e) => {
    if (!canAddMoreImages) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setDzActive(false);
    const fs = e.dataTransfer?.files;
    if (fs && fs.length) handleImageFiles(fs);
  };

  const removeImage = (index) => {
    setForm(f => {
      const images = [...f.images.filter(Boolean)];
      images.splice(index, 1);
      return { ...f, images };
    });
    setImageBase64s(prev => {
      const next = [...prev.filter(Boolean)];
      next.splice(index, 1);
      return next;
    });
    setImageChanged(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name     = "El nombre es obligatorio";
    if (!form.category)       e.category = "Selecciona una categoría";
    if (!form.catalog)        e.catalog  = "Selecciona un catálogo";
    if (!form.price)          e.price    = "El precio es obligatorio";
    else if (+form.price <= 0) e.price   = "El precio debe ser mayor a 0";
    if (form.stock === "")    e.stock    = "El stock es obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (status = form.status) => {
    if (!validate()) { setTab("General"); return; }
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        description: form.description,
        category: form.category,
        catalog: form.catalog,
        price: form.price,
        cost: form.cost,
        currency: form.currency,
        status,
        colors: form.colors,
        sizes: form.sizes,
        stock: form.stock,
        minStock: form.minStock,
      };
      if (imageChanged) {
        payload.images_base64 = imageBase64s.filter(Boolean).slice(0, MAX_IMAGES);
      }
      if (isEdit) {
        await vendorProductService.update(id, payload);
      } else {
        await vendorProductService.create(payload);
      }
      setSaved(true);
      setTimeout(() => { navigate("/vendor/products"); }, 900);
    } catch (err) {
      setSaveError(err?.message || "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const margin = form.price && form.cost && +form.price > 0
    ? Math.round(((+form.price - +form.cost) / +form.price) * 100)
    : null;
  const discount = form.comparePrice && +form.comparePrice > +form.price && +form.price > 0
    ? Math.round((1 - +form.price / +form.comparePrice) * 100)
    : null;

  const hasErrors = Object.keys(errors).length > 0;
  const uploadedImages = Array.isArray(form.images) ? form.images.filter(Boolean).slice(0, MAX_IMAGES) : [];
  const canAddMoreImages = uploadedImages.length < MAX_IMAGES;
  const slug = (form.name || "nombre-del-producto")
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60);

  return (
    <>
      <style>{`
        .pf { opacity:0; transform:translateY(6px); transition:opacity .35s ease, transform .35s ease; }
        .pf.in { opacity:1; transform:translateY(0); }

        /* ── Header ── */
        .pf-header { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
        .pf-back-btn { width:36px; height:36px; border-radius:10px; border:1.5px solid var(--vs-200); background:var(--vw); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--vs-500); transition:all .18s; flex-shrink:0; }
        .pf-back-btn:hover { border-color:var(--vt-400); color:var(--vt-600); }
        .pf-header-info { flex:1; min-width:0; }
        .pf-eyebrow { font-size:11px; font-weight:700; color:var(--vt-600); text-transform:uppercase; letter-spacing:1px; margin-bottom:3px; }
        .pf-h1 { font-family:'Lexend',sans-serif; font-size:clamp(16px,2vw,22px); font-weight:800; color:var(--vs-900); letter-spacing:-.4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .pf-header-btns { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .pf-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:10px; font-size:13px; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; transition:all .18s; white-space:nowrap; }
        .pf-btn-ghost   { border:1.5px solid var(--vs-200); background:var(--vw); color:var(--vs-600); }
        .pf-btn-ghost:hover { border-color:var(--vs-400); color:var(--vs-800); }
        .pf-btn-draft   { border:1.5px solid var(--vs-300); background:var(--vs-100); color:var(--vs-700); }
        .pf-btn-draft:hover { background:var(--vs-200); }
        .pf-btn-primary { border:none; background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); color:white; box-shadow:0 3px 12px rgba(6,182,212,.28); }
        .pf-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(6,182,212,.38); }
        .pf-btn-primary:disabled { opacity:.65; cursor:not-allowed; }
        .pf-btn-success { border:none; background:linear-gradient(135deg,#16a34a,#22c55e); color:white; box-shadow:0 3px 12px rgba(22,163,74,.28); }
        .pf-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:pfspin .65s linear infinite; flex-shrink:0; }
        @keyframes pfspin { to{ transform:rotate(360deg); } }

        /* ── Tabs ── */
        .pf-tabs { display:flex; gap:2px; background:var(--vs-100); border-radius:12px; padding:4px; border:1px solid var(--vs-200); margin-bottom:20px; width:fit-content; flex-wrap:wrap; }
        .pf-tab  { padding:8px 15px; border-radius:9px; border:none; background:none; font-size:12.5px; font-weight:700; color:var(--vs-400); cursor:pointer; font-family:'Nunito',sans-serif; transition:all .15s; white-space:nowrap; position:relative; }
        .pf-tab.act { background:var(--vw); color:var(--vs-800); box-shadow:0 1px 5px rgba(15,23,42,.1); }
        .pf-tab.has-err::after { content:""; position:absolute; top:7px; right:8px; width:6px; height:6px; border-radius:50%; background:#ef4444; }

        /* ── Layout ── */
        .pf-layout { display:grid; grid-template-columns:1fr 270px; gap:16px; align-items:start; }
        @media(max-width:940px) { .pf-layout { grid-template-columns:1fr; } }
        .pf-main { display:flex; flex-direction:column; gap:16px; }
        .pf-side { display:flex; flex-direction:column; gap:14px; }

        /* ── Card ── */
        .pf-card { background:var(--vw); border-radius:18px; border:1px solid var(--vs-200); box-shadow:0 2px 8px rgba(15,23,42,.04); overflow:hidden; }
        .pf-card-head  { padding:15px 20px 11px; border-bottom:1px solid var(--vs-100); }
        .pf-card-title { font-family:'Lexend',sans-serif; font-size:14px; font-weight:800; color:var(--vs-900); margin-bottom:2px; }
        .pf-card-sub   { font-size:12px; color:var(--vs-400); font-weight:400; }
        .pf-card-body  { padding:18px 20px; display:flex; flex-direction:column; gap:15px; }

        /* ── Campos ── */
        .pf-field { display:flex; flex-direction:column; gap:5px; }
        .pf-field.row { flex-direction:row; align-items:center; justify-content:space-between; }
        .pf-label { font-size:11px; font-weight:800; color:var(--vs-500); text-transform:uppercase; letter-spacing:.7px; display:flex; align-items:center; gap:4px; }
        .pf-req   { color:#ef4444; }
        .pf-input { width:100%; padding:11px 14px; border:1.5px solid var(--vs-200); border-radius:11px; background:var(--vs-50); font-size:14px; font-weight:500; color:var(--vs-900); font-family:'Nunito',sans-serif; outline:none; transition:all .2s; }
        .pf-input:focus { border-color:var(--vt-500); background:var(--vw); box-shadow:0 0 0 3px rgba(6,182,212,.1); }
        .pf-input.err   { border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,.08); }
        .pf-input::placeholder { color:var(--vs-400); font-weight:400; }
        .pf-ta  { min-height:100px; resize:vertical; line-height:1.65; }
        .pf-sel-wrap { position:relative; }
        .pf-sel  { appearance:none; cursor:pointer; }
        .pf-sel-wrap::after { content:""; position:absolute; right:13px; top:50%; transform:translateY(-50%); border-left:4px solid transparent; border-right:4px solid transparent; border-top:5px solid var(--vs-400); pointer-events:none; }
        .pf-err  { display:flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:#ef4444; }
        .pf-hint { font-size:11.5px; color:var(--vs-400); }

        /* Grid campos */
        .pf-g2 { display:grid; grid-template-columns:1fr 1fr; gap:13px; }
        .pf-g3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:13px; }
        @media(max-width:600px) { .pf-g2,.pf-g3 { grid-template-columns:1fr; } }

        /* Input con prefijo */
        .pf-pfx-wrap { position:relative; }
        .pf-pfx      { position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:13px; font-weight:700; color:var(--vs-400); pointer-events:none; }
        .pf-pfx-wrap .pf-input { padding-left:38px; }

        /* ── Imágenes ── */
        .pf-dropzone { border:2px dashed var(--vs-300); background:var(--vs-50); border-radius:16px; padding:26px 22px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; cursor:pointer; transition:all .18s; color:var(--vs-500); text-align:center; }
        .pf-dropzone:hover { border-color:var(--vt-400); background:rgba(6,182,212,.04); }
        .pf-dropzone.drag { border-color:var(--vt-500); background:rgba(6,182,212,.06); box-shadow:0 0 0 4px rgba(6,182,212,.08); }
        .pf-dz-ico { width:52px; height:52px; border-radius:14px; background:rgba(6,182,212,.08); border:1px solid rgba(6,182,212,.18); display:flex; align-items:center; justify-content:center; color:var(--vt-600); }
        .pf-dz-title { font-size:15px; font-weight:800; color:var(--vs-800); }
        .pf-dz-sub { font-size:12.5px; color:var(--vs-400); font-weight:500; }
        .pf-dz-btn { display:inline-flex; align-items:center; gap:8px; padding:9px 14px; border-radius:11px; border:1.5px solid var(--vs-200); background:var(--vw); font-size:13px; font-weight:800; color:var(--vs-700); cursor:pointer; font-family:'Nunito',sans-serif; transition:all .15s; }
        .pf-dz-btn:hover { border-color:var(--vt-400); color:var(--vt-700); background:rgba(6,182,212,.04); }

        .pf-img-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:10px; }
        @media(max-width:520px) { .pf-img-grid { grid-template-columns:repeat(2, 1fr); } }
        .pf-img-slot { aspect-ratio:1; border-radius:14px; border:1.5px solid var(--vs-200); background:var(--vs-50); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; cursor:default; transition:all .2s; position:relative; overflow:hidden; }
        .pf-img-slot.main   { border-color:var(--vt-400); background:rgba(6,182,212,.04); }
        .pf-img-slot:hover  { border-color:var(--vt-400); }
        .pf-img-main-badge { position:absolute; top:5px; left:5px; font-size:8.5px; font-weight:800; background:var(--vt-500); color:white; padding:2px 6px; border-radius:100px; letter-spacing:.3px; text-transform:uppercase; z-index:10; }
        .pf-img-preview { width:100%; height:100%; object-fit:cover; display:block; }
        .pf-img-del   { position:absolute; top:5px; right:5px; width:24px; height:24px; border-radius:50%; background:rgba(239,68,68,.9); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:white; opacity:0; transition:opacity .15s; z-index:10; }
        .pf-img-slot:hover .pf-img-del { opacity:1; }

        /* ── Tags ── */
        .pf-tags-area { display:flex; flex-wrap:wrap; gap:7px; align-items:center; padding:10px 12px; border:1.5px solid var(--vs-200); border-radius:11px; background:var(--vs-50); min-height:46px; cursor:text; transition:all .2s; }
        .pf-tags-area:focus-within { border-color:var(--vt-500); background:var(--vw); box-shadow:0 0 0 3px rgba(6,182,212,.1); }
        .pf-tag   { display:inline-flex; align-items:center; gap:5px; padding:3px 10px 3px 9px; background:rgba(6,182,212,.1); border:1px solid rgba(6,182,212,.22); border-radius:100px; font-size:12px; font-weight:700; color:var(--vt-700); }
        .pf-tag-x { background:none; border:none; cursor:pointer; display:flex; color:var(--vt-500); padding:0; transition:color .14s; }
        .pf-tag-x:hover { color:#ef4444; }
        .pf-tag-inp { background:none; border:none; outline:none; font-size:13px; font-family:'Nunito',sans-serif; color:var(--vs-800); min-width:100px; flex:1; padding:0; }
        .pf-tag-inp::placeholder { color:var(--vs-400); }

        /* ── Toggle ── */
        .pf-toggle-row   { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 0; border-bottom:1px solid var(--vs-50); }
        .pf-toggle-row:last-child { border-bottom:none; }
        .pf-toggle-info  { flex:1; min-width:0; }
        .pf-toggle-label { font-size:13.5px; font-weight:700; color:var(--vs-800); display:flex; align-items:center; gap:6px; margin-bottom:2px; }
        .pf-toggle-desc  { font-size:12px; color:var(--vs-400); }
        .pf-toggle { width:42px; height:24px; border-radius:100px; border:none; cursor:pointer; position:relative; transition:all .2s; flex-shrink:0; }
        .pf-toggle.on  { background:linear-gradient(135deg,var(--vt-700),var(--vt-500)); box-shadow:0 2px 8px rgba(6,182,212,.3); }
        .pf-toggle.off { background:var(--vs-200); }
        .pf-toggle-knob { position:absolute; top:3px; width:18px; height:18px; border-radius:50%; background:white; box-shadow:0 1px 4px rgba(0,0,0,.2); transition:left .2s; }
        .pf-toggle.on  .pf-toggle-knob { left:21px; }
        .pf-toggle.off .pf-toggle-knob { left:3px; }

        /* ── Variantes colores ── */
        .pf-colors-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
        .pf-color-sw { width:30px; height:30px; border-radius:8px; cursor:pointer; transition:all .15s; position:relative; border:2.5px solid transparent; flex-shrink:0; }
        .pf-color-sw:hover { transform:scale(1.12); }
        .pf-color-sw.sel { box-shadow:0 0 0 2px var(--vw), 0 0 0 4px var(--vt-500); }
        .pf-color-sw .pf-sw-x { position:absolute; top:-5px; right:-5px; width:14px; height:14px; border-radius:50%; background:#ef4444; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:white; opacity:0; transition:opacity .14s; }
        .pf-color-sw:hover .pf-sw-x { opacity:1; }
        .pf-color-picker { width:32px; height:32px; border-radius:8px; border:1.5px dashed var(--vs-300); background:var(--vs-50); cursor:pointer; padding:2px; overflow:hidden; transition:border-color .15s; }
        .pf-color-picker:hover { border-color:var(--vt-400); }

        /* ── Variantes tallas ── */
        .pf-sizes-row { display:flex; flex-wrap:wrap; gap:7px; }
        .pf-size-btn  { padding:7px 13px; border-radius:9px; border:1.5px solid var(--vs-200); background:var(--vw); font-size:12.5px; font-weight:700; color:var(--vs-600); cursor:pointer; font-family:'Nunito',sans-serif; transition:all .15s; }
        .pf-size-btn:hover { border-color:var(--vs-400); color:var(--vs-800); }
        .pf-size-btn.sel { background:rgba(6,182,212,.1); border-color:var(--vt-400); color:var(--vt-700); }
        .pf-sel-sizes { display:flex; flex-wrap:wrap; gap:6px; }
        .pf-sel-size  { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; background:rgba(6,182,212,.09); border:1px solid rgba(6,182,212,.2); border-radius:8px; font-size:12.5px; font-weight:700; color:var(--vt-700); }
        .pf-sel-size-x { background:none; border:none; cursor:pointer; display:flex; color:var(--vt-500); padding:0; transition:color .14s; }
        .pf-sel-size-x:hover { color:#ef4444; }

        /* ── Status selector (lateral) ── */
        .pf-status-opts { display:flex; flex-direction:column; gap:7px; }
        .pf-status-opt  { display:flex; align-items:center; gap:10px; padding:10px 13px; border-radius:12px; border:1.5px solid var(--vs-200); cursor:pointer; transition:all .15s; }
        .pf-status-opt:hover:not(.sel) { border-color:var(--vs-400); }
        .pf-status-opt.sel.active   { border-color:#bbf7d0; background:#f0fdf4; }
        .pf-status-opt.sel.draft    { border-color:var(--vs-300); background:var(--vs-50); }
        .pf-status-opt.sel.inactive { border-color:#fecaca; background:#fef2f2; }
        .pf-status-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .pf-status-name { font-size:13px; font-weight:700; color:var(--vs-800); }
        .pf-status-desc { font-size:11.5px; color:var(--vs-400); margin-top:1px; }
        .pf-status-chk  { margin-left:auto; color:var(--vt-600); display:flex; }

        /* ── Resumen precios ── */
        .pf-price-box { background:var(--vs-50); border:1px solid var(--vs-200); border-radius:13px; padding:13px 15px; }
        .pf-price-row { display:flex; justify-content:space-between; font-size:13px; padding:3px 0; }
        .pf-price-lbl { color:var(--vs-500); font-weight:500; }
        .pf-price-val { font-family:'Lexend',sans-serif; font-weight:700; color:var(--vs-800); }
        .pf-price-sep { height:1px; background:var(--vs-200); margin:7px 0; }
        .pf-margin-tag { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:100px; font-size:11.5px; font-weight:700; }
        .pf-margin-tag.hi  { background:#f0fdf4; color:#16a34a; }
        .pf-margin-tag.mid { background:#fffbeb; color:#d97706; }
        .pf-margin-tag.lo  { background:#fef2f2; color:#ef4444; }

        /* ── SEO preview ── */
        .pf-seo-preview { background:white; border:1px solid var(--vs-200); border-radius:12px; padding:15px; }
        .pf-seo-url   { font-size:12px; color:#1a0dab; margin-bottom:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .pf-seo-title { font-size:17px; color:#1a0dab; margin-bottom:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .pf-seo-desc  { font-size:12.5px; color:#4d5156; line-height:1.55; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
      `}</style>

      <div className={`pf${ready ? " in" : ""}`}>

        {/* ── HEADER ── */}
        <div className="pf-header">
          <button className="pf-back-btn" onClick={() => navigate("/vendor/products")}><IcoBack /></button>
          <div className="pf-header-info">
            <div className="pf-eyebrow">{isEdit ? "Editar producto" : "Nuevo producto"}</div>
            <h1 className="pf-h1">{isEdit ? (form.name || "Sin nombre") : "Crear producto"}</h1>
          </div>
          <div className="pf-header-btns">
            <button className="pf-btn pf-btn-ghost" onClick={() => navigate("/vendor/products")}>Cancelar</button>
            {isEdit && (
              <button className="pf-btn pf-btn-draft" onClick={() => handleSave("draft")}>
                Guardar borrador
              </button>
            )}
            <button
              className={`pf-btn ${saved ? "pf-btn-success" : "pf-btn-primary"}`}
              onClick={() => handleSave(isEdit ? form.status : "active")}
              disabled={saving}
            >
              {saving ? <><span className="pf-spin"/>Guardando...</>
               : saved ? <><IcoCheck />¡Guardado!</>
               : <><IcoSave />{isEdit ? "Guardar cambios" : "Publicar"}</>}
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        {loading && (
          <div style={{ marginBottom: 12, color: "var(--vs-500)", fontSize: 13 }}>
            Cargando producto...
          </div>
        )}
        {saveError && (
          <div style={{ marginBottom: 12, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
            {saveError}
          </div>
        )}

        <div className="pf-tabs">
          {TABS.map(t => (
            <button key={t} className={`pf-tab${tab === t ? " act" : ""}${t === "General" && hasErrors ? " has-err" : ""}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {/* ── LAYOUT ── */}
        <div className="pf-layout">

          {/* ════ COLUMNA PRINCIPAL ════ */}
          <div className="pf-main">

            {/* ─── GENERAL ─── */}
            {tab === "General" && (
              <>
                <Card title="Información básica" subtitle="Nombre, descripción y clasificación del producto">
                  <Field label="Nombre del producto" required error={errors.name}>
                    <Input placeholder="Ej. Vestido Floral Verano" value={form.name} onChange={e => set("name", e.target.value)} error={errors.name} />
                  </Field>
                  <Field label="Descripción" hint="Una buena descripción aumenta la tasa de conversión">
                    <Textarea placeholder="Describe el producto: materiales, beneficios, cómo usarlo..." value={form.description} onChange={e => set("description", e.target.value)} rows={4} />
                  </Field>
                  <div className="pf-g2">
                    <Field label="Categoría" required error={errors.category}>
                      <Sel value={form.category} onChange={e => set("category", e.target.value)} error={errors.category}>
                        <option value="">Seleccionar...</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </Sel>
                    </Field>
                    <Field label="Catálogo" required error={errors.catalog}>
                      <Sel value={form.catalog} onChange={e => set("catalog", e.target.value)} error={errors.catalog}>
                        <option value="">Seleccionar...</option>
                        {catalogOptions.map(c => <option key={c}>{c}</option>)}
                      </Sel>
                    </Field>
                  </div>
                  <div className="pf-g2">
                    <Field label="SKU" hint="Código único de referencia interna">
                      <div style={{ display:"flex", gap:6 }}>
                        <Input className="flex-1" placeholder="VFV-001" value={form.sku} onChange={e => set("sku", e.target.value)} style={{ flex:1 }}/>
                        <button className="pf-btn pf-btn-ghost" style={{ padding:"0 11px", fontSize:12, flexShrink:0 }} onClick={genSKU} title="Generar SKU automático">
                          <IcoRefresh />
                        </button>
                      </div>
                    </Field>
                    <Field label="Unidad de venta">
                      <Sel value={form.unit} onChange={e => set("unit", e.target.value)}>
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </Sel>
                    </Field>
                  </div>
                  <Field label="Etiquetas" hint="Enter o coma para agregar · Máx. 15">
                    <div className="pf-tags-area" onClick={e => e.currentTarget.querySelector("input")?.focus()}>
                      {form.tags.map(t => (
                        <span key={t} className="pf-tag">
                          <IcoTag />{t}
                          <button className="pf-tag-x" onClick={() => set("tags", form.tags.filter(x => x !== t))}><IcoX /></button>
                        </span>
                      ))}
                      {form.tags.length < 15 && (
                        <input
                          className="pf-tag-inp"
                          placeholder={form.tags.length ? "" : "Agrega etiquetas..."}
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
                          onBlur={() => tagInput && addTag(tagInput)}
                        />
                      )}
                    </div>
                  </Field>
                </Card>
              </>
            )}

            {/* ─── IMÁGENES ─── */}
            {tab === "Imágenes" && (
              <Card
                title="Imágenes del producto"
                subtitle={`Máx. ${MAX_IMAGES} imágenes. La primera será la principal.`}
              >
                {canAddMoreImages && (
                  <div
                    className={`pf-dropzone${dzActive ? " drag" : ""}`}
                    onClick={openImagePicker}
                    onDragEnter={onDzDragEnter}
                    onDragOver={onDzDragOver}
                    onDragLeave={onDzDragLeave}
                    onDrop={onDzDrop}
                  >
                    <div className="pf-dz-ico"><IcoUpload /></div>
                    <div className="pf-dz-title">Arrastra y suelta tus imágenes</div>
                    <div className="pf-dz-sub">
                      o haz clic para seleccionar (te quedan {MAX_IMAGES - uploadedImages.length})
                    </div>
                    <button type="button" className="pf-dz-btn" onClick={(e) => { e.stopPropagation(); openImagePicker(); }}>
                      <IcoUpload /> Seleccionar imágenes
                    </button>
                  </div>
                )}

                {uploadedImages.length > 0 && (
                  <div className="pf-img-grid" style={{ marginTop: canAddMoreImages ? 16 : 0 }}>
                    {uploadedImages.map((imgUrl, i) => (
                      <div key={`${i}-${imgUrl?.slice?.(0, 24) || "img"}`} className={`pf-img-slot${i === 0 ? " main" : ""}`}>
                        {i === 0 && <span className="pf-img-main-badge">Principal</span>}
                        <img className="pf-img-preview" src={imgUrl} alt={`Imagen ${i + 1}`} />
                        <button
                          type="button"
                          className="pf-img-del"
                          onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        >
                          <IcoTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  style={{ display:"none" }}
                  onChange={(e) => {
                    const fileList = e.target.files;
                    const files = fileList ? Array.from(fileList) : [];
                    e.target.value = "";
                    if (files.length) handleImageFiles(files);
                  }}
                />
                <p style={{ fontSize:11.5, color:"var(--vs-400)", margin:0 }}>
                  Formatos aceptados: cualquier imagen (se convierte a JPG/PNG automáticamente) · Tamaño máximo: 5 MB · Resolución recomendada: 800×800 px
                </p>
              </Card>
            )}

            {/* ─── PRECIOS ─── */}
            {tab === "Precios" && (
              <Card title="Precios" subtitle="Precio de venta, precio anterior y costo interno">
                <div className="pf-g2">
                  <Field label="Moneda">
                    <Sel value={form.currency} onChange={e => set("currency", e.target.value)}>
                      {currencyOptions.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol || c.code})
                        </option>
                      ))}
                    </Sel>
                  </Field>
                  <div/>
                </div>
                <div className="pf-g3">
                  <Field label="Precio de venta" required error={errors.price}>
                    <div className="pf-pfx-wrap">
                      <span className="pf-pfx">{currencySymbol}</span>
                      <Input type="number" min="0" placeholder="0.00" value={form.price} onChange={e => set("price", e.target.value)} error={errors.price} />
                    </div>
                  </Field>
                  <Field label="Precio anterior" hint="Se muestra tachado">
                    <div className="pf-pfx-wrap">
                      <span className="pf-pfx">{currencySymbol}</span>
                      <Input type="number" min="0" placeholder="0.00" value={form.comparePrice} onChange={e => set("comparePrice", e.target.value)} />
                    </div>
                  </Field>
                  <Field label="Costo" hint="Solo visible para ti">
                    <div className="pf-pfx-wrap">
                      <span className="pf-pfx">{currencySymbol}</span>
                      <Input type="number" min="0" placeholder="0.00" value={form.cost} onChange={e => set("cost", e.target.value)} />
                    </div>
                  </Field>
                </div>

                {/* Preview de precios */}
                {(form.price || form.cost) && (
                  <div className="pf-price-box">
                    {discount !== null && (
                      <div className="pf-price-row">
                        <span className="pf-price-lbl">Descuento aplicado</span>
                        <span className="pf-price-val" style={{ color:"#16a34a" }}>−{discount}%</span>
                      </div>
                    )}
                    {form.taxable && form.price && (
                      <div className="pf-price-row">
                        <span className="pf-price-lbl">ITBIS (18%)</span>
                        <span className="pf-price-val">{formatMoney(+form.price * 0.18, form.currency, { minimumFractionDigits: 2, maximumFractionDigits: 2, byCode })}</span>
                      </div>
                    )}
                    {margin !== null && (
                      <>
                        <div className="pf-price-sep"/>
                        <div className="pf-price-row">
                          <span className="pf-price-lbl">Margen estimado</span>
                          <span className={`pf-margin-tag ${margin >= 40 ? "hi" : margin >= 20 ? "mid" : "lo"}`}>{margin}%</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <Toggle
                  on={form.taxable}
                  onChange={v => set("taxable", v)}
                  label="Aplicar ITBIS (18%)"
                  desc="Se añade al precio de venta al cliente"
                  icon={IcoTag}
                />
              </Card>
            )}

            {/* ─── INVENTARIO ─── */}
            {tab === "Inventario" && (
              <Card title="Inventario" subtitle="Stock disponible, alertas y peso para envío">
                <div className="pf-g3">
                  <Field label="Stock actual" required error={errors.stock}>
                    <Input type="number" min="0" placeholder="0" value={form.stock} onChange={e => set("stock", e.target.value)} error={errors.stock} />
                  </Field>
                  <Field label="Alerta de stock bajo" hint="Notificar cuando llegue a este nivel">
                    <Input type="number" min="0" placeholder="5" value={form.minStock} onChange={e => set("minStock", e.target.value)} />
                  </Field>
                  <Field label="Peso (kg)" hint="Para calcular costo de envío">
                    <Input type="number" min="0" step="0.01" placeholder="0.500" value={form.weight} onChange={e => set("weight", e.target.value)} />
                  </Field>
                </div>
                {form.stock !== "" && +form.stock <= +(form.minStock || 5) && +form.stock > 0 && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 13px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:11, fontSize:13, fontWeight:600, color:"#d97706" }}>
                    <IcoWarn />Stock bajo — considera reponer pronto
                  </div>
                )}
                {form.stock !== "" && +form.stock === 0 && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 13px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:11, fontSize:13, fontWeight:600, color:"#ef4444" }}>
                    <IcoWarn />Producto agotado — no aparecerá disponible en tu catálogo
                  </div>
                )}
              </Card>
            )}

            {/* ─── VARIANTES ─── */}
            {tab === "Variantes" && (
              <>
                <Card title="Colores" subtitle="Selecciona o agrega los colores disponibles">
                  <div className="pf-colors-row">
                    {COLORS_PRE.map(c => (
                      <div
                        key={c}
                        className={`pf-color-sw${form.colors.includes(c) ? " sel" : ""}`}
                        style={{ background:c, border: c === "#fafafa" ? "1.5px solid var(--vs-200)" : "none" }}
                        onClick={() => toggleColor(c)}
                        title={c}
                      >
                        {form.colors.includes(c) && (
                          <button className="pf-sw-x" onClick={e => { e.stopPropagation(); toggleColor(c); }}><IcoX /></button>
                        )}
                      </div>
                    ))}
                    <input
                      type="color"
                      className="pf-color-picker"
                      title="Color personalizado"
                      onChange={e => { if (!form.colors.includes(e.target.value)) toggleColor(e.target.value); }}
                    />
                  </div>
                  {form.colors.length > 0 && (
                    <p style={{ fontSize:12, color:"var(--vs-400)", margin:0 }}>
                      {form.colors.length} color{form.colors.length > 1 ? "es" : ""} seleccionado{form.colors.length > 1 ? "s" : ""}
                    </p>
                  )}
                </Card>

                <Card title="Tallas" subtitle="Marca las tallas disponibles para este producto">
                  <div className="pf-sizes-row">
                    {SIZES_PRE.map(s => (
                      <button key={s} className={`pf-size-btn${form.sizes.includes(s) ? " sel" : ""}`} onClick={() => toggleSize(s)}>{s}</button>
                    ))}
                  </div>
                  {form.sizes.length > 0 && (
                    <div>
                      <p style={{ fontSize:11, fontWeight:700, color:"var(--vs-400)", textTransform:"uppercase", letterSpacing:".7px", marginBottom:8 }}>Seleccionadas</p>
                      <div className="pf-sel-sizes">
                        {form.sizes.map(s => (
                          <span key={s} className="pf-sel-size">
                            {s}
                            <button className="pf-sel-size-x" onClick={() => toggleSize(s)}><IcoX /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"var(--vs-400)", textTransform:"uppercase", letterSpacing:".7px", marginBottom:8 }}>Talla personalizada</p>
                    <div style={{ display:"flex", gap:8 }}>
                      <Input placeholder="Ej. 42, Única, 6.5..." value={newSize} onChange={e => setNewSize(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newSize.trim()) { toggleSize(newSize.trim()); setNewSize(""); } }} style={{ flex:1 }} />
                      <button className="pf-btn pf-btn-primary" style={{ padding:"0 13px" }} onClick={() => { if (newSize.trim()) { toggleSize(newSize.trim()); setNewSize(""); } }}>
                        <IcoPlus />
                      </button>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* ─── SEO ─── */}
            {tab === "SEO" && (
              <Card title="SEO y visibilidad" subtitle="Cómo aparece tu producto en motores de búsqueda">
                <Field label="Título SEO" hint={`${form.name.length}/60 caracteres`}>
                  <Input placeholder="Título para Google..." value={form.name} onChange={e => set("name", e.target.value)} maxLength={60} />
                </Field>
                <Field label="Descripción SEO" hint={`${form.description.length}/160 caracteres`}>
                  <Textarea placeholder="Descripción breve para buscadores..." value={form.description} onChange={e => set("description", e.target.value)} maxLength={160} rows={3} />
                </Field>
                <Field label="URL del producto">
                  <div style={{ display:"flex", alignItems:"center" }}>
                    <span style={{ padding:"11px 12px", background:"var(--vs-100)", border:"1.5px solid var(--vs-200)", borderRight:"none", borderRadius:"11px 0 0 11px", fontSize:13, color:"var(--vs-500)", whiteSpace:"nowrap", flexShrink:0 }}>
                      /producto/
                    </span>
                    <Input style={{ borderRadius:"0 11px 11px 0", borderLeft:"none" }} value={slug} readOnly />
                  </div>
                </Field>
                <div>
                  <p className="pf-label" style={{ marginBottom:9 }}>Vista previa en Google</p>
                  <div className="pf-seo-preview">
                    <div className="pf-seo-url">catalogix.com › productos › {slug}</div>
                    <div className="pf-seo-title">{form.name || "Nombre del producto"}</div>
                    <div className="pf-seo-desc">{form.description || "Descripción del producto. Este texto aparecerá en los resultados de búsqueda de Google."}</div>
                  </div>
                </div>
              </Card>
            )}

          </div>

          {/* ════ COLUMNA LATERAL ════ */}
          <div className="pf-side">

            {/* Estado */}
            <Card title="Estado del producto">
              <div className="pf-status-opts">
                {[
                  { val:"active",   label:"Activo",   desc:"Visible en catálogo",    dot:"#16a34a" },
                  { val:"draft",    label:"Borrador",  desc:"Solo visible para ti",   dot:"#94a3b8" },
                  { val:"inactive", label:"Inactivo",  desc:"Oculto temporalmente",   dot:"#ef4444" },
                ].map(o => (
                  <div key={o.val} className={`pf-status-opt${form.status === o.val ? ` sel ${o.val}` : ""}`} onClick={() => set("status", o.val)}>
                    <div className="pf-status-dot" style={{ background:o.dot }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="pf-status-name">{o.label}</div>
                      <div className="pf-status-desc">{o.desc}</div>
                    </div>
                    {form.status === o.val && <span className="pf-status-chk"><IcoCheck /></span>}
                  </div>
                ))}
              </div>
            </Card>

            {/* Opciones */}
            <Card title="Opciones">
              <Toggle
                on={form.featured}
                onChange={v => set("featured", v)}
                label="Producto destacado"
                desc="Aparece primero en resultados"
                icon={IcoStar}
              />
              <Toggle
                on={form.taxable}
                onChange={v => set("taxable", v)}
                label="Aplicar ITBIS (18%)"
                desc="Se suma al precio de venta"
                icon={IcoTag}
              />
            </Card>

            {/* Resumen precios */}
            {(form.price || form.comparePrice) && (
              <Card title="Resumen de precios">
                <div>
                  {form.comparePrice && +form.comparePrice > +form.price && (
                    <div className="pf-price-row">
                      <span className="pf-price-lbl">Precio anterior</span>
                      <span className="pf-price-val" style={{ textDecoration:"line-through", color:"var(--vs-400)" }}>
                        {formatMoney(+form.comparePrice, form.currency, { maximumFractionDigits: 2, byCode })}
                      </span>
                    </div>
                  )}
                  {form.price && (
                    <div className="pf-price-row">
                      <span className="pf-price-lbl">Precio de venta</span>
                      <span className="pf-price-val" style={{ color:"var(--vt-600)", fontSize:14 }}>
                        {formatMoney(+form.price, form.currency, { maximumFractionDigits: 2, byCode })}
                      </span>
                    </div>
                  )}
                  {margin !== null && (
                    <>
                      <div className="pf-price-sep"/>
                      <div className="pf-price-row">
                        <span className="pf-price-lbl">Margen</span>
                        <span className={`pf-margin-tag ${margin >= 40 ? "hi" : margin >= 20 ? "mid" : "lo"}`}>{margin}%</span>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}

            {/* Guardar móvil */}
          <button
            className={`pf-btn ${saved ? "pf-btn-success" : "pf-btn-primary"}`}
            style={{ width:"100%", justifyContent:"center" }}
            onClick={() => handleSave(isEdit ? form.status : "active")}
            disabled={saving}
          >
              {saving ? <><span className="pf-spin"/>Guardando...</>
               : saved ? <><IcoCheck />¡Guardado!</>
               : <><IcoSave />{isEdit ? "Guardar cambios" : "Publicar producto"}</>}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}
