import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "qrcode";
import { CartContext } from "../../context/CartContext";
import { storeService } from "../../services/odoo/storeService";
import useCurrency from "../../hooks/useCurrency";
import { formatMoney } from "../../utils/formatCurrency";

// ─── Iconos ───────────────────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconCart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconMinus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconStar = ({ filled }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconPackage = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IconTag = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IconShield = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);


// ─── Datos reales ─────────────────────────────────────────────────────────────
const CATALOG_PALETTE = [
  { accent: "#7c3aed", cover: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #6d28d9 100%)" },
  { accent: "#06b6d4", cover: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 55%, #2563eb 100%)" },
  { accent: "#f59e0b", cover: "linear-gradient(135deg, #f59e0b 0%, #f97316 60%, #ea580c 100%)" },
  { accent: "#10b981", cover: "linear-gradient(135deg, #10b981 0%, #14b8a6 60%, #0f766e 100%)" },
  { accent: "#ec4899", cover: "linear-gradient(135deg, #ec4899 0%, #f43f5e 55%, #be123c 100%)" },
];
const PRODUCT_PALETTE = [
  "from-pink-400 to-rose-500",
  "from-slate-400 to-gray-600",
  "from-blue-600 to-indigo-700",
  "from-amber-200 to-yellow-300",
  "from-red-500 to-orange-500",
  "from-zinc-700 to-neutral-900",
  "from-purple-400 to-pink-500",
  "from-emerald-500 to-teal-600",
  "from-indigo-500 to-blue-700",
];

const getVendorName = (vendor) => {
  if (Array.isArray(vendor) && vendor.length > 1) return vendor[1];
  if (typeof vendor === "string") return vendor;
  return "Vendedor";
};

const getInitials = (name) => {
  const trimmed = (name || "").trim();
  if (!trimmed) return "VD";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]).join("").toUpperCase();
};

const buildCatalogView = (row, idx) => {
  const palette = CATALOG_PALETTE[idx % CATALOG_PALETTE.length];
  const vendorName = getVendorName(row.vendor_id);
  const createdAt = row.create_date ? new Date(row.create_date) : null;
  const since = createdAt && !Number.isNaN(createdAt.getTime()) ? String(createdAt.getFullYear()) : "2024";
  const image = row.image_url || (Array.isArray(row.image_urls) ? row.image_urls[0] : null) || null;
  const cover = image
    ? `linear-gradient(135deg, rgba(10,22,40,0.45) 0%, rgba(15,32,68,0.6) 100%), url("${image}")`
    : palette.cover;

  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name || "Catálogo",
    vendor: vendorName,
    vendorAvatar: getInitials(vendorName),
    category: row.category || "General",
    rating: Number(row.rating ?? (row.product_count ? 4.7 : 0)),
    reviews: Number(row.reviews ?? (row.product_count ? Math.min(999, Number(row.product_count) * 6) : 0)),
    cover,
    accent: palette.accent,
    verified: !!row.vendor_id,
    description: row.description || "Catálogo de productos disponibles.",
    since,
    totalSales: row.product_count ? Number(row.product_count) * 8 : 0,
  };
};

const buildProductView = (row, idx) => {
  const stock = Number(row.catalog_stock_qty ?? row.qty_available ?? 0);
  const image = row.image_url || (Array.isArray(row.image_urls) ? row.image_urls[0] : null) || null;
  return {
    id: row.id,
    name: row.name || "Producto",
    price: Number(row.list_price || 0),
    currency: Array.isArray(row.currency_id) ? row.currency_id[1] : "DOP",
    original: row.original_price ? Number(row.original_price) : null,
    category: (Array.isArray(row.categ_id) && row.categ_id[1]) || "General",
    stock,
    rating: Number(row.rating ?? 0),
    reviews: Number(row.reviews ?? 0),
    sales: Number(row.sales ?? 0),
    tag: stock <= 5 && stock > 0 ? "Pocas unidades" : stock === 0 ? "Agotado" : null,
    color: PRODUCT_PALETTE[idx % PRODUCT_PALETTE.length],
    image,
  };
};

