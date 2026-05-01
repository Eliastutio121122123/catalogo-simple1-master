import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { storeService } from "../../services/odoo/storeService";
// ─── Iconos ───────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconCart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const IconArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconStar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconBox = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);
const IconTag = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IconWhatsApp = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

// ─── Logo Catalogix ───────────────────────────────────────────────────────────

// ─── Datos de muestra (reemplazar con Odoo cuando esté conectado) ─────────────
const SAMPLE_FEATURED_CATALOGS = [
  { id: 1, name: "Tecnología & Gadgets", vendor: "TechStore RD",  products: 142, rating: 4.8, badge: "Más vendido", color: "#1d4ed8", emoji: "💻" },
  { id: 2, name: "Moda y Accesorios",    vendor: "Fashion House", products: 89,  rating: 4.6, badge: "Nuevo",       color: "#0891b2", emoji: "👗" },
  { id: 3, name: "Hogar & Decoración",   vendor: "Casa Bella",    products: 215, rating: 4.9, badge: "Top Rated",   color: "#1e40af", emoji: "🏠" },
  { id: 4, name: "Deportes & Fitness",   vendor: "Sport Center",  products: 78,  rating: 4.5, badge: "Oferta",      color: "#0e7490", emoji: "🏋️" },
];

const SAMPLE_FEATURED_PRODUCTS = [
  { id: 1, name: "MacBook Pro M3",        price: 85000, originalPrice: 95000, rating: 4.9, stock: 5,  emoji: "💻", hot: true  },
  { id: 2, name: "iPhone 15 Pro Max",     price: 72000, originalPrice: null,  rating: 4.8, stock: 12, emoji: "📱", hot: false },
  { id: 3, name: "Vestido Elegante Rojo", price: 3500,  originalPrice: 4800,  rating: 4.7, stock: 8,  emoji: "👗", hot: true  },
  { id: 4, name: "Sofá Modular",          price: 28000, originalPrice: null,  rating: 4.9, stock: 3,  emoji: "🛋️", hot: false },
  { id: 5, name: "Mancuernas Ajust.",     price: 4200,  originalPrice: 5500,  rating: 4.6, stock: 20, emoji: "🏋️", hot: false },
  { id: 6, name: "Auriculares Sony XM5",  price: 18000, originalPrice: 22000, rating: 4.8, stock: 7,  emoji: "🎧", hot: true  },
];

const SAMPLE_CATEGORIES = [
  { name: "Moda",        emoji: "👗", count: 89  },
  { name: "Deportes",    emoji: "⚽", count: 78  },
  { name: "Belleza",     emoji: "💄", count: 56  },
  { name: "Alimentos",   emoji: "🍎", count: 134 },
  { name: "Hogar",       emoji: "🏠", count: 215 },
  { name: "Electrónica", emoji: "🔌", count: 142 },
  { name: "Servicios",   emoji: "🛠️", count: 34  },
  { name: "Otros",       emoji: "📦", count: 12  },
];

const formatPrice = (p, currency = "DOP") => {
  const code = currency === "RD$" ? "DOP" : (currency || "DOP");
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(p);
};

const PALETTE = ["#1d4ed8", "#0891b2", "#1e40af", "#0e7490", "#7c3aed", "#16a34a", "#f97316", "#dc2626"];

const nameFromPair = (pair) => {
  if (Array.isArray(pair) && pair.length > 1) return pair[1];
  if (typeof pair === "string") return pair;
  return "";
};

const compactNumber = (n) => {
  const num = Number(n || 0);
  if (!num) return "0";
  try {
    return new Intl.NumberFormat("es-DO", { notation: "compact", maximumFractionDigits: 1 }).format(num);
  } catch {
    if (num >= 1_000_000) return `${Math.round((num / 1_000_000) * 10) / 10}M`;
    if (num >= 1_000) return `${Math.round((num / 1_000) * 10) / 10}K`;
    return `${num}`;
  }
};

const emojiForCategoryMojibake = (name) => {
  const n = String(name || "").toLowerCase();
  if (n.includes("tec") || n.includes("elect")) return "ðŸ’»";
  if (n.includes("mod") || n.includes("ropa")) return "ðŸ‘—";
  if (n.includes("hog") || n.includes("decor")) return "ðŸ ";
  if (n.includes("deport") || n.includes("fit")) return "ðŸ‹ï¸";
  if (n.includes("belle") || n.includes("salud")) return "ðŸ’„";
  if (n.includes("alim") || n.includes("comida")) return "ðŸŽ";
  if (n.includes("jugu") || n.includes("niÃ±")) return "ðŸ§¸";
  if (n.includes("libr") || n.includes("book")) return "ðŸ“š";
  return "ðŸ·ï¸";
};

