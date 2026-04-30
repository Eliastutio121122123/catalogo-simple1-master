import { useContext, useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { storeService } from "../../services/odoo/storeService";

// ─── Iconos ───────────────────────────────────────────────────────────────────
const IcoSearch  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoX       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoFilter  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const IcoGrid    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const IcoList    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IcoStar    = ({ f }) => <svg width="12" height="12" viewBox="0 0 24 24" fill={f?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoCart    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IcoHeart   = ({ f }) => <svg width="14" height="14" viewBox="0 0 24 24" fill={f?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IcoArrow   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const IcoTrend   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IcoPlus    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoCheck   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoEmpty   = () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

class ProductAdapter {
  constructor() {
    this.colors = {
      Moda: "#f43f5e",
      "Electronica": "#3b82f6",
      "ElectrÃ³nica": "#3b82f6",
      "Electrónica": "#3b82f6",
      Hogar: "#f59e0b",
      Deportes: "#10b981",
      Belleza: "#ec4899",
      Alimentos: "#92400e",
      Servicios: "#0ea5e9",
      Otros: "#64748b",
    };
  }

  toItems(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => this.toItem(row));
  }

  toItem(row) {
    const catName = this._nameFromPair(row?.categ_id) || "General";
    const catalogName = this._nameFromPair(row?.catalog_id) || "";
    const price = Number(row?.list_price || 0);
    const qty = this._stockQty(row);
    const tag = qty <= 0 ? "Agotado" : null;
    return {
      id: row?.id,
      name: row?.name || "Producto",
      catalog: catalogName,
      cat: catName,
      price,
      original: row?.original_price ? Number(row.original_price) : null,
      rating: Number(row?.rating || 0),
      reviews: Number(row?.reviews || 0),
      clr: this.colors[catName] || "#0ea5e9",
      tag,
      vendor: catalogName || "Catalogo",
      ver: row?.active !== false,
      imageUrl: row?.image_url || (Array.isArray(row?.image_urls) ? row.image_urls[0] : null) || "",
    };
  }

  _nameFromPair(pair) {
    if (Array.isArray(pair) && pair.length > 1) return pair[1];
    return "";
  }

  _stockQty(row) {
    if (row?.catalog_stock_qty != null) return Number(row.catalog_stock_qty || 0);
    if (row?.qty_available != null) return Number(row.qty_available || 0);
    return 0;
  }
}

const productAdapter = new ProductAdapter();


// ─── Datos ────────────────────────────────────────────────────────────────────
const SORTS = [{ v:"rel",label:"Más relevantes"},{v:"pop",label:"Más populares"},{v:"pasc",label:"Menor precio"},{v:"pdesc",label:"Mayor precio"},{v:"rat",label:"Mejor valorados"}];
const PRANGES = [
  {id:"all",label:"Todos",min:0,max:Infinity},
  {id:"r1",label:"Hasta RD$2,000",min:0,max:2000},
  {id:"r2",label:"RD$2,000 – 10,000",min:2000,max:10000},
  {id:"r3",label:"RD$10,000 – 50,000",min:10000,max:50000},
  {id:"r4",label:"Más de RD$50,000",min:50000,max:Infinity},
];
const TRENDS = ["iPhone","vestido","tenis","café","yoga","smart TV","sérum"];
const TAG_COLOR = { "Oferta":"#ef4444","Nuevo":"#06b6d4","Top Rated":"#7c3aed","Premium":"#7c3aed","Eco":"#22c55e" };
const CAT_PARAM_MAP = {
  tech: "Tecnología",
  tecnologia: "Tecnología",
  technology: "Tecnología",
  electronics: "Electrónica",
  electronica: "Electrónica",
  electronic: "Electrónica",
  fashion: "Moda",
  moda: "Moda",
  home: "Hogar",
  hogar: "Hogar",
  food: "Alimentos",
  alimentos: "Alimentos",
  beauty: "Belleza",
  belleza: "Belleza",
  sports: "Deportes",
  deportes: "Deportes",
  toys: "Juguetes",
  juguetes: "Juguetes",
  edu: "Educación",
  educacion: "Educación",
  education: "Educación",
  services: "Servicios",
  service: "Servicios",
  servicios: "Servicios",
  servicio: "Servicios",
  other: "Otros",
  otros: "Otros",
  misc: "Otros",
};

const normalizeText = (value) =>
  String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const resolveCategoryParam = (param, categories = []) => {
  const norm = normalizeText(param);
  if (!norm) return null;
  if (norm === "todos" || norm === "all") return "Todos";
  const mapped = CAT_PARAM_MAP[norm];
  if (mapped && categories.includes(mapped)) return mapped;
  const exact = categories.find(c => normalizeText(c) === norm);
  if (exact) return exact;
  const guess = categories.find((c) => {
    const cn = normalizeText(c);
    if (["tech","tecnologia","technology"].includes(norm)) return cn.includes("electron") || cn.includes("tecnolog") || cn.includes("tech");
    if (["electronics","electronica","electronic"].includes(norm)) return cn.includes("electron") || cn.includes("tecnolog") || cn.includes("tech");
    if (["fashion","moda"].includes(norm)) return cn.includes("moda") || cn.includes("fashion");
    if (["home","hogar"].includes(norm)) return cn.includes("hogar") || cn.includes("casa") || cn.includes("home");
    if (["food","alimentos"].includes(norm)) return cn.includes("alimento") || cn.includes("comida") || cn.includes("food");
    if (["beauty","belleza"].includes(norm)) return cn.includes("belleza") || cn.includes("beauty") || cn.includes("cosmet");
    if (["sports","deportes"].includes(norm)) return cn.includes("deport") || cn.includes("sport");
    if (["toys","juguetes"].includes(norm)) return cn.includes("juguet") || cn.includes("toy");
    if (["edu","education","educacion"].includes(norm)) return cn.includes("educ") || cn.includes("school");
    if (["services","service","servicios","servicio"].includes(norm)) return cn.includes("servic");
    if (["other","otros","misc"].includes(norm)) return cn.includes("otro") || cn.includes("misc") || cn.includes("vario");
    return false;
  });
  return guess || mapped || null;
};

// ─── ProductCard ──────────────────────────────────────────────────────────────
function PCard({ p, view, idx, onAdd, goto }) {
  const [added, setAdded] = useState(false);
  const [faved, setFaved] = useState(false);
  const [hov,   setHov  ] = useState(false);
  const disc = p.original ? Math.round((1-p.price/p.original)*100) : null;

  const doAdd = e => { e.stopPropagation(); onAdd(p); setAdded(true); setTimeout(()=>setAdded(false),2000); };
  const doFav = e => { e.stopPropagation(); setFaved(v=>!v); };

  const Stars = () => <div className="stars">{[1,2,3,4,5].map(i=><span key={i} style={{color:i<=Math.floor(p.rating)?"#f59e0b":"#e2e8f0"}}><IcoStar f={i<=Math.floor(p.rating)}/></span>)}</div>;

  if (view === "list") return (
    <div className="lcard" style={{animationDelay:`${idx*45}ms`}} onClick={()=>goto(p.id)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div className="lcard-thumb" style={{background:`${p.clr}20`,border:`1.5px solid ${p.clr}30`}}>
        {p.imageUrl
          ? <img className="pimg" src={p.imageUrl} alt={p.name} loading="lazy" />
          : <span className="pimg-fallback">IMG</span>}
        {p.tag && <div className="ltag" style={{background:TAG_COLOR[p.tag]||"#64748b"}}>{p.tag}</div>}
      </div>
      <div className="lcard-info">
        <div className="lcat" style={{color:p.clr}}>{p.cat}</div>
        <h4 className="lname">{p.name}</h4>
        <div className="lvendor">{p.vendor}{p.ver&&<span className="vdot">✓</span>}</div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><Stars/><span className="rnum">{p.rating}</span><span className="rrev">({p.reviews})</span></div>
      </div>
      <div className="lcard-right">
        <div className="lprice-wrap">
          {disc && <div className="ldiscbadge">-{disc}%</div>}
          <div className="lprice">RD${p.price.toLocaleString()}</div>
          {p.original && <div className="loriginal">RD${p.original.toLocaleString()}</div>}
        </div>
        <button className={`ladd${added?" ok":""}`} onClick={doAdd}>{added?<><IcoCheck/>Listo</>:<><IcoCart/>Agregar</>}</button>
      </div>
      <div className="larrow" style={{color:hov?"var(--b6)":"var(--s3)",transform:hov?"translateX(3px)":"none"}}><IcoArrow/></div>
    </div>
  );

  return (
    <div className="gcard" style={{animationDelay:`${idx*55}ms`}} onClick={()=>goto(p.id)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div className="gcard-img" style={{background:`${p.clr}18`}}>
        {p.imageUrl
          ? <img className="pimg" src={p.imageUrl} alt={p.name} loading="lazy" />
          : <span className="pimg-fallback">IMG</span>}
        <button className={`fav${faved?" ok":""}`} onClick={doFav}><IcoHeart f={faved}/></button>
        {p.tag && <div className="gtag" style={{background:TAG_COLOR[p.tag]||"#64748b"}}>{p.tag}</div>}
        {disc   && <div className="gdisc">-{disc}%</div>}
        <div className="goverlay" style={{opacity:hov?.1:0}}/>
      </div>
      <div className="gcard-body">
        <div className="gcat" style={{color:p.clr}}>{p.cat}</div>
        <h4 className="gname">{p.name}</h4>
        <div className="gvendor">{p.vendor}{p.ver&&<span className="vdot">✓</span>}</div>
        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:10}}><Stars/><span className="rnum">{p.rating}</span><span className="rrev">({p.reviews})</span></div>
        <div className="gprice-row">
          <span className="gprice">RD${p.price.toLocaleString()}</span>
          {p.original && <span className="goriginal">RD${p.original.toLocaleString()}</span>}
        </div>
      </div>
      <div className="gcta" style={{opacity:hov?1:0,transform:hov?"translateY(0)":"translateY(5px)"}}>
        <button className={`gadd${added?" ok":""}`} onClick={doAdd}>{added?<><IcoCheck/>Agregado</>:<><IcoPlus/>Agregar al carrito</>}</button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Search() {
  const { cartCount = 0, addToCart } = useContext(CartContext) || {};
  const navigate        = useNavigate();
  const [sp, setSp]     = useSearchParams();
  const inputRef        = useRef(null);

  const [q,          setQ         ] = useState(sp.get("q") || "");
  const [cat,        setCat       ] = useState("Todos");
  const [catParam,   setCatParam  ] = useState(sp.get("cat") || sp.get("category") || "");
  const [pr,         setPr        ] = useState("all");
  const [sort,       setSort      ] = useState("rel");
  const [view,       setView      ] = useState("grid");
  const [minR,       setMinR      ] = useState(0);
  const [offers,     setOffers    ] = useState(false);
  const [verif,      setVerif     ] = useState(false);
  const [products,   setProducts  ] = useState([]);
  const [loading,    setLoading   ] = useState(true);
  const [error,      setError     ] = useState("");
  const [focused,    setFocused   ] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await storeService.listProducts({ limit: 200 });
        if (cancelled) return;
        setProducts(productAdapter.toItems(rows));
      } catch (err) {
        if (!cancelled) setError(err?.message || "No se pudieron cargar productos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setQ(sp.get("q") || "");
    setCatParam(sp.get("cat") || sp.get("category") || "");
  }, [sp]);

  const range = PRANGES.find(r=>r.id===pr)||PRANGES[0];
  const categories = useMemo(() => {
    const set = new Set((products || []).map(p => p.cat).filter(Boolean));
    return ["Todos", ...Array.from(set).sort()];
  }, [products]);

  useEffect(() => {
    if (!catParam) {
      if (cat !== "Todos") setCat("Todos");
      return;
    }
    const resolved = resolveCategoryParam(catParam, categories);
    if (resolved && resolved !== cat) setCat(resolved);
  }, [catParam, categories, cat]);

  const filtered = products.filter(p=>{
    if(q && !p.name.toLowerCase().includes(q.toLowerCase()) &&
       !p.catalog.toLowerCase().includes(q.toLowerCase()) &&
       !p.vendor.toLowerCase().includes(q.toLowerCase())) return false;
    if(cat!=="Todos" && p.cat!==cat) return false;
    if(p.price<range.min||p.price>range.max) return false;
    if(minR>0 && p.rating<minR) return false;
    if(offers && !p.original) return false;
    if(verif  && !p.ver)      return false;
    return true;
  });
  const sorted = [...filtered].sort((a,b)=>{
    if(sort==="pasc")  return a.price-b.price;
    if(sort==="pdesc") return b.price-a.price;
    if(sort==="rat")   return b.rating-a.rating;
    if(sort==="pop")   return b.reviews-a.reviews;
    return 0;
  });

  const activeChips = [
    cat!=="Todos" && cat,
    pr!=="all"    && PRANGES.find(r=>r.id===pr)?.label,
    minR>0        && `${minR}+ ★`,
    offers        && "Solo ofertas",
    verif         && "Verificados",
  ].filter(Boolean);

  const updateSearchParams = (nextQ, nextCat) => {
    const params = {};
    const qVal = String(nextQ ?? q).trim();
    if (qVal) params.q = qVal;
    const catVal = nextCat ?? cat;
    if (catVal && catVal !== "Todos") params.cat = catVal;
    const current = Object.fromEntries(sp.entries());
    const same = Object.keys(params).length === Object.keys(current).length
      && Object.keys(params).every(k => current[k] === params[k]);
    if (!same) setSp(params);
  };

  const handleQ = v => { setQ(v); updateSearchParams(v, cat); };
  const clearChip = f => {
    let nextCat = cat;
    if(f===cat) { nextCat = "Todos"; setCat("Todos"); }
    if(f===PRANGES.find(r=>r.id===pr)?.label) setPr("all");
    if(f.includes("★")) setMinR(0);
    if(f==="Solo ofertas") setOffers(false);
    if(f==="Verificados")  setVerif(false);
    updateSearchParams(q, nextCat);
  };

  return (
    <>
<div>

        {/* TRENDS */}
        {!q && (
          <div className="trends">
            <div className="trends-in">
              <span className="tlbl"><IcoTrend/>Tendencias:</span>
              {TRENDS.map(t=><button key={t} className="tpill" onClick={()=>handleQ(t)}>{t}</button>)}
            </div>
          </div>
        )}

        {/* LAYOUT */}
        <div className="layout">
          {/* SIDEBAR */}
          <aside className="sb">
            <div className="sb-head">
              <span className="sb-title"><IcoFilter/>Filtros</span>
              {activeChips.length>0 && <button className="sb-clr" onClick={()=>{setCat("Todos");setPr("all");setMinR(0);setOffers(false);setVerif(false);updateSearchParams(q,"Todos");}}>Limpiar</button>}
            </div>
            {/* Categoría */}
            <div className="fsec">
              <div className="fsec-lbl">Categoría</div>
              <div className="clist">
                {categories.map(c=>{
                  const cnt = products.filter(p=>c==="Todos"||p.cat===c).length;
                  return (
                    <button key={c} className={`cbtn-f${cat===c?" act":""}`} onClick={()=>{setCat(c);updateSearchParams(q,c);}}>
                      {c}<span className="ccount">{cnt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Precio */}
            <div className="fsec">
              <div className="fsec-lbl">Precio</div>
              <div className="plist">
                {PRANGES.map(r=>(
                  <div key={r.id} className={`popt${pr===r.id?" act":""}`} onClick={()=>setPr(r.id)}>
                    <div className="pradio">{pr===r.id&&<div className="prdot"/>}</div>
                    <span className="plbl">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Rating */}
            <div className="fsec">
              <div className="fsec-lbl">Valoración mínima</div>
              <div className="rlist">
                {[{v:0,l:"Todas"},{v:3,l:"3+"},{v:4,l:"4+"},{v:4.5,l:"4.5+"}].map(r=>(
                  <div key={r.v} className={`ropt${minR===r.v?" act":""}`} onClick={()=>setMinR(r.v)}>
                    <div className="stars">{[1,2,3,4,5].map(i=><span key={i} style={{color:i<=r.v?"#f59e0b":"#e2e8f0"}}><IcoStar f={i<=r.v}/></span>)}</div>
                    <span className="rlbl">{r.l}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Toggles */}
            <div className="fsec">
              <div className="fsec-lbl">Otros filtros</div>
              <div className="trow" onClick={()=>setOffers(v=>!v)}>
                <span className="tlabel">Solo con descuento</span>
                <button className={`tgl${offers?" on":" off"}`} onClick={e=>{e.stopPropagation();setOffers(v=>!v)}}><div className="tknob"/></button>
              </div>
              <div className="trow" onClick={()=>setVerif(v=>!v)}>
                <span className="tlabel">Vendedor verificado</span>
                <button className={`tgl${verif?" on":" off"}`} onClick={e=>{e.stopPropagation();setVerif(v=>!v)}}><div className="tknob"/></button>
              </div>
            </div>
          </aside>

          {/* RESULTS */}
          <div>
            <div className="rbar">
              <p className="rcnt">
                <strong>{sorted.length}</strong> resultado{sorted.length!==1?"s":""}
                {q&&<> para <span className="rq">"{q}"</span></>}
              </p>
              <select className="srt" value={sort} onChange={e=>setSort(e.target.value)}>
                {SORTS.map(o=><option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
              <div className="vbtns">
                <button className={`vbtn${view==="grid"?" act":""}`} onClick={()=>setView("grid")}><IcoGrid/></button>
                <button className={`vbtn${view==="list"?" act":""}`} onClick={()=>setView("list")}><IcoList/></button>
              </div>
            </div>

            {error && (
              <div className="err">
                {error}
                <button className="errbtn" onClick={() => window.location.reload()}>Reintentar</button>
              </div>
            )}

            {activeChips.length>0 && (
              <div className="chips">
                {activeChips.map(f=>(
                  <div key={f} className="chip">{f}<button className="chipx" onClick={()=>clearChip(f)}><IcoX/></button></div>
                ))}
              </div>
            )}

            {loading ? (
              <div className={view==="grid"?"ggrid":"llist"}>
                {[...Array(view==="grid"?8:5)].map((_,i)=>(
                  <div key={i} className="scard" style={view==="list"?{display:"flex",gap:12,padding:13,borderRadius:14,border:"1px solid #e2e8f0"}:{}}>
                    {view==="grid"
                      ? <><div className="skl" style={{height:165}}/><div style={{padding:"13px 14px",display:"flex",flexDirection:"column",gap:8}}><div className="skl" style={{height:10,width:"40%"}}/><div className="skl" style={{height:15,width:"75%"}}/><div className="skl" style={{height:10,width:"50%"}}/></div></>
                      : <><div className="skl" style={{width:70,height:70,borderRadius:11,flexShrink:0}}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}><div className="skl" style={{height:10,width:"30%"}}/><div className="skl" style={{height:14,width:"65%"}}/><div className="skl" style={{height:10,width:"40%"}}/></div></>
                    }
                  </div>
                ))}
              </div>
            ) : sorted.length===0 ? (
              <div className="empty">
                <div className="ei"><IcoEmpty/></div>
                <h3 className="et">Sin resultados</h3>
                <p className="es">No encontramos productos con esos criterios. Prueba otra búsqueda o ajusta los filtros.</p>
                <button className="ebtn" onClick={()=>{handleQ("");setCat("Todos");setPr("all");setMinR(0);setOffers(false);setVerif(false);updateSearchParams("", "Todos");}}>Limpiar todo</button>
              </div>
            ) : view==="grid" ? (
              <div className="ggrid">
                {sorted.map((p,i)=><PCard key={p.id} p={p} view="grid" idx={i} onAdd={p=>{addToCart&&addToCart(p);}} goto={id=>navigate(`/product/${id}`)}/>)}
              </div>
            ) : (
              <div className="llist">
                {sorted.map((p,i)=><PCard key={p.id} p={p} view="list" idx={i} onAdd={p=>{addToCart&&addToCart(p);}} goto={id=>navigate(`/product/${id}`)}/>)}
              </div>
            )}
          </div>
        </div>
      </div>
    
      <style>{`
:root{
          --b7:#1d4ed8;--b6:#2563eb;--b5:#3b82f6;--b4:#60a5fa;--b1:#dbeafe;--b0:#eff6ff;
          --t5:#06b6d4;--s9:#0f172a;--s7:#334155;--s5:#64748b;--s4:#94a3b8;--s3:#cbd5e1;
          --s2:#e2e8f0;--s1:#f1f5f9;--s0:#f8fafc;--w:#fff;--green:#22c55e;
        }

        /* Header */
        .sbclear:hover{background:var(--s5);}

        /* Tendencias */
        .trends{background:var(--w);border-bottom:1px solid var(--s2);padding:10px 24px;}
        .trends-in{max-width:1300px;margin:0 auto;display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
        .tlbl{font-size:11px;font-weight:700;color:var(--s4);display:flex;align-items:center;gap:5px;flex-shrink:0;}
        .tpill{padding:5px 13px;background:var(--s0);border:1.5px solid var(--s2);border-radius:100px;font-size:12px;font-weight:700;color:var(--s6);cursor:pointer;transition:all .18s;white-space:nowrap;}
        .tpill:hover{border-color:var(--b4);color:var(--b6);background:var(--b0);}

        /* Layout */
        .layout{max-width:1300px;margin:0 auto;padding:28px 24px 80px;display:grid;grid-template-columns:255px 1fr;gap:22px;align-items:start;}
        @media(max-width:880px){.layout{grid-template-columns:1fr;}}

        /* Sidebar */
        .sb{background:var(--w);border-radius:18px;border:1px solid var(--s2);overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04);position:sticky;top:88px;}
        .sb-head{padding:16px 18px;border-bottom:1px solid var(--s1);display:flex;align-items:center;justify-content:space-between;}
        .sb-title{font-family:'Lexend',sans-serif;font-size:14px;font-weight:800;color:var(--s9);display:flex;align-items:center;gap:7px;}
        .sb-clr{font-size:12px;font-weight:700;color:var(--b6);background:none;border:none;cursor:pointer;font-family:'Nunito',sans-serif;padding:4px 8px;border-radius:7px;transition:all .15s;}
        .sb-clr:hover{background:var(--b0);}
        .fsec{padding:14px 18px;border-bottom:1px solid var(--s1);}
        .fsec:last-child{border-bottom:none;}
        .fsec-lbl{font-size:10.5px;font-weight:700;color:var(--s4);text-transform:uppercase;letter-spacing:.8px;margin-bottom:11px;}

        /* Cat pills */
        .clist{display:flex;flex-direction:column;gap:3px;}
        .cbtn-f{display:flex;align-items:center;justify-content:space-between;padding:8px 11px;border-radius:9px;border:none;background:none;font-size:13px;font-weight:600;color:var(--s7);cursor:pointer;font-family:'Nunito',sans-serif;transition:all .15s;width:100%;text-align:left;}
        .cbtn-f:hover{background:var(--s1);}
        .cbtn-f.act{background:var(--b0);color:var(--b6);}
        .ccount{font-size:11px;font-weight:700;color:var(--s4);background:var(--s1);padding:1px 7px;border-radius:100px;}
        .cbtn-f.act .ccount{background:var(--b1);color:var(--b6);}

        /* Price radio */
        .plist{display:flex;flex-direction:column;gap:3px;}
        .popt{display:flex;align-items:center;gap:9px;padding:7px 9px;border-radius:9px;cursor:pointer;transition:all .15s;}
        .popt:hover{background:var(--s1);}
        .pradio{width:16px;height:16px;border-radius:50%;border:2px solid var(--s3);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;}
        .popt.act .pradio{border-color:var(--b6);background:var(--b6);}
        .prdot{width:6px;height:6px;border-radius:50%;background:white;}
        .plbl{font-size:12.5px;font-weight:600;color:var(--s7);}

        /* Rating */
        .rlist{display:flex;flex-direction:column;gap:3px;}
        .ropt{display:flex;align-items:center;gap:7px;padding:7px 9px;border-radius:9px;cursor:pointer;transition:all .15s;}
        .ropt:hover{background:var(--s1);}
        .ropt.act{background:var(--b0);}
        .rlbl{font-size:12.5px;font-weight:600;color:var(--s7);margin-left:4px;}

        /* Toggle */
        .trow{display:flex;align-items:center;justify-content:space-between;padding:8px 9px;border-radius:9px;cursor:pointer;transition:all .15s;margin-bottom:3px;}
        .trow:hover{background:var(--s1);}
        .tlabel{font-size:13px;font-weight:600;color:var(--s7);}
        .tgl{width:36px;height:21px;border-radius:100px;border:none;cursor:pointer;transition:background .2s;position:relative;flex-shrink:0;}
        .tgl.on{background:var(--b6);}
        .tgl.off{background:var(--s3);}
        .tknob{position:absolute;top:3px;width:15px;height:15px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,.2);transition:left .2s;}
        .tgl.on .tknob{left:18px;}
        .tgl.off .tknob{left:3px;}

        /* Results */
        .rbar{display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
        .rcnt{font-size:14px;color:var(--s5);font-weight:500;flex:1;}
        .rcnt strong{color:var(--s9);font-weight:800;}
        .rq{font-style:italic;color:var(--b6);}
        .srt{padding:8px 13px;border-radius:10px;border:1.5px solid var(--s2);background:var(--s0);font-size:13px;font-weight:600;color:var(--s7);font-family:'Nunito',sans-serif;outline:none;cursor:pointer;transition:all .18s;}
        .srt:focus{border-color:var(--b5);}
        .vbtns{display:flex;gap:4px;}
        .vbtn{width:33px;height:33px;border-radius:9px;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--s2);background:var(--s0);color:var(--s5);cursor:pointer;transition:all .18s;}
        .vbtn.act{background:var(--b6);border-color:var(--b6);color:white;}
        .vbtn:hover:not(.act){border-color:var(--b4);color:var(--b6);}

        /* Chips */
        .chips{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px;}
        .chip{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:100px;background:var(--b0);border:1px solid var(--b1);font-size:12px;font-weight:700;color:var(--b7);}
        .chipx{background:none;border:none;cursor:pointer;color:var(--b5);padding:0;display:flex;}

        /* Grid cards */
        .ggrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(225px,1fr));gap:16px;}
        @media(max-width:600px){.ggrid{grid-template-columns:1fr 1fr;gap:10px;}}
        .gcard{background:var(--w);border-radius:16px;border:1px solid var(--s2);overflow:hidden;cursor:pointer;transition:all .22s;animation:ci .38s ease both;box-shadow:0 1px 4px rgba(0,0,0,.04);}
        @keyframes ci{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .gcard:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(0,0,0,.1);border-color:var(--s3);}
        .gcard-img{height:165px;display:flex;align-items:center;justify-content:center;position:relative;}
        .pimg{width:100%;height:100%;object-fit:contain;display:block;padding:12px;}
        .lcard-thumb .pimg{padding:8px;}
        .pimg-fallback{font-size:11px;font-weight:800;color:var(--s4);background:rgba(255,255,255,.85);border:1px dashed var(--s3);padding:6px 10px;border-radius:10px;}
        .goverlay{position:absolute;inset:0;background:rgba(0,0,0,.05);transition:opacity .22s;}
        .fav{position:absolute;top:9px;right:9px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.9);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--s4);transition:all .2s;box-shadow:0 1px 6px rgba(0,0,0,.12);}
        .fav.ok{color:#ef4444;}
        .fav:hover{transform:scale(1.12);}
        .gtag{position:absolute;top:9px;left:9px;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:800;color:white;text-transform:uppercase;letter-spacing:.4px;}
        .gdisc{position:absolute;bottom:9px;left:9px;padding:3px 9px;border-radius:100px;background:#fef3c7;color:#92400e;font-size:10px;font-weight:800;}
        .gcard-body{padding:13px 14px 8px;}
        .gcat{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px;}
        .gname{font-family:'Lexend',sans-serif;font-size:13.5px;font-weight:700;color:var(--s9);margin-bottom:5px;line-height:1.2;}
        .gvendor{font-size:11.5px;color:var(--s4);margin-bottom:8px;display:flex;align-items:center;gap:4px;}
        .gprice-row{display:flex;align-items:baseline;gap:7px;}
        .gprice{font-family:'Lexend',sans-serif;font-size:16px;font-weight:800;color:var(--s9);}
        .goriginal{font-size:12px;color:var(--s4);text-decoration:line-through;}
        .gcta{padding:0 11px 11px;transition:all .2s;}
        .gadd{width:100%;padding:9px;border-radius:10px;border:none;background:var(--b6);color:white;font-size:13px;font-weight:700;font-family:'Nunito',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .2s;}
        .gadd:hover{background:var(--b7);}
        .gadd.ok{background:var(--green);}

        /* List cards */
        .llist{display:flex;flex-direction:column;gap:10px;}
        .lcard{background:var(--w);border-radius:14px;border:1px solid var(--s2);display:flex;align-items:center;gap:13px;padding:13px;cursor:pointer;transition:all .22s;animation:ci .38s ease both;box-shadow:0 1px 4px rgba(0,0,0,.04);}
        .lcard:hover{transform:translateX(3px);box-shadow:0 5px 20px rgba(0,0,0,.07);border-color:var(--s3);}
        .lcard-thumb{width:70px;height:70px;border-radius:11px;flex-shrink:0;display:flex;align-items:center;justify-content:center;position:relative;}
        .ltag{position:absolute;top:4px;left:4px;padding:2px 6px;border-radius:6px;font-size:9px;font-weight:800;color:white;}
        .lcard-info{flex:1;min-width:0;}
        .lcat{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;}
        .lname{font-family:'Lexend',sans-serif;font-size:13.5px;font-weight:700;color:var(--s9);margin-bottom:3px;}
        .lvendor{font-size:11.5px;color:var(--s4);margin-bottom:6px;display:flex;align-items:center;gap:4px;}
        .lcard-right{display:flex;flex-direction:column;align-items:flex-end;gap:7px;flex-shrink:0;}
        .lprice-wrap{text-align:right;}
        .ldiscbadge{display:inline-block;padding:2px 7px;border-radius:100px;background:#fef3c7;color:#92400e;font-size:10px;font-weight:800;margin-bottom:2px;}
        .lprice{font-family:'Lexend',sans-serif;font-size:15.5px;font-weight:800;color:var(--s9);}
        .loriginal{font-size:11px;color:var(--s4);text-decoration:line-through;}
        .larrow{transition:all .2s;flex-shrink:0;}
        .ladd{display:flex;align-items:center;gap:5px;padding:7px 13px;border-radius:9px;border:none;background:var(--b6);color:white;font-size:12.5px;font-weight:700;font-family:'Nunito',sans-serif;cursor:pointer;transition:all .18s;}
        .ladd:hover{background:var(--b7);}
        .ladd.ok{background:var(--green);}

        /* Shared */
        .stars{display:flex;align-items:center;gap:2px;}
        .rnum{font-size:11.5px;font-weight:800;color:var(--s9);margin-left:4px;}
        .rrev{font-size:11px;color:var(--s4);margin-left:2px;}
        .vdot{background:#22c55e;color:white;width:14px;height:14px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;margin-left:3px;}

        /* Skeleton */
        .skl{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shim 1.4s infinite;border-radius:8px;}
        @keyframes shim{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .scard{background:var(--w);border-radius:16px;overflow:hidden;border:1px solid var(--s2);}

        /* Empty */
        .empty{padding:72px 20px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;}
        .ei{width:72px;height:72px;border-radius:20px;background:var(--s1);display:flex;align-items:center;justify-content:center;color:var(--s4);}
        .et{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--s7);}
        .es{font-size:14px;color:var(--s4);line-height:1.6;max-width:300px;}
        .ebtn{padding:11px 26px;background:var(--b6);color:white;border:none;border-radius:11px;font-size:14px;font-weight:700;font-family:'Nunito',sans-serif;cursor:pointer;transition:all .2s;}
        .ebtn:hover{background:var(--b7);transform:translateY(-1px);}

        /* Error */
        .err{margin:-4px 0 12px;background:#fee2e2;color:#991b1b;border:1px solid #fecaca;padding:9px 12px;border-radius:10px;font-size:12.5px;font-weight:700;display:flex;align-items:center;justify-content:space-between;gap:12px;}
        .errbtn{background:#fff;border:1px solid #fecaca;color:#b91c1c;padding:6px 10px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;}
        .errbtn:hover{background:#fff5f5;}

      `}</style>
</>
  );
}




