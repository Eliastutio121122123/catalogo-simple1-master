import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { storeService } from "../../services/odoo/storeService";
import { reviewService } from "../../services/odoo/reviewService";

// ─── Iconos ───────────────────────────────────────────────────────────────────
const I = {
  Back:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  Cart:    ()=><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Heart:   ({f})=><svg width="17" height="17" viewBox="0 0 24 24" fill={f?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Share:   ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Star:    ({f})=><svg width="14" height="14" viewBox="0 0 24 24" fill={f?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Plus:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Minus:   ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Check:   ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Shield:  ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Truck:   ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  Return:  ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.85"/></svg>,
  Tag:     ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  User:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Arrow:   ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Info:    ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};


const FALLBACK_IMAGES = ["#ffd6e0", "#fce7f3", "#fbcfe8", "#f9a8d4"];

const isImageUrl = (value) =>
  typeof value === "string" && (value.startsWith("data:") || value.startsWith("http"));

const buildProductDetail = (row) => {
  const catalog = Array.isArray(row.catalog_id) ? row.catalog_id[1] : "Catálogo";
  const catalogId = Array.isArray(row.catalog_id) ? row.catalog_id[0] : row.catalog_id || row.id;
  const category = Array.isArray(row.categ_id) ? row.categ_id[1] : "General";
  const stock = Number(row.catalog_stock_qty ?? row.qty_available ?? 0);
  const description = row.description_sale || row.description || "Producto disponible en el catálogo.";
  const imagesFromApi = Array.isArray(row.image_urls) ? row.image_urls.filter(Boolean) : [];
  const image = imagesFromApi[0] || row.image_url || null;
  const images = imagesFromApi.length ? imagesFromApi : (image ? [image] : FALLBACK_IMAGES);

  return {
    id: row.id,
    name: row.name || "Producto",
    brand: catalog,
    catalog,
    catalogId,
    vendor: catalog,
    verified: false,
    category,
    price: Number(row.list_price || 0),
    original: row.original_price ? Number(row.original_price) : null,
    rating: stock > 0 ? 4.7 : 0,
    reviews: stock > 0 ? Math.min(250, stock * 3) : 0,
    sold: 0,
    stock,
    sku: row.default_code || `SKU-${row.id}`,
    accent: "#2563eb",
    accentBg: "#eff6ff",
    description,
    features: [
      `Categoría: ${category}`,
      `Stock disponible: ${stock}`,
      "Entrega coordinada con el vendedor",
      "Pago seguro en Catalogix",
    ],
    colors: [{ id: "default", name: "Estándar", hex: "#94a3b8" }],
    sizes: ["Único"],
    images,
    imageUrl: image || "",
    reviews_data: [],
    related: [],
  };
};

const TABS = ["Descripción","Características","Reseñas","Política de envío"];

// ─── Stars helper ─────────────────────────────────────────────────────────────
function Stars({ r, size = 14 }) {
  return (
    <div style={{display:"flex",gap:2}}>
      {[1,2,3,4,5].map(i=><span key={i} style={{color:i<=Math.floor(r)?"#f59e0b":"#e2e8f0",fontSize:0}}><I.Star f={i<=Math.floor(r)}/></span>)}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { cartCount = 0, addToCart } = useContext(CartContext) || {};
  const navigate = useNavigate();
  const { id }   = useParams();

  const [product,  setProduct ] = useState(null);
  const [loading,  setLoading ] = useState(true);
  const [error,    setError   ] = useState("");

  const [imgIdx,   setImgIdx  ] = useState(0);
  const [color,    setColor   ] = useState("");
  const [size,     setSize    ] = useState("");
  const [qty,      setQty     ] = useState(1);
  const [faved,    setFaved   ] = useState(false);
  const [added,    setAdded   ] = useState(false);
  const [tab,      setTab     ] = useState(0);
  const [sizeErr,  setSizeErr ] = useState(false);

  const [reviewSummary, setReviewSummary] = useState({ avg: 0, total: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "" });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    storeService
      .getProduct(id)
      .then(row => {
        if (!alive) return;
        const mapped = buildProductDetail(row);
        setProduct(mapped);
        setColor(mapped.colors[0]?.id || "");
        setSize(mapped.sizes[0] || "");
        setImgIdx(0);
        setQty(1);
        setAdded(false);
        setFaved(false);
        setSizeErr(false);
        setError("");
        setReviewLoading(true);
        setReviewError("");
        reviewService
          .list(row.id)
          .then((res) => {
            if (!alive) return;
            const summary = res?.summary || { avg: 0, total: 0, counts: {} };
            const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, ...(summary.counts || {}) };
            const reviews = Array.isArray(res?.reviews) ? res.reviews : [];
            setReviewSummary({ avg: Number(summary.avg || 0), total: Number(summary.total || 0), counts });
            setReviewItems(reviews);
            setProduct((prev) =>
              prev
                ? { ...prev, rating: Number(summary.avg || 0), reviews: Number(summary.total || 0), reviews_data: reviews }
                : prev
            );
          })
          .catch((err) => {
            if (!alive) return;
            setReviewError(err?.message || "No se pudieron cargar las reseñas.");
            setReviewSummary({ avg: 0, total: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
            setReviewItems([]);
          })
          .finally(() => {
            if (!alive) return;
            setReviewLoading(false);
          });
      })
      .catch(err => {
        if (!alive) return;
        setError(err?.message || "No se pudo cargar el producto.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => { alive = false; };
  }, [id]);

  const discount  = product?.original ? Math.round((1-product.price/product.original)*100) : null;


  const handleAdd = () => {
    if (!product) return;
    if (product.sizes.length > 0 && !size) { setSizeErr(true); return; }
    setSizeErr(false);
    addToCart && addToCart({ ...product, qty, size, color });
    setAdded(true);
    setTimeout(()=>setAdded(false), 2500);
  };

  const handleReviewSubmit = async () => {
    if (!product) return;
    if (!reviewForm.body.trim()) {
      setReviewError("Escribe tu reseña antes de enviar.");
      return;
    }
    setReviewSubmitting(true);
    setReviewError("");
    try {
      await reviewService.create(product.id, {
        rating: reviewForm.rating,
        title: reviewForm.title,
        body: reviewForm.body,
      });
      setReviewForm({ rating: 5, title: "", body: "" });
      const res = await reviewService.list(product.id);
      const summary = res?.summary || { avg: 0, total: 0, counts: {} };
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, ...(summary.counts || {}) };
      const reviews = Array.isArray(res?.reviews) ? res.reviews : [];
      setReviewSummary({ avg: Number(summary.avg || 0), total: Number(summary.total || 0), counts });
      setReviewItems(reviews);
      setProduct((prev) =>
        prev
          ? { ...prev, rating: Number(summary.avg || 0), reviews: Number(summary.total || 0), reviews_data: reviews }
          : prev
      );
    } catch (err) {
      setReviewError(err?.message || "No se pudo enviar la reseña.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const selectedColor = product?.colors?.find(c=>c.id===color);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Cargando producto...</div>;
  }
  if (error || !product) {
    return <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>{error || "Producto no disponible."}</div>;
  }

  const currentImg = product.images[imgIdx];
  const mainStyle = isImageUrl(currentImg)
    ? { backgroundImage: `url(${currentImg})` }
    : { background: currentImg };
  const maxQty = Math.max(1, product.stock || 0);
  const outOfStock = product.stock <= 0;
  const ratingValue = reviewSummary.total ? reviewSummary.avg : product.rating;
  const reviewTotal = reviewSummary.total || product.reviews;
  const reviewCounts = reviewSummary.counts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const handleShare = async () => {
    const url = window.location.href;
    const title = product?.name || "Catalogix";
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Mira este producto: ${title}`,
          url,
        });
      } catch (err) {
        console.log("Share API error", err);
      }
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert("Enlace copiado al portapapeles");
      });
    }
  };

  return (
    <>
<div>

        {/* BREADCRUMB */}
        <div className="bc">
          <div className="bc-in">
            <span className="bc-link" onClick={()=>navigate("/catalogs")}>Catálogos</span>
            <span className="bc-sep">›</span>
            <span className="bc-link" onClick={()=>navigate(`/catalog/${product.catalogId}`)}>{product.catalog}</span>
            <span className="bc-sep">›</span>
            <span className="bc-cur">{product.name}</span>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="content">
          {/* GALERÍA */}
          <div className="gallery">
            <div className="main-img" style={mainStyle}>
              {!isImageUrl(currentImg) && <div className="main-img-inner">🛍️</div>}
              {discount && <div className="img-badge">-{discount}%</div>}
            </div>
            <div className="img-dots">
              {product.images.map((img,i)=>{
                const isImg = isImageUrl(img);
                const dotStyle = isImg ? { backgroundImage: `url(${img})` } : { background: img };
                return (
                  <div
                    key={i}
                    className={`img-dot${imgIdx===i?" act":""}`}
                    style={dotStyle}
                    onClick={()=>setImgIdx(i)}
                  >
                    {!isImg && <span style={{fontSize:18}}>🛍️</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* INFO */}
          <div className="info">
            <div className="info-top">
              <div className="cat-pill"><I.Tag/>{product.category}</div>
              <button className="share-btn" onClick={handleShare}><I.Share/>Compartir</button>
            </div>
            <h1 className="prod-name">{product.name}</h1>
            <div className="vendor-row">
              <I.User/>
              <span className="vendor-link" onClick={()=>navigate(`/catalog/${product.catalogId}`)}>{product.vendor}</span>
              {product.verified && <span className="vdot">✓</span>}
            </div>
            <div className="rating-row">
              <Stars r={ratingValue}/>
              <span className="rat-num">{ratingValue}</span>
              <span className="rat-rev" onClick={()=>setTab(2)}>({reviewTotal} reseñas)</span>
              <span className="sold-sep">·</span>
              <span className="sold-txt">{product.sold}+ vendidos</span>
            </div>

            {/* Precio */}
            <div className="price-block">
              <div className="price-row">
                <span className="price">RD${product.price.toLocaleString()}</span>
                {product.original && <span className="original">RD${product.original.toLocaleString()}</span>}
                {discount && <span className="disc-badge">-{discount}% OFF</span>}
              </div>
              <div className="itbis">ITBIS (18%) incluido</div>
              <div className="stock-pill">
                <div className="sdot" style={{background:product.stock<=5?"#f59e0b":"#22c55e"}}/>
                <span className="stxt" style={{color:product.stock<=5?"#92400e":"#166534"}}>
                  {product.stock<=5?`¡Solo ${product.stock} unidades disponibles!`:`✓ ${product.stock} en stock`}
                </span>
              </div>
            </div>

            {/* Color */}
            <div className="opt-section">
              <div className="opt-lbl">Color <span>{selectedColor?.name}</span></div>
              <div className="colors-row">
                {product.colors.map(c=>(
                  <div key={c.id} className={`color-swatch${color===c.id?" act":""}`}
                    style={{background:c.hex}} title={c.name}
                    onClick={()=>setColor(c.id)}
                  />
                ))}
              </div>
            </div>

            {/* Talla */}
            <div className="opt-section">
              <div className="opt-lbl">Talla {size && <span>{size}</span>}</div>
              <div className="sizes-row">
                {product.sizes.map(s=>(
                  <button key={s} className={`size-btn${size===s?" act":""}${sizeErr&&!size?" err":""}`} onClick={()=>{setSize(s);setSizeErr(false);}}>
                    {s}
                  </button>
                ))}
              </div>
              {sizeErr && <div className="size-err"><I.Info/>Selecciona una talla para continuar</div>}
            </div>

            {/* Qty + CTA */}
            <div className="cta-row">
              <div className="qty-ctrl">
                <button className="qty-btn" onClick={()=>setQty(q=>Math.max(1,q-1))} disabled={qty<=1}><I.Minus/></button>
                <span className="qty-num">{qty}</span>
                <button className="qty-btn" onClick={()=>setQty(q=>Math.min(maxQty,q+1))} disabled={outOfStock || qty>=maxQty}><I.Plus/></button>
              </div>
              <button className={`add-btn${added?" ok":""}`} onClick={handleAdd} disabled={outOfStock}>
                {outOfStock ? "Agotado" : added ? <><I.Check/>¡Agregado al carrito!</> : <><I.Cart/>Agregar al carrito</>}
              </button>
              <button className={`fav-btn-big${faved?" ok":""}`} onClick={()=>setFaved(v=>!v)}>
                <I.Heart f={faved}/>
              </button>
            </div>

            {/* Trust grid */}
            <div className="trust-grid">
              {[
                {i:<I.Shield/>,  t:"Compra 100% segura"},
                {i:<I.Truck/>,   t:"Envío a todo el país"},
                {i:<I.Return/>,  t:"Devoluciones en 7 días"},
                {i:<I.Tag/>,     t:"Precio garantizado"},
              ].map(x=>(
                <div className="trust-item" key={x.t}>
                  <div className="trust-ico">{x.i}</div>
                  <span className="trust-txt">{x.t}</span>
                </div>
              ))}
            </div>

            {/* Catalog card */}
            <div className="cat-card" onClick={()=>navigate(`/catalog/${product.catalogId}`)}>
              <div className="cat-ava">BN</div>
              <div className="cat-info">
                <div className="cat-name">{product.catalog}</div>
                <div className="cat-sub">Ver todos los productos del catálogo</div>
              </div>
              <div className="cat-arrow"><I.Arrow/></div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px"}}>
          <div className="tabs-wrap">
            <div className="tab-bar">
              {TABS.map((t,i)=>(
                <button key={t} className={`tab-btn${tab===i?" act":""}`} onClick={()=>setTab(i)}>{t}</button>
              ))}
            </div>

            {/* Tab 0: Descripción */}
            {tab===0 && (
              <div className="tab-desc" style={{animation:"ci .3s ease"}}>
                <p>{product.description}</p>
              </div>
            )}

            {/* Tab 1: Características */}
            {tab===1 && (
              <div style={{animation:"ci .3s ease"}}>
                <div className="feat-list">
                  {product.features.map(f=>(
                    <div className="feat-item" key={f}>
                      <div className="feat-ico"><I.Check/></div>
                      <span className="feat-txt">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="sku-row">
                  <span className="sku-lbl">SKU</span>
                  <span className="sku-val">{product.sku}</span>
                </div>
              </div>
            )}

            {/* Tab 2: Reseñas */}
            {tab===2 && (
              <div style={{animation:"ci .3s ease"}}>
                <div className="reviews-top">
                  <div className="rat-big">
                    <div className="rat-big-num">{ratingValue}</div>
                    <div style={{display:"flex",justifyContent:"center",margin:"6px 0 4px"}}><Stars r={ratingValue}/></div>
                    <div className="rat-big-lbl">{reviewTotal} reseñas</div>
                  </div>
                  <div className="rat-bars">
                    {[5,4,3,2,1].map((n) => {
                      const cnt = reviewCounts[n] || 0;
                      const pct = reviewTotal ? Math.round((cnt / reviewTotal) * 100) : 0;
                      return (
                        <div className="rat-bar-row" key={n}>
                          <span className="rat-bar-lbl">{n}</span>
                          <div className="rat-bar-track"><div className="rat-bar-fill" style={{width:`${pct}%`}}/></div>
                          <span className="rat-bar-cnt">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {reviewItems.length === 0 ? (
                  <div className="review-card">
                    <div className="review-name">Aún no hay reseñas para este producto.</div>
                  </div>
                ) : (
                  reviewItems.map(rv=>(
                    <div className="review-card" key={rv.id}>
                      <div className="review-head">
                        <div className="review-user">
                          <div className="review-ava">{rv.user[0]}</div>
                          <div>
                            <div className="review-name">{rv.user}</div>
                            <div className="review-date">{rv.date}</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:3}}><Stars r={rv.rating}/></div>
                      </div>
                      <p className="review-txt">{rv.text}</p>
                      <div className="review-helpful">¿Fue útil? <span>{rv.helpful} personas</span> dijeron que sí</div>
                    </div>
                  ))
                )}
                <div className="review-form">
                  <div className="review-form-title">Escribe una reseña</div>
                  {reviewError && <div className="review-error">{reviewError}</div>}
                  <div className="review-form-row">
                    <span>Tu calificación</span>
                    <div className="review-stars">
                      {[1,2,3,4,5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`review-star${n <= reviewForm.rating ? " on" : ""}`}
                          onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}
                        >
                          <I.Star f={n <= reviewForm.rating} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    className="review-input"
                    placeholder="Titulo (opcional)"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                  />
                  <textarea
                    className="review-textarea"
                    rows={4}
                    placeholder="Cuéntanos tu experiencia con este producto..."
                    value={reviewForm.body}
                    onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
                  />
                  <button className="review-submit" onClick={handleReviewSubmit} disabled={reviewSubmitting}>
                    {reviewSubmitting ? "Enviando..." : "Enviar reseña"}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Envío */}
            {tab===3 && (
              <div style={{animation:"ci .3s ease"}}>
                <div className="shipping-info">
                  {[
                    {i:<I.Truck/>, title:"Envío estándar", sub:"3–5 días hábiles. Gratis en pedidos mayores a RD$2,000."},
                    {i:<I.Truck/>, title:"Envío express", sub:"1–2 días hábiles. Costo adicional de RD$350 en Santo Domingo."},
                    {i:<I.Return/>,title:"Política de devoluciones",sub:"Tienes 7 días desde la recepción para devolver el producto en su estado original. El vendedor gestiona el reembolso en 3–5 días hábiles."},
                    {i:<I.Shield/>,title:"Garantía del producto",sub:"Todos los productos en Catalogix están garantizados. Si recibes algo diferente a lo descrito, te reembolsamos el 100%."},
                    {i:<I.Info/>,  title:"Cobertura de envío",sub:"Enviamos a todas las 29 provincias de República Dominicana, incluyendo Haití fronterizo bajo solicitud especial."},
                  ].map(x=>(
                    <div className="si-item" key={x.title}>
                      <div className="si-ico">{x.i}</div>
                      <div><div className="si-title">{x.title}</div><div className="si-sub">{x.sub}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RELACIONADOS */}
        {product.related.length > 0 && (
          <div className="related-section" style={{marginTop:48}}>
            <h2 className="related-title">Productos relacionados</h2>
            <div className="related-grid">
              {product.related.map(r=>(
                <div className="rel-card" key={r.id} onClick={()=>navigate(`/product/${r.id}`)}>
                  <div className="rel-img" style={{background:`${r.clr}18`}}>🛍️</div>
                  <div className="rel-body">
                    <div className="rel-name">{r.name}</div>
                    <div className="rel-rat">
                      <Stars r={r.rating}/>
                      <span className="rel-rn">{r.rating}</span>
                    </div>
                    <div className="rel-price">RD${r.price.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
</div>
    
      <style>{`
:root{
          --b7:#1d4ed8;--b6:#2563eb;--b5:#3b82f6;--b4:#60a5fa;--b1:#dbeafe;--b0:#eff6ff;
          --t5:#06b6d4;--s9:#0f172a;--s7:#334155;--s5:#64748b;--s4:#94a3b8;--s3:#cbd5e1;
          --s2:#e2e8f0;--s1:#f1f5f9;--s0:#f8fafc;--w:#fff;--green:#22c55e;
        }

        .back-btn:hover{border-color:var(--b4);color:var(--b6);background:var(--b0);}
        .brand{display:flex;align-items:center;gap:9px;cursor:pointer;}
        .bn{font-family:'Lexend',sans-serif;font-size:19px;font-weight:800;color:var(--s9);}
        .bn em{font-style:normal;background:linear-gradient(90deg,var(--b6),var(--t5));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .hdr-r{margin-left:auto;display:flex;align-items:center;gap:9px;}
        .hico-btn{width:38px;height:38px;border-radius:10px;border:1.5px solid var(--s2);background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--s5);transition:all .18s;}
        .hico-btn:hover{border-color:var(--b4);color:var(--b6);}
        .hico-btn.faved{color:#ef4444;border-color:#fecdd3;background:#fff1f2;}
        .cart-btn{position:relative;display:flex;align-items:center;gap:7px;background:var(--b6);color:white;border:none;border-radius:11px;padding:9px 17px;font-size:13.5px;font-weight:700;font-family:'Nunito',sans-serif;cursor:pointer;transition:all .2s;box-shadow:0 2px 12px rgba(37,99,235,.28);}
        .cart-btn:hover{background:var(--b7);transform:translateY(-1px);}
        .cbadge{position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:#ef4444;color:white;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid white;}

        /* ── BREADCRUMB ── */
        .bc{background:var(--w);border-bottom:1px solid var(--s2);padding:10px 24px;}
        .bc-in{max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--s4);font-weight:500;}
        .bc-link{cursor:pointer;transition:color .15s;}
        .bc-link:hover{color:var(--b6);}
        .bc-sep{color:var(--s3);}
        .bc-cur{color:var(--s7);font-weight:600;}

        /* ── MAIN GRID ── */
        .content{max-width:1200px;margin:0 auto;padding:36px 24px 80px;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;}
        @media(max-width:820px){.content{grid-template-columns:1fr;gap:28px;}}

        /* ── GALERÍA ── */
        .gallery{}
        .main-img{
          border-radius:22px;overflow:hidden;aspect-ratio:1;
          display:flex;align-items:center;justify-content:center;
          margin-bottom:14px;position:relative;cursor:zoom-in;
          border:1.5px solid var(--s2);box-shadow:0 4px 24px rgba(0,0,0,.06);
          animation:imgIn .4s ease;
          background-size:cover;background-position:center;
        }
        @keyframes imgIn{from{opacity:.6;transform:scale(.98)}to{opacity:1;transform:scale(1)}}
        .main-img-inner{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:96px;transition:transform .3s ease;}
        .main-img:hover .main-img-inner{transform:scale(1.04);}
        .img-badge{position:absolute;top:14px;left:14px;padding:5px 12px;border-radius:100px;background:#ef4444;color:white;font-size:11px;font-weight:800;}
        .img-dots{display:flex;gap:8px;justify-content:center;}
        .img-dot{width:40px;height:40px;border-radius:10px;cursor:pointer;border:2px solid transparent;display:flex;align-items:center;justify-content:center;font-size:20px;transition:all .18s;background-size:cover;background-position:center;}
        .img-dot.act{border-color:var(--b6);box-shadow:0 0 0 2px rgba(37,99,235,.15);}
        .img-dot:hover:not(.act){border-color:var(--s3);}

        /* ── INFO PANEL ── */
        .info{}
        .info-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;}
        .cat-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:100px;background:var(--b0);border:1px solid var(--b1);font-size:11px;font-weight:700;color:var(--b7);text-transform:uppercase;letter-spacing:.5px;}
        .share-btn{display:flex;align-items:center;gap:5px;background:none;border:1.5px solid var(--s2);border-radius:9px;padding:6px 12px;font-size:12px;font-weight:700;color:var(--s5);cursor:pointer;font-family:'Nunito',sans-serif;transition:all .18s;flex-shrink:0;}
        .share-btn:hover{border-color:var(--b4);color:var(--b6);}
        .prod-name{font-family:'Lexend',sans-serif;font-size:clamp(22px,3vw,30px);font-weight:800;color:var(--s9);letter-spacing:-.6px;line-height:1.15;margin-bottom:14px;}
        .vendor-row{display:flex;align-items:center;gap:8px;margin-bottom:16px;}
        .vendor-link{font-size:13px;font-weight:700;color:var(--b6);cursor:pointer;text-decoration:underline;text-underline-offset:3px;}
        .vdot{background:#22c55e;color:white;width:16px;height:16px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;}
        .rating-row{display:flex;align-items:center;gap:10px;margin-bottom:20px;}
        .rat-num{font-size:14px;font-weight:800;color:var(--s9);}
        .rat-rev{font-size:13px;color:var(--b6);cursor:pointer;font-weight:600;}
        .rat-rev:hover{text-decoration:underline;}
        .sold-sep{color:var(--s3);}
        .sold-txt{font-size:13px;color:var(--s5);font-weight:500;}

        /* Precio */
        .price-block{background:var(--s0);border:1px solid var(--s2);border-radius:16px;padding:18px 20px;margin-bottom:22px;}
        .price-row{display:flex;align-items:baseline;gap:12px;margin-bottom:6px;}
        .price{font-family:'Lexend',sans-serif;font-size:32px;font-weight:800;color:var(--s9);}
        .original{font-size:18px;color:var(--s4);text-decoration:line-through;font-weight:400;}
        .disc-badge{padding:4px 12px;border-radius:100px;background:#fef2f2;color:#ef4444;font-size:12px;font-weight:800;border:1px solid #fecaca;}
        .itbis{font-size:12px;color:var(--s4);font-weight:500;}
        .stock-pill{display:inline-flex;align-items:center;gap:6px;margin-top:10px;}
        .sdot{width:7px;height:7px;border-radius:50%;animation:blink 2.5s ease-in-out infinite;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
        .stxt{font-size:12.5px;font-weight:700;}

        /* Color */
        .opt-section{margin-bottom:20px;}
        .opt-lbl{font-size:11px;font-weight:700;color:var(--s4);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;display:flex;align-items:center;gap:7px;}
        .opt-lbl span{color:var(--s9);font-size:13px;font-weight:700;text-transform:none;letter-spacing:0;}
        .colors-row{display:flex;gap:9px;flex-wrap:wrap;}
        .color-swatch{width:36px;height:36px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:all .18s;position:relative;}
        .color-swatch.act{border-color:var(--s9);box-shadow:0 0 0 3px rgba(15,23,42,.15);}
        .color-swatch:hover:not(.act){transform:scale(1.1);}

        /* Size */
        .sizes-row{display:flex;gap:8px;flex-wrap:wrap;}
        .size-btn{min-width:48px;height:44px;border-radius:11px;border:1.5px solid var(--s2);background:none;font-size:13.5px;font-weight:700;color:var(--s7);cursor:pointer;font-family:'Nunito',sans-serif;transition:all .18s;padding:0 12px;}
        .size-btn:hover:not(.act){border-color:var(--s3);background:var(--s1);}
        .size-btn.act{border-color:var(--s9);background:var(--s9);color:white;}
        .size-btn.err{border-color:#ef4444;color:#ef4444;}
        .size-err{font-size:12px;color:#ef4444;font-weight:600;margin-top:7px;display:flex;align-items:center;gap:5px;}

        /* Qty + CTA */
        .cta-row{display:flex;gap:10px;margin-bottom:16px;align-items:center;}
        .qty-ctrl{display:flex;align-items:center;border:1.5px solid var(--s2);border-radius:12px;overflow:hidden;flex-shrink:0;}
        .qty-btn{width:38px;height:46px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:var(--s5);transition:all .15s;}
        .qty-btn:hover{background:var(--s1);color:var(--b6);}
        .qty-btn:disabled{color:var(--s3);cursor:not-allowed;}
        .qty-num{min-width:36px;text-align:center;font-size:15px;font-weight:800;color:var(--s9);}
        .add-btn{flex:1;height:50px;border-radius:13px;border:none;background:linear-gradient(135deg,var(--b7),var(--b6),#0284c7);color:white;font-size:15px;font-weight:800;font-family:'Nunito',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .25s;box-shadow:0 4px 16px rgba(37,99,235,.3);}
        .add-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(37,99,235,.4);}
        .add-btn.ok{background:linear-gradient(135deg,#16a34a,#22c55e);box-shadow:0 4px 16px rgba(34,197,94,.3);}
        .fav-btn-big{height:50px;width:50px;border-radius:13px;border:1.5px solid var(--s2);background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--s4);transition:all .2s;flex-shrink:0;}
        .fav-btn-big.ok{color:#ef4444;border-color:#fecdd3;background:#fff1f2;}
        .fav-btn-big:hover{transform:scale(1.05);}

        /* Trust */
        .trust-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:22px;}
        .trust-item{display:flex;align-items:center;gap:8px;padding:10px 13px;background:var(--s0);border:1px solid var(--s2);border-radius:11px;}
        .trust-ico{width:28px;height:28px;border-radius:8px;background:var(--b0);display:flex;align-items:center;justify-content:center;color:var(--b6);flex-shrink:0;}
        .trust-txt{font-size:12px;font-weight:600;color:var(--s7);line-height:1.3;}

        /* Catalog card */
        .cat-card{background:linear-gradient(135deg,#0a1628,#0f2044);border-radius:16px;padding:18px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:all .22s;margin-bottom:0;}
        .cat-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.2);}
        .cat-ava{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,var(--b7),var(--t5));display:flex;align-items:center;justify-content:center;font-family:'Lexend',sans-serif;font-size:16px;font-weight:800;color:white;flex-shrink:0;}
        .cat-info{flex:1;min-width:0;}
        .cat-name{font-family:'Lexend',sans-serif;font-size:14px;font-weight:800;color:white;margin-bottom:2px;}
        .cat-sub{font-size:12px;color:rgba(255,255,255,.4);}
        .cat-arrow{color:rgba(255,255,255,.3);transition:all .2s;}
        .cat-card:hover .cat-arrow{color:rgba(255,255,255,.7);transform:translateX(3px);}

        /* ── TABS ── */
        .tabs-wrap{margin-top:48px;}
        .tab-bar{display:flex;gap:0;border-bottom:2px solid var(--s2);margin-bottom:28px;overflow-x:auto;}
        .tab-btn{padding:12px 20px;font-size:13.5px;font-weight:700;color:var(--s4);background:none;border:none;cursor:pointer;font-family:'Nunito',sans-serif;white-space:nowrap;transition:color .18s;position:relative;}
        .tab-btn::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;background:var(--b6);transform:scaleX(0);transition:transform .22s;}
        .tab-btn.act{color:var(--s9);}
        .tab-btn.act::after{transform:scaleX(1);}
        .tab-btn:hover:not(.act){color:var(--s7);}

        /* Tab: Descripción */
        .tab-desc p{font-size:14.5px;color:var(--s7);line-height:1.8;font-weight:400;}

        /* Tab: Características */
        .feat-list{display:flex;flex-direction:column;gap:10px;}
        .feat-item{display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--s0);border:1px solid var(--s2);border-radius:12px;}
        .feat-ico{width:28px;height:28px;border-radius:8px;background:var(--b0);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--b6);}
        .feat-txt{font-size:13.5px;font-weight:600;color:var(--s7);}
        .sku-row{margin-top:18px;display:flex;align-items:center;gap:8px;padding:12px 16px;background:var(--s0);border:1px solid var(--s2);border-radius:12px;}
        .sku-lbl{font-size:11px;font-weight:700;color:var(--s4);text-transform:uppercase;letter-spacing:.6px;}
        .sku-val{font-size:13px;font-weight:700;color:var(--s9);font-family:'Lexend',sans-serif;}

        /* Tab: Reseñas */
        .reviews-top{display:grid;grid-template-columns:auto 1fr;gap:28px;align-items:center;margin-bottom:28px;padding:24px;background:var(--s0);border:1px solid var(--s2);border-radius:16px;}
        @media(max-width:600px){.reviews-top{grid-template-columns:1fr;gap:14px;}}
        .rat-big{text-align:center;}
        .rat-big-num{font-family:'Lexend',sans-serif;font-size:56px;font-weight:800;color:var(--s9);line-height:1;}
        .rat-big-lbl{font-size:12px;color:var(--s4);margin-top:4px;}
        .rat-bars{display:flex;flex-direction:column;gap:7px;}
        .rat-bar-row{display:flex;align-items:center;gap:9px;}
        .rat-bar-lbl{font-size:12px;font-weight:700;color:var(--s5);width:14px;text-align:right;}
        .rat-bar-track{flex:1;height:7px;background:var(--s2);border-radius:100px;overflow:hidden;}
        .rat-bar-fill{height:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:100px;}
        .rat-bar-cnt{font-size:11.5px;color:var(--s4);font-weight:500;width:20px;}

        .review-card{padding:20px;background:var(--w);border:1px solid var(--s2);border-radius:14px;margin-bottom:12px;}
        .review-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;}
        .review-user{display:flex;align-items:center;gap:10px;}
        .review-ava{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--b6),var(--t5));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:white;flex-shrink:0;}
        .review-name{font-size:13.5px;font-weight:700;color:var(--s9);}
        .review-date{font-size:11.5px;color:var(--s4);margin-top:1px;}
        .review-txt{font-size:13.5px;color:var(--s7);line-height:1.65;margin-bottom:12px;}
        .review-helpful{font-size:12px;color:var(--s4);font-weight:500;}
        .review-helpful span{font-weight:700;color:var(--s6);}
        .review-form{margin-top:16px;padding:18px;background:var(--s0);border:1px solid var(--s2);border-radius:14px;}
        .review-form-title{font-size:14px;font-weight:800;color:var(--s9);margin-bottom:10px;}
        .review-form-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;font-size:12.5px;color:var(--s5);}
        .review-stars{display:flex;gap:6px;}
        .review-star{border:none;background:transparent;padding:0;cursor:pointer;color:#e2e8f0;}
        .review-star.on{color:#f59e0b;}
        .review-input,.review-textarea{width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid var(--s2);background:#fff;font-size:13px;margin-bottom:10px;font-family:'Nunito',sans-serif;color:var(--s7);}
        .review-textarea{resize:none;}
        .review-submit{padding:10px 14px;border-radius:10px;border:none;background:linear-gradient(135deg,var(--b6),var(--t5));color:white;font-weight:800;font-size:13px;cursor:pointer;}
        .review-submit:disabled{opacity:.7;cursor:not-allowed;}
        .review-error{color:#dc2626;font-size:12px;font-weight:700;margin-bottom:10px;}

        /* Tab: Envío */
        .shipping-info{display:flex;flex-direction:column;gap:12px;}
        .si-item{display:flex;gap:14px;padding:16px;background:var(--s0);border:1px solid var(--s2);border-radius:14px;}
        .si-ico{width:36px;height:36px;border-radius:10px;background:var(--b0);display:flex;align-items:center;justify-content:center;color:var(--b6);flex-shrink:0;}
        .si-title{font-size:14px;font-weight:700;color:var(--s9);margin-bottom:4px;}
        .si-sub{font-size:13px;color:var(--s5);line-height:1.5;}

        /* Relacionados */
        .related-section{max-width:1200px;margin:0 auto;padding:0 24px 80px;}
        .related-title{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--s9);margin-bottom:20px;}
        .related-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
        @media(max-width:640px){.related-grid{grid-template-columns:1fr 1fr;}}
        .rel-card{background:var(--w);border-radius:14px;border:1px solid var(--s2);overflow:hidden;cursor:pointer;transition:all .22s;box-shadow:0 1px 4px rgba(0,0,0,.04);}
        .rel-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.09);}
        .rel-img{height:130px;display:flex;align-items:center;justify-content:center;font-size:36px;}
        .rel-body{padding:12px 14px;}
        .rel-name{font-family:'Lexend',sans-serif;font-size:13px;font-weight:700;color:var(--s9);margin-bottom:4px;line-height:1.2;}
        .rel-price{font-size:15px;font-weight:800;color:var(--s9);}
        .rel-rat{display:flex;align-items:center;gap:3px;margin-top:4px;}
        .rel-rn{font-size:11.5px;font-weight:700;color:var(--s7);margin-left:3px;}

@keyframes ci{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

      `}</style>
</>
  );
}