const emojiForCategory = (name) => {
  const n = String(name || "").toLowerCase();
  if (n.includes("electr")) return "🔌";
  if (n.includes("tec")) return "💻";
  if (n.includes("mod") || n.includes("ropa")) return "👗";
  if (n.includes("hog") || n.includes("decor")) return "🏠";
  if (n.includes("deport") || n.includes("fit")) return "⚽";
  if (n.includes("belle") || n.includes("salud")) return "💄";
  if (n.includes("alim") || n.includes("comida")) return "🍎";
  if (n.includes("serv")) return "🛠️";
  if (n.includes("otro") || n.includes("misc") || n.includes("vario")) return "📦";
  if (n.includes("jugu") || n.includes("niñ") || n.includes("nino") || n.includes("niño")) return "🧸";
  if (n.includes("libr") || n.includes("book")) return "📚";
  return "🏷️";
};

const adaptHomeData = (payload) => {
  const stats = payload?.stats || {};

  const categories = Array.isArray(payload?.categories)
    ? payload.categories.map((c) => ({
        name: c?.name || "General",
        count: Number(c?.count || 0),
        emoji: emojiForCategory(c?.name),
      }))
    : [];

  const catalogs = Array.isArray(payload?.catalogs)
    ? payload.catalogs.map((row, idx) => {
        const products = Number(row?.product_count || 0);
        const badge = products >= 50 ? "Más vendido" : products <= 5 ? "Nuevo" : "Destacado";
        return {
          id: row?.id,
          slug: row?.slug || row?.id,
          name: row?.name || "Catálogo",
          vendor: nameFromPair(row?.vendor_id) || "Vendedor",
          products,
          rating: Number(row?.rating ?? 0),
          reviews: Number(row?.reviews ?? 0),
          badge,
          color: PALETTE[idx % PALETTE.length],
          emoji: "🏪",
          imageUrl: row?.image_url || (Array.isArray(row?.image_urls) ? row.image_urls[0] : null) || null,
        };
      })
    : [];

  const products = Array.isArray(payload?.products)
    ? payload.products.map((row) => {
        const catName = nameFromPair(row?.categ_id) || "General";
        const stock = Number(row?.catalog_stock_qty ?? row?.qty_available ?? 0);
        return {
          id: row?.id,
          name: row?.name || "Producto",
          price: Number(row?.list_price || 0),
          originalPrice: row?.original_price ? Number(row.original_price) : null,
          rating: Number(row?.rating || 0),
          stock: Math.max(0, Math.round(stock)),
          emoji: emojiForCategory(catName),
          hot: false,
          imageUrl: row?.image_url || (Array.isArray(row?.image_urls) ? row.image_urls[0] : null) || null,
          currency: Array.isArray(row?.currency_id) ? row.currency_id[1] : "DOP",
        };
      })
    : [];

  return { stats, categories, catalogs, products };
};

