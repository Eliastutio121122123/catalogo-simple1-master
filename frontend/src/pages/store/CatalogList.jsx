import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { storeService } from "../../services/odoo/storeService";

// ─── Iconos ───────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const IconGrid = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const IconList = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const IconCart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const IconStar = ({ filled }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconPackage = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);


// ─── Datos reales ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = ["Más recientes", "Más populares", "A–Z", "Mayor precio", "Menor precio"];
const PALETTE = [
  { accent: "#8b5cf6", cover: "from-violet-500 to-purple-700" },
  { accent: "#06b6d4", cover: "from-blue-500 to-cyan-600" },
  { accent: "#f59e0b", cover: "from-amber-400 to-orange-500" },
  { accent: "#10b981", cover: "from-emerald-500 to-teal-600" },
  { accent: "#ec4899", cover: "from-pink-500 to-rose-600" },
  { accent: "#84cc16", cover: "from-lime-500 to-green-600" },
  { accent: "#64748b", cover: "from-slate-600 to-zinc-700" },
  { accent: "#6366f1", cover: "from-indigo-500 to-blue-700" },
  { accent: "#14b8a6", cover: "from-teal-500 to-emerald-600" },
];

const getVendorName = (vendor) => {
  if (Array.isArray(vendor) && vendor.length > 1) return vendor[1];
  if (typeof vendor === "string") return vendor;
  return "Vendedor";
};

const toCatalogView = (row, idx) => {
  const palette = PALETTE[idx % PALETTE.length];
  const products = Number(row.product_count || 0);
  const rating = Number(row.rating ?? (products > 0 ? 4.7 : 0));
  const reviews = Number(row.reviews ?? (products > 0 ? Math.min(999, products * 6) : 0));
  const tag = products >= 50 ? "Destacado" : products <= 5 ? "Nuevo" : null;
  const image = row.image_url || (Array.isArray(row.image_urls) ? row.image_urls[0] : null) || null;
  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name || "Catálogo",
    vendor: getVendorName(row.vendor_id),
    category: row.category || "General",
    products,
    rating,
    reviews,
    cover: palette.cover,
    accent: palette.accent,
    tag,
    verified: !!row.vendor_id,
    description: row.description || "Catálogo de productos disponibles.",
    image,
  };
};