// ─── ProductCard ──────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, added, index, onOpen }) {
  const [qty, setQty] = useState(1);
  const maxQty = Math.max(1, product.stock || 0);
  const outOfStock = product.stock <= 0;
  const discount = product.original
    ? Math.round((1 - product.price / product.original) * 100)
    : null;
  const hasImage = !!product.image;

  const handleOpen = () => {
    if (typeof onOpen === "function") onOpen(product);
  };

  const handleKey = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  };

  return (
    <div
      className="prod-card"
      style={{ animationDelay: `${index * 55}ms` }}
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={handleKey}
      aria-label={`Abrir ${product.name}`}
    >
      <div
        className={`prod-img${hasImage ? "" : ` bg-gradient-to-br ${product.color}`}`}
        style={hasImage ? { backgroundImage: `url(${product.image})` } : undefined}
      >
        {!hasImage && <div className="prod-img-icon"><IconPackage /></div>}
        {product.tag && (
          <div className="prod-tag"
            style={{
              background: product.tag === "Oferta" ? "#ef4444" :
                          product.tag === "Nuevo" ? "#06b6d4" :
                          product.tag === "Premium" ? "#7c3aed" :
                          product.tag === "Pocas unidades" ? "#f59e0b" : "#64748b"
            }}
          >
            {product.tag}
          </div>
        )}
        {discount && (
          <div className="prod-discount">-{discount}%</div>
        )}
      </div>
      <div className="prod-body">
        <div className="prod-cat">{product.category}</div>
        <h4 className="prod-name">{product.name}</h4>
        <div className="prod-rating">
          {[1,2,3,4,5].map(i => (
            <span key={i} style={{ color: i <= Math.floor(product.rating) ? "#f59e0b" : "#e2e8f0" }}>
              <IconStar filled={i <= Math.floor(product.rating)} />
            </span>
          ))}
          <span className="prod-rating-num">{product.rating}</span>
          {product.reviews > 0 && <span className="prod-rating-rev">({product.reviews})</span>}
          <span className="prod-sales">· {product.sales} vendidos</span>
        </div>
        <div className="prod-price-row">
          <span className="prod-price">{formatMoney(product.price, product.currency, { byCode })}</span>
          {product.original && (
            <span className="prod-original">{formatMoney(product.original, product.currency, { byCode })}</span>
          )}
        </div>
        <div className="prod-stock" style={{ color: product.stock <= 5 ? "#ef4444" : "#94a3b8" }}>
          {product.stock <= 5 ? `⚡ Solo ${product.stock} disponibles` : `✓ ${product.stock} en stock`}
        </div>
      </div>
      <div className="prod-actions" onClick={(e) => e.stopPropagation()}>
        <div className="qty-ctrl">
          <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}><IconMinus /></button>
          <span className="qty-num">{qty}</span>
          <button className="qty-btn" onClick={() => setQty(q => Math.min(maxQty, q + 1))}><IconPlus /></button>
        </div>
        <button
          className={`add-btn${added ? " added" : ""}`}
          onClick={() => onAdd(product, qty)}
          disabled={outOfStock}
        >
          {outOfStock ? "Agotado" : added ? <><IconCheck />Agregado</> : <><IconPlus />Agregar</>}
        </button>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function CatalogDetail() {
  const { cartCount = 0, addToCart } = useContext(CartContext) || {};
  const navigate = useNavigate();
  const { id } = useParams();
  const { byCode } = useCurrency();

  const [catalog, setCatalog]       = useState(null);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [prodCat, setProdCat]       = useState("Todos");
  const [search, setSearch]         = useState("");
  const [addedMap, setAddedMap]     = useState({});
  const [qrDataUrl, setQrDataUrl]   = useState("");
  const [qrLoading, setQrLoading]   = useState(false);
  const [qrError, setQrError]       = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    storeService
      .getCatalog(id)
      .then(({ catalog, products }) => {
        if (!alive) return;
        const mappedCatalog = buildCatalogView(catalog, 0);
        const mappedProducts = (products || []).map((p, idx) => buildProductView(p, idx));
        setCatalog(mappedCatalog);
        setProducts(mappedProducts);
        setError("");
      })
      .catch(err => {
        if (!alive) return;
        setError(err?.message || "No se pudo cargar el catálogo.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!catalog) {
      setQrDataUrl("");
      setQrError("");
      setQrLoading(false);
      return;
    }
    const publicUrl = typeof window !== "undefined"
      ? `${window.location.origin}/catalog/${id}`
      : "";
    if (!publicUrl) return;
    let active = true;
    setQrLoading(true);
    setQrError("");
    QRCode.toDataURL(publicUrl, { width: 140, margin: 1, errorCorrectionLevel: "M" })
      .then(url => {
        if (!active) return;
        setQrDataUrl(url);
      })
      .catch(err => {
        if (!active) return;
        setQrError(err?.message || "No se pudo generar el QR.");
        setQrDataUrl("");
      })
      .finally(() => {
        if (!active) return;
        setQrLoading(false);
      });
    return () => { active = false; };
  }, [catalog, id]);

  const productCategories = useMemo(() => {
    const set = new Set();
    products.forEach(p => set.add(p.category));
    return ["Todos", ...Array.from(set).filter(Boolean)];
  }, [products]);

  const filtered = products.filter(p => {
    const matchCat = prodCat === "Todos" || p.category === prodCat;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAdd = (product, qty) => {
    addToCart && addToCart({ ...product, qty });
    setAddedMap(m => ({ ...m, [product.id]: true }));
    setTimeout(() => setAddedMap(m => ({ ...m, [product.id]: false })), 2000);
  };

  const handleOpenProduct = (product) => {
    if (!product?.id) return;
    navigate(`/product/${product.id}`);
  };

  return (
    <>
<div>


        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Cargando catálogo...</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>{error}</div>
        ) : catalog ? (
          <>
            {/* ── HERO ── */}
            <div className="cat-hero">
              <div className="cat-hero-bg" style={{ backgroundImage: catalog.cover }} />
              <div className="cat-hero-pattern" />
              <div className="cat-hero-inner">
                <div className="cat-hero-logo">{catalog.vendorAvatar}</div>
                <div className="cat-hero-info">
                  <div className="cat-hero-top">
                    <span className="cat-hero-category">{catalog.category}</span>
                    {catalog.verified && (
                      <span className="cat-hero-verified">
                        ✓ Vendedor verificado
                      </span>
                    )}
                  </div>
                  <h1 className="cat-hero-name">{catalog.name}</h1>
                  <div className="cat-hero-vendor">
                    <IconUser />
                    {catalog.vendor} · Desde {catalog.since}
                  </div>
                  <p className="cat-hero-desc">{catalog.description}</p>
                  <div className="cat-hero-qr">
                    <div className="cat-hero-qr-box">
                      {qrLoading ? (
                        <span className="cat-hero-qr-msg">Generando QR...</span>
                      ) : qrDataUrl ? (
                        <img className="cat-hero-qr-img" src={qrDataUrl} alt={`QR de ${catalog.name}`} />
                      ) : (
                        <span className="cat-hero-qr-msg">{qrError || "QR no disponible"}</span>
                      )}
                    </div>
                    <div className="cat-hero-qr-label">Escanea para abrir</div>
                  </div>
                  <div className="cat-hero-stats">
                    {[
                      { val: `${catalog.rating}★`, lbl: `${catalog.reviews} reseñas` },
                      { val: products.length, lbl: "Productos" },
                      { val: `${catalog.totalSales}+`, lbl: "Ventas totales" },
                    ].map(s => (
                      <div key={s.lbl}>
                        <div className="cat-hero-stat-val">{s.val}</div>
                        <div className="cat-hero-stat-lbl">{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── TRUST BAR ── */}
            <div className="trust-bar">
              <div className="trust-inner">
                {[
                  { ico: <IconShield />, txt: "Compra 100% segura" },
                  { ico: <IconTag />, txt: "Precios sin sorpresas" },
                  { ico: <IconCheck />, txt: "Vendedor verificado" },
                  { ico: <IconPackage />, txt: "Envío a todo el país" },
                ].map(t => (
                  <div className="trust-item" key={t.txt}>
                    {t.ico}{t.txt}
                  </div>
                ))}
              </div>
            </div>

            {/* ── FILTROS ── */}
            <div className="prod-controls">
              <div className="prod-controls-inner">
                <div className="prod-cats">
                  {productCategories.map(c => (
                    <button
                      key={c}
                      className={`prod-cat-pill${prodCat === c ? " active" : ""}`}
                      onClick={() => setProdCat(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="prod-search">
                  <span className="prod-search-icon"><IconSearch /></span>
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── PRODUCTOS ── */}
            <main className="main">
              <div className="results-bar">
                <p className="results-count">
                  <strong>{filtered.length}</strong> producto{filtered.length !== 1 ? "s" : ""}
                  {prodCat !== "Todos" && ` en ${prodCat}`}
                </p>
              </div>
              <div className="prod-grid">
                {filtered.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    index={i}
                    onAdd={handleAdd}
                    onOpen={handleOpenProduct}
                    added={!!addedMap[p.id]}
                  />
                ))}
              </div>
            </main>
          </>
        ) : null}
      </div>
    
      <style>{`
:root {
          --blue-700: #1d4ed8; --blue-600: #2563eb; --blue-500: #3b82f6; --blue-400: #60a5fa;
          --blue-50: #eff6ff; --teal-500: #06b6d4; --teal-400: #22d3ee;
          --slate-900: #0f172a; --slate-700: #334155; --slate-500: #64748b;
          --slate-400: #94a3b8; --slate-300: #cbd5e1; --slate-200: #e2e8f0;
          --slate-100: #f1f5f9; --slate-50: #f8fafc; --white: #ffffff;
        }


                /* ─── HERO DEL CATÁLOGO ─── */
        .cat-hero {
          position: relative; overflow: hidden;
          padding: 52px 28px 48px;
        }
        .cat-hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; background-repeat: no-repeat; }
        .cat-hero-pattern {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 26px 26px;
        }
        .cat-hero-inner {
          position: relative; z-index: 1; max-width: 1280px; margin: 0 auto;
          display: flex; align-items: flex-start; gap: 40px; flex-wrap: wrap;
        }
        .cat-hero-logo {
          width: 96px; height: 96px; border-radius: 22px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
          border: 2px solid rgba(255,255,255,0.25);
          font-family: 'Lexend', sans-serif; font-size: 32px; font-weight: 800; color: white;
        }
        .cat-hero-info { flex: 1; min-width: 260px; }
        .cat-hero-top { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
        .cat-hero-category {
          padding: 4px 12px; border-radius: 100px;
          background: rgba(255,255,255,0.15); backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.25);
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.9);
          text-transform: uppercase; letter-spacing: 0.8px;
        }
        .cat-hero-verified {
          display: flex; align-items: center; gap: 4px;
          padding: 4px 10px; border-radius: 100px;
          background: rgba(34,197,94,0.2); border: 1px solid rgba(34,197,94,0.35);
          font-size: 11px; font-weight: 700; color: #86efac;
        }
        .cat-hero-name {
          font-family: 'Lexend', sans-serif; font-size: clamp(24px, 3vw, 36px);
          font-weight: 800; color: white; letter-spacing: -0.8px; margin-bottom: 8px;
        }
        .cat-hero-vendor {
          display: flex; align-items: center; gap: 6px;
          font-size: 14px; color: rgba(255,255,255,0.55); margin-bottom: 16px;
        }
        .cat-hero-desc {
          font-size: 14.5px; color: rgba(255,255,255,0.45);
          line-height: 1.7; max-width: 520px; font-weight: 300;
          margin-bottom: 16px;
        }
        .cat-hero-qr {
          display: inline-flex; flex-direction: column; align-items: center; gap: 6px;
        }
        .cat-hero-qr-box {
          width: 120px; height: 120px; border-radius: 16px;
          background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.22);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(6px);
        }
        .cat-hero-qr-img {
          width: 96px; height: 96px; border-radius: 12px; background: #fff; padding: 6px;
        }
        .cat-hero-qr-msg {
          font-size: 11px; color: rgba(255,255,255,0.6); text-align: center; padding: 6px;
        }
        .cat-hero-qr-label {
          font-size: 11px; color: rgba(255,255,255,0.5); text-align: center;
        }
        .cat-hero-stats {
          display: flex; gap: 28px; flex-wrap: wrap; margin-top: 24px;
        }
        .cat-hero-stat-val {
          font-family: 'Lexend', sans-serif; font-size: 22px; font-weight: 800; color: white;
        }
        .cat-hero-stat-lbl {
          font-size: 11.5px; color: rgba(255,255,255,0.35); margin-top: 2px;
        }

        /* Trust badges */
        .trust-bar {
          background: white; border-bottom: 1px solid var(--slate-200);
          padding: 12px 28px;
        }
        .trust-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; gap: 24px; flex-wrap: wrap; align-items: center;
        }
        .trust-item {
          display: flex; align-items: center; gap: 6px;
          font-size: 12.5px; font-weight: 600; color: var(--slate-500);
        }
        .trust-item svg { color: var(--blue-500); }

        /* ─── FILTROS DE PRODUCTOS ─── */
        .prod-controls {
          background: white; border-bottom: 1px solid var(--slate-200);
          position: sticky; top: 64px; z-index: 90;
        }
        .prod-controls-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; gap: 14px;
          padding: 14px 28px; flex-wrap: wrap;
        }
        .prod-cats { display: flex; gap: 8px; flex-wrap: wrap; flex: 1; }
        .prod-cat-pill {
          padding: 7px 16px; border-radius: 100px;
          font-size: 12.5px; font-weight: 700;
          border: 1.5px solid var(--slate-200); background: var(--slate-50); color: var(--slate-600);
          cursor: pointer; transition: all 0.18s; font-family: 'Nunito', sans-serif;
        }
        .prod-cat-pill:hover { border-color: var(--blue-400); color: var(--blue-600); background: var(--blue-50); }
        .prod-cat-pill.active { background: var(--blue-600); color: white; border-color: var(--blue-600); }
        .prod-search {
          position: relative; flex-shrink: 0;
        }
        .prod-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--slate-400); display: flex; pointer-events: none; }
        .prod-search input {
          padding: 9px 14px 9px 36px; border-radius: 10px;
          border: 1.5px solid var(--slate-200); background: var(--slate-50);
          font-size: 13px; color: var(--slate-900); font-family: 'Nunito', sans-serif;
          outline: none; width: 200px; transition: all 0.2s;
        }
        .prod-search input:focus { background: white; border-color: var(--blue-500); box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .prod-search input::placeholder { color: var(--slate-400); }

        /* ─── PRODUCTOS ─── */
        .main { max-width: 1280px; margin: 0 auto; padding: 32px 28px 64px; }
        .results-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px;
        }
        .results-count { font-size: 14px; color: var(--slate-500); }
        .results-count strong { color: var(--slate-900); font-weight: 800; }

        .prod-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }
        @media (max-width: 540px) { .prod-grid { grid-template-columns: 1fr 1fr; gap: 12px; } }
        @media (max-width: 380px) { .prod-grid { grid-template-columns: 1fr; } }

        .prod-card {
          background: white; border-radius: 18px; border: 1px solid var(--slate-200);
          overflow: hidden; transition: all 0.25s;
          animation: cardIn 0.4s ease both;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          cursor: pointer;
        }
        @keyframes cardIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .prod-card:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(0,0,0,0.1); }

        .prod-img {
          height: 180px; position: relative;
          display: flex; align-items: center; justify-content: center;
          background-size: cover; background-position: center;
        }
        .prod-img-icon { color: rgba(255,255,255,0.3); }
        .prod-tag {
          position: absolute; top: 10px; left: 10px;
          padding: 3px 9px; border-radius: 100px;
          font-size: 10px; font-weight: 800; color: white;
          text-transform: uppercase; letter-spacing: 0.6px;
        }
        .prod-discount {
          position: absolute; top: 10px; right: 10px;
          padding: 3px 9px; border-radius: 100px;
          background: #fef3c7; color: #92400e;
          font-size: 10px; font-weight: 800;
        }
        .prod-body { padding: 14px 16px 10px; }
        .prod-cat {
          font-size: 10.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.6px; color: var(--blue-600); margin-bottom: 6px;
        }
        .prod-name {
          font-family: 'Lexend', sans-serif; font-size: 14px; font-weight: 700;
          color: var(--slate-900); margin-bottom: 8px; line-height: 1.25;
        }
        .prod-rating { display: flex; align-items: center; gap: 2px; margin-bottom: 10px; }
        .prod-rating-num { font-size: 12px; font-weight: 800; color: var(--slate-800); margin-left: 4px; }
        .prod-rating-rev { font-size: 11px; color: var(--slate-400); margin-left: 3px; }
        .prod-sales { font-size: 11px; color: var(--slate-400); margin-left: 2px; }
        .prod-price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
        .prod-price { font-family: 'Lexend', sans-serif; font-size: 18px; font-weight: 800; color: var(--slate-900); }
        .prod-original { font-size: 13px; color: var(--slate-400); text-decoration: line-through; }
        .prod-stock { font-size: 11.5px; font-weight: 600; margin-bottom: 0; }

        .prod-actions {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px 14px;
        }
        .qty-ctrl {
          display: flex; align-items: center; gap: 0;
          border: 1.5px solid var(--slate-200); border-radius: 10px; overflow: hidden;
          flex-shrink: 0;
        }
        .qty-btn {
          width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer; color: var(--slate-600);
          transition: all 0.15s;
        }
        .qty-btn:hover { background: var(--slate-100); color: var(--blue-600); }
        .qty-num { padding: 0 10px; font-size: 13.5px; font-weight: 700; color: var(--slate-900); }

        .add-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
          height: 36px; border-radius: 10px; border: none;
          font-size: 13px; font-weight: 700; font-family: 'Nunito', sans-serif;
          cursor: pointer; transition: all 0.22s;
          background: var(--blue-600); color: white;
          box-shadow: 0 2px 8px rgba(37,99,235,0.25);
        }
        .add-btn:hover { background: var(--blue-700); transform: scale(1.02); }
        .add-btn.added { background: #22c55e; box-shadow: 0 2px 8px rgba(34,197,94,0.3); }

        /* Skeleton */
        .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .skel-card { background: white; border-radius: 18px; overflow: hidden; border: 1px solid var(--slate-200); }
        .skel-img { height: 180px; }
        .skel-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }

      `}</style>
</>
  );
}