// ─── Componente Principal ─────────────────────────────────────────────────────
// Props que vienen de App.jsx:
//   cartCount   → número de items en el carrito
//   onAddToCart → función para agregar al carrito (addToCart en App.jsx)
//   onCartClick → función para ir al carrito (goToCart en App.jsx)
export default function Home() {
  const { cartCount = 0, addToCart } = useContext(CartContext) || {};
  const navigate  = useNavigate();
  const [search, setSearch]   = useState("");
  const [added, setAdded]     = useState(null); // id del producto recién agregado
  const searchRef = useRef(null);
  const [mode, setMode] = useState("loading"); // loading | live | mock
  const [loadError, setLoadError] = useState("");
  const [homeData, setHomeData] = useState({ stats: {}, categories: [], catalogs: [], products: [] });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setMode("loading");
      setLoadError("");
      try {
        const payload = await storeService.getHome();
        if (cancelled) return;
        setHomeData(adaptHomeData(payload));
        setMode("live");
      } catch (err) {
        if (cancelled) return;
        setHomeData({ stats: {}, categories: [], catalogs: [], products: [] });
        setLoadError(err?.message || "No se pudieron cargar datos del backend.");
        setMode("mock");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Handlers de navegación (compatibles con App.jsx) ──
  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    else navigate("/search");
  };

  const goSearch    = (term) => navigate(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  const goCatalogs  = ()     => navigate("/catalogs");
  const goCatalog   = (slugOrId)   => navigate(`/catalog/${slugOrId}`);
  const goProduct   = (id)   => navigate(`/product/${id}`);
  const goCart      = ()     => navigate("/cart");
  const goLogin     = ()     => navigate("/login");
  const goRegister  = ()     => navigate("/register");

  // Agregar al carrito con feedback visual
  const handleAddToCart = (product) => {
    if (addToCart) {
      addToCart({ ...product, qty: 1 });
      setAdded(product.id);
      setTimeout(() => setAdded(null), 1800);
    }
  };

  const stats = mode === "live" ? (homeData?.stats || {}) : {};
  const categories = mode === "live" ? (homeData?.categories || []) : SAMPLE_CATEGORIES;
  const featuredCatalogs = mode === "live"
    ? (homeData?.catalogs || []).map((c) => ({ ...c, emoji: "🏪" }))
    : SAMPLE_FEATURED_CATALOGS;
  const featuredProducts = mode === "live" ? (homeData?.products || []) : SAMPLE_FEATURED_PRODUCTS;
  const pillProducts = stats?.products
    ? `+${new Intl.NumberFormat("es-DO").format(stats.products)} productos disponibles`
    : "+0 productos disponibles";

  return (
    <div>


        {/* ══ HERO ══ */}
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-pattern" />
          <div className="hero-dots" />
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />

          <div className="hero-inner">
            <div>
              <div className="hero-pill">
                <div className="hero-pill-dot" />
                <span className="hero-pill-txt">{pillProducts}</span>
              </div>

              <h1 className="hero-h1">
                Descubre los mejores<br />
                <span className="grad">productos.</span>
              </h1>

              <p className="hero-p">
                Explora miles de productos de vendedores verificados.
                Compra con seguridad, paga como prefieras y recibe
                todo en un solo lugar.
              </p>

              <form className="hero-search" onSubmit={handleSearch}>
                <input
                  ref={searchRef}
                  className="hero-search-input"
                  placeholder="¿Qué estás buscando hoy?"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <button type="submit" className="hero-search-btn">
                  <IconSearch /> Buscar
                </button>
              </form>

              <div className="quick-tags">
                <span className="quick-tag-lbl">Popular:</span>
                {["iPhone", "Ropa", "Muebles", "Auriculares", "Zapatos"].map(t => (
                  <button key={t} className="quick-tag" onClick={() => goSearch(t)}>{t}</button>
                ))}
              </div>

              <div className="hero-stats">
                {[
                  { n: stats?.products ? `+${compactNumber(stats.products)}` : "—", l: "Productos" },
                  { n: stats?.vendors ? `${stats.vendors}+` : "—", l: "Vendedores" },
                  { n: "99.9%", l: "Uptime" },
                ].map(s => (
                  <div key={s.l}>
                    <div className="stat-num">{s.n}</div>
                    <div className="stat-lbl">{s.l}</div>
                  </div>
                ))}
              </div>

              {mode === "mock" && (
                <div className="mock-alert">
                  {loadError || "Backend no disponible. Mostrando datos de muestra."}
                </div>
              )}
            </div>

            {/* Tarjetas flotantes */}
            <div className="hero-visual">
              <div className="floating-cards">
                <div className="f-card f-card-1">
                  <div className="fc-header">
                    <div className="fc-ico">💻</div>
                    <div><div className="fc-title">MacBook Pro M3</div><div className="fc-sub">TechStore RD</div></div>
                  </div>
                  <div><span className="fc-price">RD$85,000</span><span className="fc-old">RD$95,000</span></div>
                  <div className="stars">{[...Array(5)].map((_,i) => <IconStar key={i} />)}</div>
                  <div className="fc-tag"><IconTag /> Más vendido</div>
                </div>

                <div className="f-card f-card-2">
                  <div className="fc-header">
                    <div className="fc-ico">👗</div>
                    <div><div className="fc-title">Vestido Elegante</div><div className="fc-sub">Fashion House</div></div>
                  </div>
                  <div><span className="fc-price">RD$3,500</span><span className="fc-old">RD$4,800</span></div>
                  <div className="fc-tag"><IconBox /> 8 disponibles</div>
                </div>

                <div className="f-card f-card-3">
                  <div className="fc-header">
                    <div className="fc-ico">🎧</div>
                    <div><div className="fc-title">Sony XM5</div><div className="fc-sub">TechStore RD</div></div>
                  </div>
                  <div><span className="fc-price">RD$18,000</span><span className="fc-old">RD$22,000</span></div>
                  <div className="stars">{[...Array(5)].map((_,i) => <IconStar key={i} />)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CATEGORÍAS ══ */}
        <div className="sec-alt">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <div className="sec-eyebrow">Explorar</div>
                <h2 className="sec-title">Categorías <span>populares</span></h2>
              </div>
              <button className="see-all" onClick={() => goSearch("")}>Ver todas <IconArrow /></button>
            </div>
            <div className="cat-grid">
              {categories.map(c => (
                <div key={c.name} className="cat-card" onClick={() => navigate(`/search?cat=${encodeURIComponent(c.name)}`)}>
                  <span className="cat-ico">{c.emoji}</span>
                  <span className="cat-name">{c.name}</span>
                  <span className="cat-cnt">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ CATÁLOGOS DESTACADOS ══ */}
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="sec-eyebrow">Catálogos</div>
              <h2 className="sec-title">Tiendas <span>destacadas</span></h2>
            </div>
            <button className="see-all" onClick={goCatalogs}>Ver todos <IconArrow /></button>
          </div>
          <div className="catalog-grid">
            {featuredCatalogs.map(c => (
              <div key={c.id} className="catalog-card" onClick={() => goCatalog(c.slug || c.id)}>
                <div className="catalog-banner" style={{ background: `linear-gradient(135deg,${c.color}22,${c.color}44)` }}>
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.name} style={{width:"100%", height:"100%", objectFit:"cover"}} />
                  ) : (
                    <span style={{ fontSize: 48 }}>{c.emoji}</span>
                  )}
                  <span className="catalog-badge-tag">{c.badge}</span>
                </div>
                <div className="catalog-body">
                  <div className="catalog-name">{c.name}</div>
                  <div className="catalog-vendor">{c.vendor}</div>
                  <div className="catalog-meta">
                    <div className="catalog-meta-item"><IconBox />{c.products} productos</div>
                    <div className="catalog-rating"><IconStar />{c.rating}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ PRODUCTOS DESTACADOS ══ */}
        <div className="sec-alt">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <div className="sec-eyebrow">Productos</div>
                <h2 className="sec-title">Lo más <span>vendido</span></h2>
              </div>
              <button className="see-all" onClick={() => goSearch("destacados")}>Ver todos <IconArrow /></button>
            </div>
            <div className="product-grid">
              {featuredProducts.slice(0, 6).map((p, idx) => {
                const disc = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : null;
                const done = added === p.id;
                return (
                  <div key={p.id} className="product-card">
                    <div className="product-img" onClick={() => goProduct(p.id)}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} style={{width:"100%", height:"100%", objectFit:"cover"}} />
                      ) : (
                        <span>{p.emoji}</span>
                      )}
                      {p.hot && <span className="hot-badge">🔥 Hot</span>}
                    </div>
                    <div className="product-body">
                      <div className="product-name" onClick={() => goProduct(p.id)}>{p.name}</div>
                      <div className="price-row">
                        <span className="price-main">{formatPrice(p.price, p.currency)}</span>
                        {p.originalPrice && <>
                          <span className="price-old">{formatPrice(p.originalPrice, p.currency)}</span>
                          <span className="price-disc">-{disc}%</span>
                        </>}

                        
                      </div>
                      <div className="product-footer">
                        <div className="rating-sm"><IconStar style={{ color: "#f59e0b" }} />{p.rating}</div>
                        <span className="stock-sm">{p.stock} disp.</span>
                      </div>
                      <button
                        className={`add-btn ${done ? "add-btn-done" : "add-btn-default"}`}
                        onClick={() => handleAddToCart(p)}
                        disabled={p.stock <= 0}
                      >
                        {p.stock <= 0 ? "Agotado" : done ? "✓ Agregado" : "+ Agregar al carrito"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══ BANNER PROMOCIONAL ══ */}
        <div className="wrap">
          <div className="promo">
            <div className="promo-bg" />
            <div className="promo-orb po1" />
            <div className="promo-orb po2" />
            <div className="promo-content">
              <div className="promo-pill">
                <div className="promo-pill-dot" />
                <span className="promo-pill-txt">Para vendedores</span>
              </div>
              <h2 className="promo-h2">¿Tienes productos<br />para <span>vender?</span></h2>
              <p className="promo-p">
                Crea tu catálogo digital gratis y llega a miles de clientes.
                Gestiona inventario, pedidos y pagos desde un solo panel.
              </p>
            </div>
            <div className="promo-actions">
              <button className="promo-btn" onClick={goRegister}>Crear mi tienda gratis →</button>
              <button className="promo-btn-sec" onClick={goLogin}>Ya tengo cuenta</button>
            </div>
          </div>
        </div>


        {/* ══ WhatsApp flotante ══ */}
        <button className="wa-float" onClick={() => window.open("https://wa.me/18090000000", "_blank")}>
          <IconWhatsApp />
        </button>

      
      <style>{`
:root {
          --blue-950: #0a1628; --blue-900: #0f2044; --blue-800: #1a3a6e;
          --blue-700: #1d4ed8; --blue-600: #2563eb; --blue-500: #3b82f6;
          --blue-300: #93c5fd; --blue-100: #dbeafe;
          --teal-600: #0891b2; --teal-500: #06b6d4;
          --teal-400: #22d3ee; --teal-300: #67e8f9;
          --white: #ffffff;
          --slate-50: #f8fafc;  --slate-100: #f1f5f9;
          --slate-200: #e2e8f0; --slate-300: #cbd5e1;
          --slate-400: #94a3b8; --slate-500: #64748b;
          --slate-700: #334155; --slate-900: #0f172a;
        }


        /* ════ HERO ════ */
        .hero {
          min-height: calc(100vh - 68px); position:relative; overflow:hidden;
          display:flex; align-items:center; padding-top:0;
        }
        .hero-bg {
          position:absolute; inset:0;
          background:linear-gradient(145deg,var(--blue-950) 0%,var(--blue-900) 45%,#0d2d60 100%);
        }
        .hero-pattern {
          position:absolute; inset:0;
          background-image:repeating-linear-gradient(-55deg,transparent 0,transparent 38px,rgba(6,182,212,0.04) 38px,rgba(6,182,212,0.04) 40px);
        }
        .hero-dots {
          position:absolute; inset:0;
          background-image:radial-gradient(circle,rgba(34,211,238,0.15) 1px,transparent 1px);
          background-size:30px 30px;
        }
        .orb {
          position:absolute; border-radius:50%;
          filter:blur(100px); pointer-events:none;
        }
        .orb-1 {
          width:600px; height:600px;
          background:radial-gradient(circle,rgba(29,78,216,0.5),transparent 70%);
          top:-150px; left:-100px;
          animation:f1 12s ease-in-out infinite;
        }
        .orb-2 {
          width:400px; height:400px;
          background:radial-gradient(circle,rgba(6,182,212,0.35),transparent 70%);
          bottom:-80px; right:10%;
          animation:f2 15s ease-in-out infinite;
        }
        .orb-3 {
          width:280px; height:280px;
          background:radial-gradient(circle,rgba(34,211,238,0.2),transparent 70%);
          top:30%; right:28%;
          animation:f1 9s ease-in-out infinite reverse;
        }
        @keyframes f1{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
        @keyframes f2{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(-15px,15px)} }

        .hero-inner {
          position:relative; z-index:2;
          max-width:1280px; margin:0 auto; padding:80px 24px 100px;
          display:grid; grid-template-columns:1fr; gap:60px; align-items:center;
        }
        @media(min-width:960px){ .hero-inner { grid-template-columns:1fr 1fr; } }

        .hero-pill {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(6,182,212,0.12); border:1px solid rgba(6,182,212,0.25);
          border-radius:100px; padding:6px 16px; margin-bottom:28px;
        }
        .hero-pill-dot {
          width:7px; height:7px; border-radius:50%;
          background:var(--teal-400); animation:blink 2.5s ease-in-out infinite;
          box-shadow:0 0 6px rgba(34,211,238,0.6);
        }
        @keyframes blink{ 0%,100%{opacity:1} 50%{opacity:0.2} }
        .hero-pill-txt {
          font-size:12px; font-weight:700; color:var(--teal-300);
          letter-spacing:1.2px; text-transform:uppercase;
        }
        .hero-h1 {
          font-family:'Lexend',sans-serif;
          font-size:clamp(38px,5vw,64px); font-weight:900;
          color:white; line-height:1.05; letter-spacing:-1.5px; margin-bottom:22px;
        }
        .hero-h1 .grad {
          color: var(--teal-400);
        }
        .hero-p {
          font-size:17px; font-weight:300; color:rgba(255,255,255,0.45);
          line-height:1.8; max-width:480px; margin-bottom:40px;
        }

        /* Barra búsqueda hero */
        .hero-search {
          display:flex; gap:0;
          background:white; border-radius:16px;
          padding:6px 6px 6px 18px;
          box-shadow:0 16px 48px rgba(0,0,0,0.3);
          max-width:540px; margin-bottom:28px;
        }
        .hero-search-input {
          flex:1; border:none; outline:none;
          font-size:15px; font-weight:500; color:var(--slate-900);
          font-family:'Nunito',sans-serif; background:transparent;
        }
        .hero-search-input::placeholder { color:var(--slate-400); font-weight:400; }
        .hero-search-btn {
          background:linear-gradient(135deg,var(--blue-700),var(--blue-600));
          border:none; border-radius:12px; padding:12px 22px;
          display:flex; align-items:center; gap:8px;
          font-size:14px; font-weight:700; color:white; cursor:pointer;
          font-family:'Nunito',sans-serif; white-space:nowrap;
          transition:all 0.2s; box-shadow:0 4px 14px rgba(37,99,235,0.4);
        }
        .hero-search-btn:hover { transform:translateY(-1px); box-shadow:0 8px 20px rgba(37,99,235,0.5); }

        /* Tags rápidos */
        .quick-tags { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
        .quick-tag-lbl {
          font-size:12px; font-weight:600;
          color:rgba(255,255,255,0.3); letter-spacing:0.8px; text-transform:uppercase;
        }
        .quick-tag {
          background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12);
          border-radius:100px; padding:6px 14px;
          font-size:12.5px; font-weight:500; color:rgba(255,255,255,0.55);
          cursor:pointer; transition:all 0.2s; font-family:'Nunito',sans-serif;
        }
        .quick-tag:hover {
          background:rgba(6,182,212,0.15); border-color:rgba(6,182,212,0.3); color:var(--teal-300);
        }

        /* Hero stats */
        .hero-stats {
          display:flex; gap:32px; margin-top:44px; padding-top:36px;
          border-top:1px solid rgba(255,255,255,0.08);
        }
        .stat-num {
          font-family:'Lexend',sans-serif; font-size:26px; font-weight:800;
          background:linear-gradient(90deg,white,var(--teal-400));
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .stat-lbl {
          font-size:11px; font-weight:600; color:rgba(255,255,255,0.3);
          text-transform:uppercase; letter-spacing:0.8px; margin-top:2px;
        }
        .mock-alert{
          margin-top:14px;
          padding:10px 12px;
          border-radius:12px;
          background:rgba(255,255,255,0.08);
          border:1px solid rgba(255,255,255,0.14);
          color:rgba(255,255,255,0.88);
          font-size:13px;
          max-width:520px;
        }

        /* Tarjetas flotantes hero */
        .hero-visual { display:none; }
        @media(min-width:960px){ .hero-visual { display:block; } }
        .floating-cards { position:relative; height:420px; }
        .f-card {
          position:absolute;
          background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12);
          backdrop-filter:blur(12px); border-radius:20px; padding:20px;
        }
        .f-card-1 { top:0; left:20px; right:0; animation:cf1 6s ease-in-out infinite; }
        .f-card-2 { top:145px; left:0; right:60px; animation:cf2 8s ease-in-out infinite; }
        .f-card-3 { top:285px; left:40px; right:20px; animation:cf1 7s ease-in-out infinite reverse; }
        @keyframes cf1{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes cf2{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
        .fc-header { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
        .fc-ico {
          width:40px; height:40px; border-radius:12px;
          background:linear-gradient(135deg,rgba(37,99,235,0.3),rgba(6,182,212,0.3));
          display:flex; align-items:center; justify-content:center; font-size:20px;
        }
        .fc-title { font-size:14px; font-weight:700; color:white; }
        .fc-sub   { font-size:11.5px; color:rgba(255,255,255,0.4); }
        .fc-price {
          font-family:'Lexend',sans-serif; font-size:20px; font-weight:800; color:var(--teal-400);
        }
        .fc-old { font-size:12px; color:rgba(255,255,255,0.3); text-decoration:line-through; margin-left:6px; }
        .fc-tag {
          display:inline-flex; align-items:center; gap:4px;
          background:rgba(34,211,238,0.15); border:1px solid rgba(34,211,238,0.25);
          border-radius:100px; padding:3px 10px;
          font-size:11px; font-weight:700; color:var(--teal-300); margin-top:8px;
        }
        .stars { display:flex; gap:2px; color:#f59e0b; margin-top:6px; }

        /* ════ SECCIONES ════ */
        .wrap { max-width:1280px; margin:0 auto; padding:72px 24px; }
        .sec-alt { background:var(--slate-100); }

        .sec-head {
          display:flex; align-items:flex-end; justify-content:space-between;
          margin-bottom:36px; flex-wrap:wrap; gap:16px;
        }
        .sec-eyebrow {
          font-size:11px; font-weight:700; color:var(--teal-500);
          text-transform:uppercase; letter-spacing:1.8px; margin-bottom:8px;
        }
        .sec-title {
          font-family:'Lexend',sans-serif;
          font-size:clamp(22px,3vw,32px); font-weight:800;
          color:var(--slate-900); letter-spacing:-0.7px;
        }
        .sec-title span {
          background:linear-gradient(90deg,var(--blue-600),var(--teal-500));
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .see-all {
          display:flex; align-items:center; gap:6px;
          background:none; border:1.5px solid var(--slate-200);
          border-radius:100px; padding:9px 18px;
          font-size:13px; font-weight:700; color:var(--blue-600);
          cursor:pointer; font-family:'Nunito',sans-serif;
          transition:all 0.2s; white-space:nowrap;
        }
        .see-all:hover { border-color:var(--blue-600); background:rgba(37,99,235,0.05); }

        /* Categorías */
        .cat-grid {
          display:grid; grid-template-columns:repeat(auto-fill,minmax(110px,1fr)); gap:12px;
        }
        @media(min-width:768px){ .cat-grid { grid-template-columns:repeat(8,1fr); } }
        .cat-card {
          display:flex; flex-direction:column; align-items:center; gap:9px;
          background:white; border:1.5px solid var(--slate-200); border-radius:18px;
          padding:18px 10px; cursor:pointer; transition:all 0.22s; text-align:center;
        }
        .cat-card:hover { border-color:var(--blue-400); box-shadow:0 8px 24px rgba(37,99,235,0.12); transform:translateY(-3px); }
        .cat-ico  { font-size:26px; line-height:1; }
        .cat-name { font-size:12px; font-weight:700; color:var(--slate-700); }
        .cat-cnt  { font-size:10.5px; color:var(--slate-400); font-weight:500; }

        /* Catálogos */
        .catalog-grid {
          display:grid; grid-template-columns:1fr; gap:18px;
        }
        @media(min-width:640px){ .catalog-grid { grid-template-columns:repeat(2,1fr); } }
        @media(min-width:1024px){ .catalog-grid { grid-template-columns:repeat(4,1fr); } }
        .catalog-card {
          border-radius:20px; overflow:hidden; background:white;
          border:1.5px solid var(--slate-200); cursor:pointer; transition:all 0.25s; position:relative;
        }
        .catalog-card:hover { box-shadow:0 12px 36px rgba(15,32,68,0.13); transform:translateY(-4px); border-color:var(--blue-300); }
        .catalog-banner {
          height:100px; display:flex; align-items:center; justify-content:center;
          font-size:46px; position:relative;
        }
        .catalog-badge-tag {
          position:absolute; top:10px; right:10px;
          background:rgba(255,255,255,0.9); border-radius:100px;
          padding:3px 10px; font-size:11px; font-weight:800; color:var(--blue-700);
        }
        .catalog-body { padding:16px; }
        .catalog-name {
          font-family:'Lexend',sans-serif; font-size:15px; font-weight:800;
          color:var(--slate-900); margin-bottom:4px;
        }
        .catalog-vendor { font-size:12px; color:var(--slate-400); font-weight:500; margin-bottom:10px; }
        .catalog-meta { display:flex; align-items:center; justify-content:space-between; }
        .catalog-meta-item { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--slate-500); font-weight:500; }
        .catalog-rating {
          display:flex; align-items:center; gap:4px;
          font-size:12px; font-weight:700; color:#92400e;
          background:#fef3c7; padding:3px 8px; border-radius:100px;
        }

        /* Productos */
        .product-grid {
          display:grid; grid-template-columns:repeat(2,1fr); gap:14px;
        }
        @media(min-width:640px){ .product-grid { grid-template-columns:repeat(3,1fr); } }
        @media(min-width:1024px){ .product-grid { grid-template-columns:repeat(6,1fr); } }
        .product-card {
          background:white; border:1.5px solid var(--slate-200); border-radius:18px;
          overflow:hidden; cursor:pointer; transition:all 0.22s; position:relative;
        }
        .product-card:hover { box-shadow:0 10px 32px rgba(15,32,68,0.11); transform:translateY(-3px); border-color:var(--blue-300); }
        .product-img {
          height:120px; background:var(--slate-100);
          display:flex; align-items:center; justify-content:center; font-size:44px; position:relative;
        }
        .hot-badge {
          position:absolute; top:8px; left:8px;
          background:linear-gradient(135deg,var(--blue-700),var(--teal-500));
          color:white; font-size:10px; font-weight:800;
          padding:3px 8px; border-radius:100px;
        }
        .product-body { padding:12px; }
        .product-name {
          font-size:13px; font-weight:700; color:var(--slate-800); margin-bottom:6px;
          line-height:1.3; display:-webkit-box; -webkit-line-clamp:2;
          -webkit-box-orient:vertical; overflow:hidden;
        }
        .price-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
        .price-main { font-family:'Lexend',sans-serif; font-size:15px; font-weight:800; color:var(--blue-700); }
        .price-old  { font-size:11px; color:var(--slate-400); text-decoration:line-through; font-weight:500; }
        .price-disc {
          font-size:10px; font-weight:800; color:white;
          background:linear-gradient(135deg,var(--blue-600),var(--teal-500));
          padding:2px 6px; border-radius:100px;
        }
        .product-footer { display:flex; align-items:center; justify-content:space-between; margin-top:8px; }
        .rating-sm { display:flex; align-items:center; gap:3px; font-size:11.5px; font-weight:600; color:var(--slate-500); }
        .stock-sm  { font-size:11px; color:var(--slate-400); }
        .add-btn {
          width:100%; margin-top:10px;
          border:none; border-radius:10px; padding:9px;
          font-size:12.5px; font-weight:700; color:white; cursor:pointer;
          font-family:'Nunito',sans-serif; transition:all 0.2s;
        }
        .add-btn-default {
          background:linear-gradient(135deg,var(--blue-700),var(--blue-600));
          box-shadow:0 3px 10px rgba(37,99,235,0.25);
        }
        .add-btn-default:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(37,99,235,0.35); }
        .add-btn:disabled, .add-btn-default:disabled { background:var(--slate-300); color:var(--slate-500); cursor:not-allowed; transform:none; box-shadow:none; }
        .add-btn-done {
          background:linear-gradient(135deg,#059669,#10b981);
          box-shadow:0 3px 10px rgba(5,150,105,0.3);
        }

        /* Banner promocional */
        .promo {
          background:linear-gradient(135deg,var(--blue-950),var(--blue-900),#0d2d60);
          border-radius:24px; overflow:hidden; position:relative;
          padding:52px 44px; display:flex; align-items:center;
          justify-content:space-between; gap:32px; flex-wrap:wrap;
        }
        .promo-bg {
          position:absolute; inset:0;
          background-image:radial-gradient(circle,rgba(34,211,238,0.1) 1px,transparent 1px);
          background-size:28px 28px; pointer-events:none;
        }
        .promo-orb {
          position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none;
        }
        .po1 { width:300px; height:300px; background:radial-gradient(circle,rgba(29,78,216,0.4),transparent 70%); top:-60px; right:8%; }
        .po2 { width:200px; height:200px; background:radial-gradient(circle,rgba(6,182,212,0.3),transparent 70%); bottom:-40px; left:18%; }
        .promo-content { position:relative; z-index:1; }
        .promo-pill {
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(6,182,212,0.15); border:1px solid rgba(6,182,212,0.3);
          border-radius:100px; padding:5px 14px; margin-bottom:16px;
        }
        .promo-pill-dot { width:6px; height:6px; border-radius:50%; background:var(--teal-400); animation:blink 2s infinite; }
        .promo-pill-txt { font-size:11px; font-weight:700; color:var(--teal-300); letter-spacing:1.2px; text-transform:uppercase; }
        .promo-h2 {
          font-family:'Lexend',sans-serif; font-size:clamp(24px,3vw,38px);
          font-weight:900; color:white; line-height:1.1; letter-spacing:-0.8px; margin-bottom:12px;
        }
        .promo-h2 span {
          background:linear-gradient(90deg,var(--teal-400),var(--blue-400));
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .promo-p { font-size:15px; color:rgba(255,255,255,0.4); font-weight:300; max-width:400px; line-height:1.7; }
        .promo-actions { position:relative; z-index:1; display:flex; flex-direction:column; gap:10px; flex-shrink:0; }
        .promo-btn {
          background:linear-gradient(135deg,var(--blue-600),var(--teal-500));
          border:none; border-radius:14px; padding:15px 32px;
          font-size:15px; font-weight:800; color:white; cursor:pointer;
          font-family:'Nunito',sans-serif; white-space:nowrap;
          transition:all 0.2s; box-shadow:0 6px 20px rgba(6,182,212,0.35);
        }
        .promo-btn:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(6,182,212,0.45); }
        .promo-btn-sec {
          background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.15);
          border-radius:14px; padding:14px 32px;
          font-size:14px; font-weight:700; color:rgba(255,255,255,0.7); cursor:pointer;
          font-family:'Nunito',sans-serif; transition:all 0.2s;
        }
        .promo-btn-sec:hover { background:rgba(255,255,255,0.12); color:white; }

      `}</style>
</div>
  );
}