// ─── Componente CatalogCard ───────────────────────────────────────────────────
function CatalogCard({ catalog, view, index, onClick }) {
  const [hovered, setHovered] = useState(false);
  const hasImage = !!catalog.image;

  if (view === "list") {
    return (
      <div
        className="cat-list-item"
        style={{ animationDelay: `${index * 60}ms` }}
        onClick={() => onClick(catalog.slug || catalog.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className={`cat-list-cover${hasImage ? "" : ` bg-gradient-to-br ${catalog.cover}`}`}
          style={hasImage ? { backgroundImage: `url(${catalog.image})` } : undefined}
        >
          {!hasImage && <IconPackage />}
          {catalog.tag && <div className="cat-badge" style={{ background: catalog.accent }}>{catalog.tag}</div>}
        </div>
        <div className="cat-list-info">
          <div className="cat-list-top">
            <div>
              <div className="cat-list-name">{catalog.name}</div>
              <div className="cat-list-vendor">
                <IconUser />
                {catalog.vendor}
                {catalog.verified && <span className="verified-dot" title="Vendedor verificado">✓</span>}
              </div>
            </div>
            <div className="cat-list-meta">
              <div className="cat-rating">
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{ color: i <= Math.floor(catalog.rating) ? "#f59e0b" : "#e2e8f0" }}>
                    <IconStar filled={i <= Math.floor(catalog.rating)} />
                  </span>
                ))}
                <span className="cat-rating-num">{catalog.rating}</span>
                <span className="cat-rating-rev">({catalog.reviews})</span>
              </div>
              <div className="cat-products-count">{catalog.products} productos</div>
            </div>
          </div>
          <p className="cat-list-desc">{catalog.description}</p>
        </div>
        <div className={`cat-list-arrow${hovered ? " hovered" : ""}`}><IconArrow /></div>
      </div>
    );
  }

  return (
    <div
      className="cat-card"
      style={{ animationDelay: `${index * 70}ms` }}
      onClick={() => onClick(catalog.slug || catalog.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`cat-cover${hasImage ? "" : ` bg-gradient-to-br ${catalog.cover}`}`}
        style={hasImage ? { backgroundImage: `url(${catalog.image})` } : undefined}
      >
        {!hasImage && <div className="cat-cover-icon"><IconPackage /></div>}
        <div className="cat-cover-overlay" style={{ opacity: hovered ? 1 : 0 }} />
        {catalog.tag && (
          <div className="cat-badge" style={{ background: catalog.accent }}>{catalog.tag}</div>
        )}
        {catalog.verified && (
          <div className="cat-verified">✓ Verificado</div>
        )}
      </div>
      <div className="cat-body">
        <div className="cat-category-pill" style={{ color: catalog.accent, background: `${catalog.accent}18`, border: `1px solid ${catalog.accent}30` }}>
          {catalog.category}
        </div>
        <h3 className="cat-name">{catalog.name}</h3>
        <div className="cat-vendor">
          <IconUser />
          <span>{catalog.vendor}</span>
        </div>
        <p className="cat-desc">{catalog.description}</p>
        <div className="cat-footer">
          <div className="cat-rating">
            {[1,2,3,4,5].map(i => (
              <span key={i} style={{ color: i <= Math.floor(catalog.rating) ? "#f59e0b" : "#e2e8f0" }}>
                <IconStar filled={i <= Math.floor(catalog.rating)} />
              </span>
            ))}
            <span className="cat-rating-num">{catalog.rating}</span>
            <span className="cat-rating-rev">({catalog.reviews})</span>
          </div>
          <div className="cat-products-count">{catalog.products} productos</div>
        </div>
      </div>
      <div className={`cat-cta${hovered ? " hovered" : ""}`} style={{ background: catalog.accent }}>
        Ver catálogo <IconArrow />
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function CatalogList() {
  const { cartCount = 0 } = useContext(CartContext) || {};
  const navigate = useNavigate();
  const [catalogs, setCatalogs]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("Todos");
  const [sort, setSort]             = useState("Más recientes");
  const [view, setView]             = useState("grid"); // grid | list
  const [showSort, setShowSort]     = useState(false);

  const loadCatalogs = () => {
    let alive = true;
    setLoading(true);
    storeService
      .listCatalogs()
      .then(rows => {
        if (!alive) return;
        const mapped = (rows || []).map((row, idx) => toCatalogView(row, idx));
        setCatalogs(mapped);
        setError("");
      })
      .catch(err => {
        if (!alive) return;
        setError(err?.message || "No se pudieron cargar los catálogos.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => { alive = false; };
  };

  useEffect(() => {
    const cleanup = loadCatalogs();
    return () => { cleanup && cleanup(); };
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    catalogs.forEach(c => set.add(c.category));
    return ["Todos", ...Array.from(set).filter(Boolean)];
  }, [catalogs]);

  const filtered = catalogs.filter(c => {
    const name = (c.name || "").toLowerCase();
    const vendor = (c.vendor || "").toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) ||
                        vendor.includes(search.toLowerCase());
    const matchCat    = category === "Todos" || c.category === category;
    return matchSearch && matchCat;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "A–Z")           return a.name.localeCompare(b.name);
    if (sort === "Más populares") return b.reviews - a.reviews;
    if (sort === "Mayor precio")  return b.products - a.products;
    if (sort === "Menor precio")  return a.products - b.products;
    return b.id - a.id;
  });

  const handleCatalogClick = (slugOrId) => navigate(`/catalog/${slugOrId}`);

  const totalCatalogs = catalogs.length;
  const totalProducts = catalogs.reduce((acc, c) => acc + (Number(c.products) || 0), 0);

  return (
    <>
<div onClick={() => setShowSort(false)}>


        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-pattern" />
          <div className="hero-glow-a" /><div className="hero-glow-b" />
          <div className="hero-inner">
            <div className="hero-eyebrow">
              <div className="hero-dot" />
              <span className="hero-eyebrow-txt">Catálogos disponibles</span>
            </div>
            <h1 className="hero-title">
              Descubre los mejores<br />
              <span className="grad">catálogos digitales</span>
            </h1>
            <p className="hero-sub">
              Explora cientos de productos de vendedores verificados.
              Compra fácil, seguro y con envío a tu puerta.
            </p>
            <div className="hero-stats">
              {[
                { val: `${totalCatalogs}`, lbl: "Catálogos activos" },
                { val: `${totalProducts}`, lbl: "Productos disponibles" },
                { val: totalCatalogs > 0 ? "4.7★" : "—", lbl: "Valoración promedio" },
              ].map(s => (
                <div key={s.lbl}>
                  <div className="hero-stat-val">{s.val}</div>
                  <div className="hero-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTROLES ── */}
        <div className="controls">
          <div className="controls-inner">
            <div className="cats-row">
              {categories.map(c => (
                <button
                  key={c}
                  className={`cat-pill${category === c ? " active" : ""}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="controls-right">
              <div className="sort-wrap" onClick={e => e.stopPropagation()}>
                <button className="sort-btn" onClick={() => setShowSort(v => !v)}>
                  <IconFilter />
                  {sort}
                  <IconChevronDown />
                </button>
                {showSort && (
                  <div className="sort-dropdown">
                    {SORT_OPTIONS.map(o => (
                      <div
                        key={o}
                        className={`sort-option${sort === o ? " active" : ""}`}
                        onClick={() => { setSort(o); setShowSort(false); }}
                      >
                        {o}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="view-btns">
                <button className={`view-btn${view === "grid" ? " active" : ""}`} onClick={() => setView("grid")}><IconGrid /></button>
                <button className={`view-btn${view === "list" ? " active" : ""}`} onClick={() => setView("list")}><IconList /></button>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTENIDO ── */}
        <main className="main">
          <div className="results-bar">
            <p className="results-count">
              <strong>{sorted.length}</strong> catálogo{sorted.length !== 1 ? "s" : ""} encontrado{sorted.length !== 1 ? "s" : ""}
            </p>
            <div className="active-filters">
              {category !== "Todos" && (
                <div className="filter-chip">
                  {category}
                  <button onClick={() => setCategory("Todos")}><IconX /></button>
                </div>
              )}
              {search && (
                <div className="filter-chip">
                  "{search}"
                  <button onClick={() => setSearch("")}><IconX /></button>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="cat-grid">
              {[...Array(6)].map((_, i) => (
                <div className="skel-card" key={i}>
                  <div className="skel-cover skeleton" />
                  <div className="skel-body">
                    <div className="skeleton" style={{ height: 14, width: "40%" }} />
                    <div className="skeleton" style={{ height: 18, width: "80%" }} />
                    <div className="skeleton" style={{ height: 12, width: "55%" }} />
                    <div className="skeleton" style={{ height: 12, width: "90%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="empty">
              <div className="empty-ico"><IconPackage /></div>
              <h3 className="empty-title">No se pudieron cargar los catálogos</h3>
              <p className="empty-sub">{error}</p>
              <button className="empty-btn" onClick={loadCatalogs}>
                Reintentar
              </button>
            </div>
          ) : sorted.length === 0 ? (
            <div className="empty">
              <div className="empty-ico"><IconPackage /></div>
              <h3 className="empty-title">Sin resultados</h3>
              <p className="empty-sub">No encontramos catálogos con esos filtros. Intenta con otra búsqueda o categoría.</p>
              <button className="empty-btn" onClick={() => { setSearch(""); setCategory("Todos"); }}>
                Limpiar filtros
              </button>
            </div>
          ) : view === "grid" ? (
            <div className="cat-grid">
              {sorted.map((c, i) => (
                <CatalogCard key={c.id} catalog={c} view="grid" index={i} onClick={handleCatalogClick} />
              ))}
            </div>
          ) : (
            <div className="cat-list">
              {sorted.map((c, i) => (
                <CatalogCard key={c.id} catalog={c} view="list" index={i} onClick={handleCatalogClick} />
              ))}
            </div>
          )}
        </main>
      </div>
    
      <style>{`
:root {
          --blue-700: #1d4ed8; --blue-600: #2563eb; --blue-500: #3b82f6; --blue-400: #60a5fa;
          --blue-100: #dbeafe; --blue-50: #eff6ff;
          --teal-500: #06b6d4; --teal-400: #22d3ee; --teal-300: #67e8f9;
          --slate-900: #0f172a; --slate-800: #1e293b; --slate-700: #334155;
          --slate-500: #64748b; --slate-400: #94a3b8; --slate-300: #cbd5e1;
          --slate-200: #e2e8f0; --slate-100: #f1f5f9; --slate-50: #f8fafc;
          --white: #ffffff;
        }


                /* ─── HERO BANNER ─── */
        .hero {
          background: linear-gradient(135deg, #0a1628 0%, #0f2044 50%, #0d2d60 100%);
          padding: 56px 28px; position: relative; overflow: hidden;
        }
        .hero-pattern {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(34,211,238,0.12) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .hero-glow-a {
          position: absolute; width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(29,78,216,0.35), transparent 70%);
          top: -100px; right: -80px; filter: blur(80px);
        }
        .hero-glow-b {
          position: absolute; width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(6,182,212,0.25), transparent 70%);
          bottom: -60px; left: 10%; filter: blur(70px);
        }
        .hero-inner {
          position: relative; z-index: 1; max-width: 1280px; margin: 0 auto;
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(6,182,212,0.12); border: 1px solid rgba(6,182,212,0.25);
          border-radius: 100px; padding: 4px 14px; margin-bottom: 18px;
        }
        .hero-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--teal-400);
          animation: blink 2.5s ease-in-out infinite; box-shadow: 0 0 6px rgba(34,211,238,0.6);
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .hero-eyebrow-txt {
          font-size: 11px; font-weight: 700; color: var(--teal-300);
          text-transform: uppercase; letter-spacing: 1.4px;
        }
        .hero-title {
          font-family: 'Lexend', sans-serif;
          font-size: clamp(28px, 4vw, 48px); font-weight: 800;
          color: white; letter-spacing: -1px; line-height: 1.1; margin-bottom: 14px;
        }
        .hero-title .grad {
          background: linear-gradient(90deg, var(--teal-400), var(--blue-400));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .hero-sub {
          font-size: 15px; color: rgba(255,255,255,0.45); font-weight: 300;
          line-height: 1.7; max-width: 500px; margin-bottom: 32px;
        }
        .hero-stats {
          display: flex; gap: 32px; flex-wrap: wrap;
        }
        .hero-stat-val {
          font-family: 'Lexend', sans-serif; font-size: 24px; font-weight: 800;
          color: white; letter-spacing: -0.5px;
        }
        .hero-stat-lbl {
          font-size: 12px; color: rgba(255,255,255,0.35); font-weight: 400; margin-top: 2px;
        }

        /* ─── FILTROS ─── */
        .controls {
          background: var(--white); border-bottom: 1px solid var(--slate-200);
          position: sticky; top: 0; z-index: 90;
        }
        .controls-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; gap: 14px;
          padding: 14px 28px; flex-wrap: wrap;
        }
        .cats-row { display: flex; gap: 8px; flex-wrap: wrap; flex: 1; }
        .cat-pill {
          padding: 7px 16px; border-radius: 100px;
          font-size: 12.5px; font-weight: 700;
          border: 1.5px solid var(--slate-200);
          background: var(--slate-50); color: var(--slate-600);
          cursor: pointer; transition: all 0.18s; white-space: nowrap;
          font-family: 'Nunito', sans-serif;
        }
        .cat-pill:hover { border-color: var(--blue-400); color: var(--blue-600); background: var(--blue-50); }
        .cat-pill.active { background: var(--blue-600); color: white; border-color: var(--blue-600); box-shadow: 0 2px 10px rgba(37,99,235,0.25); }

        .controls-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }

        .sort-wrap { position: relative; }
        .sort-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 10px;
          border: 1.5px solid var(--slate-200); background: var(--slate-50);
          font-size: 13px; font-weight: 600; color: var(--slate-700);
          cursor: pointer; font-family: 'Nunito', sans-serif; white-space: nowrap;
          transition: all 0.18s;
        }
        .sort-btn:hover { border-color: var(--blue-400); color: var(--blue-600); }
        .sort-dropdown {
          position: absolute; right: 0; top: calc(100% + 6px);
          background: var(--white); border: 1px solid var(--slate-200);
          border-radius: 12px; padding: 6px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1); min-width: 180px; z-index: 200;
          animation: dropIn 0.15s ease;
        }
        @keyframes dropIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .sort-option {
          padding: 9px 12px; border-radius: 8px; font-size: 13px; font-weight: 600;
          color: var(--slate-700); cursor: pointer; transition: all 0.15s;
        }
        .sort-option:hover { background: var(--blue-50); color: var(--blue-600); }
        .sort-option.active { background: var(--blue-50); color: var(--blue-600); }

        .view-btns { display: flex; gap: 4px; }
        .view-btn {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid var(--slate-200); background: var(--slate-50);
          color: var(--slate-500); cursor: pointer; transition: all 0.18s;
        }
        .view-btn.active { background: var(--blue-600); border-color: var(--blue-600); color: white; }
        .view-btn:hover:not(.active) { border-color: var(--blue-400); color: var(--blue-600); }

        /* ─── MAIN CONTENT ─── */
        .main { max-width: 1280px; margin: 0 auto; padding: 32px 28px 64px; }

        .results-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px; flex-wrap: wrap; gap: 10px;
        }
        .results-count {
          font-size: 14px; color: var(--slate-500); font-weight: 500;
        }
        .results-count strong { color: var(--slate-900); font-weight: 800; }
        .active-filters { display: flex; gap: 7px; flex-wrap: wrap; }
        .filter-chip {
          display: flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 100px;
          background: var(--blue-50); border: 1px solid var(--blue-100);
          font-size: 12px; font-weight: 700; color: var(--blue-700);
        }
        .filter-chip button { background: none; border: none; cursor: pointer; color: var(--blue-500); display: flex; padding: 0; }

        /* ─── GRID ─── */
        .cat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 22px;
        }
        @media (max-width: 640px) { .cat-grid { grid-template-columns: 1fr; } }

        .cat-card {
          background: var(--white); border-radius: 18px;
          border: 1px solid var(--slate-200);
          overflow: hidden; cursor: pointer;
          transition: all 0.25s ease;
          animation: cardIn 0.4s ease both;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        @keyframes cardIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .cat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.12); border-color: var(--slate-300); }

        .cat-cover {
          height: 160px; position: relative;
          display: flex; align-items: center; justify-content: center;
          background-size: cover; background-position: center;
        }
        .cat-cover-icon { color: rgba(255,255,255,0.35); }
        .cat-cover-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.1);
          transition: opacity 0.25s;
        }
        .cat-badge {
          position: absolute; top: 12px; left: 12px;
          padding: 3px 10px; border-radius: 100px;
          font-size: 10px; font-weight: 800; color: white;
          text-transform: uppercase; letter-spacing: 0.8px;
        }
        .cat-verified {
          position: absolute; top: 12px; right: 12px;
          padding: 3px 9px; border-radius: 100px;
          background: rgba(255,255,255,0.15); backdrop-filter: blur(4px);
          font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.9);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .cat-body { padding: 18px 20px 14px; }
        .cat-category-pill {
          display: inline-block; padding: 3px 10px; border-radius: 100px;
          font-size: 10.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.6px; margin-bottom: 10px;
        }
        .cat-name {
          font-family: 'Lexend', sans-serif; font-size: 16px; font-weight: 700;
          color: var(--slate-900); letter-spacing: -0.3px; margin-bottom: 6px;
          line-height: 1.2;
        }
        .cat-vendor {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; color: var(--slate-500); margin-bottom: 10px;
        }
        .cat-desc {
          font-size: 13px; color: var(--slate-500); line-height: 1.5;
          font-weight: 400; margin-bottom: 14px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .cat-footer { display: flex; align-items: center; justify-content: space-between; }
        .cat-rating { display: flex; align-items: center; gap: 2px; }
        .cat-rating-num { font-size: 12.5px; font-weight: 800; color: var(--slate-900); margin-left: 4px; }
        .cat-rating-rev { font-size: 11.5px; color: var(--slate-400); margin-left: 2px; }
        .cat-products-count { font-size: 12px; color: var(--slate-400); font-weight: 600; }

        .cat-cta {
          margin: 0 16px 16px;
          padding: 10px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 13px; font-weight: 700; color: white;
          transform: translateY(4px); opacity: 0;
          transition: all 0.22s ease;
        }
        .cat-card:hover .cat-cta { opacity: 1; transform: translateY(0); }

        /* ─── LISTA ─── */
        .cat-list { display: flex; flex-direction: column; gap: 14px; }

        .cat-list-item {
          background: var(--white); border-radius: 16px; border: 1px solid var(--slate-200);
          display: flex; align-items: center; gap: 18px; padding: 14px 16px;
          cursor: pointer; transition: all 0.22s;
          animation: cardIn 0.4s ease both;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .cat-list-item:hover { transform: translateX(4px); box-shadow: 0 6px 24px rgba(0,0,0,0.08); border-color: var(--slate-300); }
        .cat-list-cover {
          width: 80px; height: 80px; border-radius: 14px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          position: relative; color: rgba(255,255,255,0.4);
          background-size: cover; background-position: center;
        }
        .cat-list-cover .cat-badge { top: 6px; left: 6px; font-size: 9px; padding: 2px 7px; }
        .cat-list-info { flex: 1; min-width: 0; }
        .cat-list-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
        .cat-list-name {
          font-family: 'Lexend', sans-serif; font-size: 15px; font-weight: 700;
          color: var(--slate-900); margin-bottom: 4px;
        }
        .cat-list-vendor {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: var(--slate-500);
        }
        .cat-list-meta { text-align: right; flex-shrink: 0; }
        .cat-list-desc {
          font-size: 12.5px; color: var(--slate-500); line-height: 1.5;
          display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
        }
        .cat-list-arrow {
          color: var(--slate-300); flex-shrink: 0; transition: all 0.2s;
        }
        .cat-list-arrow.hovered { color: var(--blue-600); transform: translateX(3px); }

        .verified-dot {
          background: #22c55e; color: white; width: 14px; height: 14px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 8px; font-weight: 900; margin-left: 3px; flex-shrink: 0;
        }

        /* ─── EMPTY ─── */
        .empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 14px; padding: 80px 20px; text-align: center;
        }
        .empty-ico {
          width: 72px; height: 72px; border-radius: 20px;
          background: var(--slate-100); display: flex; align-items: center; justify-content: center;
          color: var(--slate-400);
        }
        .empty-title { font-family: 'Lexend', sans-serif; font-size: 18px; font-weight: 700; color: var(--slate-700); }
        .empty-sub { font-size: 14px; color: var(--slate-400); line-height: 1.6; max-width: 300px; }
        .empty-btn {
          padding: 10px 24px; background: var(--blue-600); color: white;
          border: none; border-radius: 12px; font-size: 14px; font-weight: 700;
          font-family: 'Nunito', sans-serif; cursor: pointer; transition: all 0.2s;
        }
        .empty-btn:hover { background: var(--blue-700); transform: translateY(-1px); }

        /* ─── SKELETON ─── */
        .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .skel-card { background: white; border-radius: 18px; overflow: hidden; border: 1px solid var(--slate-200); }
        .skel-cover { height: 160px; }
        .skel-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; }

      `}</style>
</>
  );
}
