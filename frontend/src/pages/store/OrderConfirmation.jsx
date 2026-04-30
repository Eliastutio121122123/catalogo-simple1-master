import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../services/odoo/odooClient";

const LogoCatalogix = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <defs><linearGradient id="oc-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1e40af"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient></defs>
    <path d="M18 26 L30 26 L44 76 L88 76 L98 42 L34 42" stroke="url(#oc-g)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="50" cy="88" r="6" fill="url(#oc-g)"/><circle cx="80" cy="88" r="6" fill="url(#oc-g)"/>
    <rect x="50" y="24" width="16" height="22" rx="2.5" fill="#1d4ed8" opacity="0.95"/>
    <rect x="58" y="20" width="16" height="22" rx="2.5" fill="#0891b2" opacity="0.9"/>
    <rect x="66" y="16" width="16" height="22" rx="2.5" fill="#06b6d4" opacity="0.85"/>
  </svg>
);

const IcoCheck   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoCheckSm = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoCopy    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IcoMail    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IcoMap     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcoShop    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IcoAlert   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

/* ── Helpers ─────────────────────────────────────────────────── */

function formatDate(raw) {
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    return d.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
  } catch { return String(raw).slice(0, 10); }
}

function formatCurrency(value, currency = "DOP") {
  const n = Number(value) || 0;
  const symbol = currency === "USD" ? "US$" : "RD$";
  return `${symbol}${n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildTimeline(orderState) {
  const st = (orderState || "").toLowerCase();
  const confirmed = ["sale", "done"].includes(st);
  const done      = st === "done";
  return [
    { id: 1, emoji: "✅", label: "Pedido confirmado",   sub: "Tu pedido fue procesado exitosamente",      done: confirmed, active: false       },
    { id: 2, emoji: "📦", label: "Preparando pedido",   sub: "El vendedor está empacando tus productos",  done: done,      active: confirmed && !done },
    { id: 3, emoji: "🚚", label: "En camino",           sub: "Tu pedido saldrá pronto hacia ti",          done: false,     active: false       },
    { id: 4, emoji: "🏠", label: "Entregado",           sub: "Recibirás una notificación al llegar",      done: false,     active: false       },
  ];
}

function productName(line) {
  const pid = line.product_id;
  if (Array.isArray(pid) && pid.length > 1) return pid[1];
  return line.name || `Producto #${line.id}`;
}

function productColor(index) {
  const palette = ["#f43f5e", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#06b6d4", "#ec4899"];
  return palette[index % palette.length];
}

/* ── Confetti ────────────────────────────────────────────────── */

function Confetti() {
  const pieces = [
    {x:12,y:-10,r:16,c:"#60a5fa",s:"c"},{x:78,y:-5,r:13,c:"#22d3ee",s:"r"},
    {x:35,y:-20,r:10,c:"#f59e0b",s:"c"},{x:58,y:-8,r:15,c:"#34d399",s:"r"},
    {x:88,y:-15,r:11,c:"#f87171",s:"c"},{x:48,y:-25,r:8,c:"#a78bfa",s:"r"},
    {x:22,y:-18,r:12,c:"#fb923c",s:"c"},{x:68,y:-12,r:9,c:"#2563eb",s:"r"},
    {x:5, y:-8, r:14,c:"#ec4899",s:"c"},{x:95,y:-22,r:10,c:"#84cc16",s:"r"},
  ];
  return (
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      {pieces.map((p,i)=>(
        <div key={i} style={{
          position:"absolute",left:`${p.x}%`,top:0,
          width:p.s==="c"?p.r:p.r*1.5, height:p.s==="c"?p.r:p.r*0.65,
          borderRadius:p.s==="c"?"50%":"3px",
          background:p.c, opacity:0.75,
          animation:`cf${i%4} ${1.6+i*0.25}s ease-in ${i*0.1}s both`,
        }}/>
      ))}
  </div>
  );
}

/* ── Loading skeleton ────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="page in">
      <header className="hdr">
        <div className="hdr-in">
          <div className="brand"><LogoCatalogix size={28}/><span className="brand-name">Catalog<em>ix</em></span></div>
          <span style={{fontSize:13,color:"var(--s4)",fontWeight:600}}>Cargando...</span>
        </div>
      </header>
      <div className="hero">
        <div className="hero-dots"/><div className="hero-ga"/><div className="hero-gb"/>
        <div className="hero-in">
          <div className="hero-ico"><div className="hero-ico-inner" style={{background:"rgba(255,255,255,.1)",boxShadow:"none"}}>
            <div style={{width:22,height:22,border:"3px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
          </div></div>
          <p className="hero-eyebrow" style={{color:"rgba(255,255,255,.3)"}}>Cargando pedido...</p>
          <h1 className="hero-title">Obteniendo<br/><span className="gr">información</span></h1>
          <p className="hero-sub">Estamos consultando los detalles de tu pedido. Esto tardará solo un momento.</p>
        </div>
      </div>
      <div className="content">
        <div>
          {[1,2,3].map(i => (
            <div key={i} className="card">
              <div className="card-head"><div className="skel-bar" style={{width:"40%",height:16}}/></div>
              <div className="card-body">
                <div className="skel-bar" style={{width:"90%",height:14,marginBottom:10}}/>
                <div className="skel-bar" style={{width:"70%",height:14,marginBottom:10}}/>
                <div className="skel-bar" style={{width:"60%",height:14}}/>
              </div>
            </div>
          ))}
        </div>
        <div className="sc">
          <div className="sc-head">Resumen del pago</div>
          <div className="sc-body">
            <div className="skel-bar" style={{width:"100%",height:14,marginBottom:12}}/>
            <div className="skel-bar" style={{width:"80%",height:14,marginBottom:12}}/>
            <div className="skel-bar" style={{width:"60%",height:14}}/>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Error state ─────────────────────────────────────────────── */

function ErrorState({ message, onRetry, onHome }) {
  return (
    <div className="page in">
      <header className="hdr">
        <div className="hdr-in">
          <div className="brand" onClick={onHome}><LogoCatalogix size={28}/><span className="brand-name">Catalog<em>ix</em></span></div>
        </div>
      </header>
      <div className="hero" style={{background:"linear-gradient(145deg,#1a0a0a 0%,#2d1010 45%,#3b1515 100%)"}}>
        <div className="hero-dots"/><div className="hero-ga" style={{background:"radial-gradient(circle,rgba(239,68,68,.3),transparent 70%)"}}/>
        <div className="hero-in">
          <div className="hero-ico"><div className="hero-ico-inner" style={{background:"linear-gradient(135deg,#b91c1c,#ef4444)",boxShadow:"0 10px 36px rgba(239,68,68,.4)"}}>
            <IcoAlert/>
          </div></div>
          <p className="hero-eyebrow" style={{color:"#fca5a5"}}>Error</p>
          <h1 className="hero-title">No pudimos cargar<br/><span style={{background:"linear-gradient(90deg,#fca5a5,#f87171)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>el pedido</span></h1>
          <p className="hero-sub">{message || "Ocurrió un error al obtener los datos del pedido."}</p>
          <div style={{display:"flex",gap:12,marginTop:20}}>
            <button className="btn-retry" onClick={onRetry}>Reintentar</button>
            <button className="btn-home" onClick={onHome}>Ir al inicio</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderParam = params.get("order") || "";

  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg]   = useState(null);
  const [ready, setReady]     = useState(false);
  const [copied, setCopied]   = useState(false);
  const [showAll, setShowAll] = useState(false);

  /* Extract the numeric order ID from the param (could be "S00012" or "12") */
  const extractOrderId = useCallback(() => {
    if (!orderParam) return null;
    const digits = orderParam.replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : null;
  }, [orderParam]);

  /* Fetch order data from backend */
  const fetchOrder = useCallback(async () => {
    const numericId = extractOrderId();
    if (!numericId) {
      setErrMsg("No se proporcionó un número de pedido válido.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrMsg(null);
    try {
      const data = await api.get(`/api/orders/${numericId}`);
      setOrder(data);
    } catch (err) {
      setErrMsg(err.message || "Error al cargar el pedido.");
    } finally {
      setLoading(false);
    }
  }, [extractOrderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);
  useEffect(() => { if (!loading && order) setTimeout(() => setReady(true), 80); }, [loading, order]);

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) return <><LoadingSkeleton /><ConfirmationStyles /></>;

  /* ── Error ────────────────────────────────────────────────── */
  if (errMsg || !order) {
    return (
      <>
        <ErrorState
          message={errMsg}
          onRetry={fetchOrder}
          onHome={() => navigate("/")}
        />
        <ConfirmationStyles />
      </>
    );
  }

  /* ── Derived data ─────────────────────────────────────────── */
  const orderName   = order.name || `SO${order.id}`;
  const orderDate   = formatDate(order.date_order);
  const orderState  = order.state || "sale";
  const lines       = order.lines || [];
  const timeline    = buildTimeline(orderState);
  const partner     = order.partner_id || [];
  const partnerName = Array.isArray(partner) && partner.length > 1 ? partner[1] : "Cliente";

  const subtotal = lines.reduce((s, l) => s + (Number(l.price_subtotal) || Number(l.price_unit) * Number(l.product_uom_qty) || 0), 0);
  const totalQty = lines.reduce((s, l) => s + (Number(l.product_uom_qty) || 0), 0);
  const total    = Number(order.amount_total) || subtotal;
  const visible  = showAll ? lines : lines.slice(0, 3);

  const copyOrder = () => {
    navigator.clipboard?.writeText(orderName).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  return (
    <>
<div className={`page${ready?" in":""}`}>
        {/* HEADER */}
        <header className="hdr">
          <div className="hdr-in">
            <div className="brand" onClick={()=>navigate("/")}><LogoCatalogix size={28}/><span className="brand-name">Catalog<em>ix</em></span></div>
            <span style={{fontSize:13,color:"var(--s4)",fontWeight:600}}>Pedido #{orderName}</span>
          </div>
        </header>

        {/* HERO */}
        <div className="hero">
          <Confetti/>
          <div className="hero-dots"/><div className="hero-ga"/><div className="hero-gb"/>
          <div className="hero-in">
            <div className="hero-ico"><div className="hero-ico-inner"><IcoCheck /></div></div>
            <p className="hero-eyebrow">¡Pago procesado!</p>
            <h1 className="hero-title">Tu pedido está<br/><span className="gr">confirmado</span></h1>
            <p className="hero-sub">Gracias por tu compra, {partnerName}. Recibirás una confirmación por correo electrónico con todos los detalles.</p>
            <div className="oid-pill">
              <div><div className="oid-lbl">Número de orden</div><div className="oid-val">{orderName}</div></div>
              <button className={`copy-btn${copied?" ok":""}`} onClick={copyOrder}><IcoCopy/>{copied?"¡Copiado!":"Copiar"}</button>
            </div>
            <div className="meta-pills">
              <div className="mail-badge"><IcoMail/><span className="mail-badge-txt">Pedido realizado el {orderDate}</span></div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">
          <div>
            {/* Timeline */}
            <div className="card">
              <div className="card-head"><span className="card-title">Estado del pedido</span><span style={{fontSize:12,color:"var(--s4)",fontWeight:600}}>Actualizado hoy</span></div>
              <div className="card-body">
                <div className="tl">
                  {timeline.map(s=>(
                    <div key={s.id} className={`tl-item${s.done?" done":""}`}>
                      <div className="tl-l">
                        <div className={`tl-circle${s.done?" done":s.active?" active":" idle"}`}>
                          {s.done ? <IcoCheckSm/> : <span>{s.emoji}</span>}
                        </div>
                      </div>
                      <div className="tl-r">
                        <div className={`tl-lbl${!s.done&&!s.active?" idle":""}`}>{s.label}</div>
                        <div className={`tl-sub${s.active?" active":""}`}>
                          {s.active && <span className="pulse-dot"/>}{s.sub}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="card">
              <div className="card-head">
                <span className="card-title">Productos ({Math.round(totalQty)})</span>
                <span style={{fontSize:13,fontWeight:800,color:"var(--s9)"}}>{formatCurrency(subtotal)}</span>
              </div>
              <div className="card-body">
                <div className="oi-list">
                  {visible.map((item, idx) => {
                    const name = productName(item);
                    const qty  = Number(item.product_uom_qty) || 1;
                    const priceSub = Number(item.price_subtotal) || Number(item.price_unit) * qty || 0;
                    const color = productColor(idx);
                    const hasImage = item.image_url;
                    return (
                      <div className="oi" key={item.id}>
                        <div className="oi-thumb" style={ hasImage
                          ? {backgroundImage:`url(${item.image_url})`, backgroundSize:"cover", backgroundPosition:"center"}
                          : {background:`${color}22`}
                        }>
                          {!hasImage && "📦"}
                        </div>
                        <div className="oi-info">
                          <div className="oi-name">{name}</div>
                          <div className="oi-sub">x{Math.round(qty)} · {formatCurrency(Number(item.price_unit) || 0)}/ud</div>
                        </div>
                        <div className="oi-price">{formatCurrency(priceSub)}</div>
                      </div>
                    );
                  })}
                </div>
                {lines.length > 3 && (
                  <button className="show-more" onClick={()=>setShowAll(v=>!v)}>
                    {showAll?`Ver menos`:`Ver ${lines.length-3} más`}
                  </button>
                )}
              </div>
            </div>

            {/* Información del pedido */}
            <div className="card">
              <div className="card-head"><span className="card-title">Información del pedido</span></div>
              <div className="card-body">
                {[
                  {ico:<IcoMap/>,      lbl:"Cliente",    val: partnerName},
                  {ico:<IcoMail/>,     lbl:"Fecha",      val: orderDate},
                  {ico:<span>📋</span>,lbl:"Estado",     val: orderState === "sale" ? "Confirmado" : orderState === "done" ? "Completado" : orderState === "draft" ? "Borrador" : orderState},
                  {ico:<span>💳</span>,lbl:"Total",      val: formatCurrency(total)},
                ].map(r=>(
                  <div className="irow" key={r.lbl}>
                    <div className="irow-ico">{r.ico}</div>
                    <div><div className="irow-lbl">{r.lbl}</div><div className="irow-val">{r.val}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="sc">
            <div className="sc-head">Resumen del pago</div>
            <div className="sc-body">
              <div className="status-pill"><div className="status-dot"/><span className="status-txt">Pago confirmado</span></div>
              <div className="sc-line"><span className="sc-lbl">Subtotal ({Math.round(totalQty)} artículos)</span><span className="sc-val">{formatCurrency(subtotal)}</span></div>
              {total > subtotal && (
                <div className="sc-line"><span className="sc-lbl">Impuestos</span><span className="sc-val">{formatCurrency(total - subtotal)}</span></div>
              )}
              <div className="sc-line"><span className="sc-lbl">Envío</span><span className="sc-val" style={{color:"var(--green)"}}>Gratis</span></div>
              <div className="sc-total"><span className="sc-tl">Total cobrado</span><span className="sc-tv">{formatCurrency(total)}</span></div>
            </div>
            <div className="sc-foot">
              <button className="btn-p" onClick={()=>navigate("/catalogs")}><IcoShop/>Seguir comprando</button>
              <button className="btn-s" onClick={()=>navigate("/orders")}>Ver mis pedidos</button>
            </div>
          </div>
        </div>
      </div>
    
      <ConfirmationStyles />
</>
  );
}   

/* ── Styles extracted into a component for reuse ─────────────── */

function ConfirmationStyles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Lexend:wght@600;700;800&display=swap');

@keyframes spin{to{transform:rotate(360deg)}}
@keyframes cf0{from{transform:translateY(0) rotate(0deg)}to{transform:translateY(350px) rotate(400deg);opacity:0}}
        @keyframes cf1{from{transform:translateY(0) rotate(0deg)}to{transform:translateY(290px) rotate(-270deg);opacity:0}}
        @keyframes cf2{from{transform:translateY(0) rotate(45deg)}to{transform:translateY(320px) rotate(190deg);opacity:0}}
        @keyframes cf3{from{transform:translateY(0) rotate(-30deg)}to{transform:translateY(380px) rotate(450deg);opacity:0}}

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{min-height:100%;}
        body{font-family:'Nunito',sans-serif;background:#f8fafc;}
        :root{
          --b7:#1d4ed8;--b6:#2563eb;--b5:#3b82f6;--b4:#60a5fa;--b1:#dbeafe;--b0:#eff6ff;
          --t5:#06b6d4;--t4:#22d3ee;--t3:#67e8f9;
          --s9:#0f172a;--s7:#334155;--s5:#64748b;--s4:#94a3b8;
          --s2:#e2e8f0;--s1:#f1f5f9;--s0:#f8fafc;--w:#fff;
          --green:#22c55e;--green-bg:rgba(34,197,94,.08);--green-bdr:rgba(34,197,94,.2);
        }
        .page{opacity:0;transform:translateY(10px);transition:opacity .45s ease,transform .45s ease;}
        .page.in{opacity:1;transform:translateY(0);}

        .hdr{background:rgba(255,255,255,.94);backdrop-filter:blur(14px);border-bottom:1px solid var(--s2);}
        .hdr-in{max-width:980px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:64px;}
        .brand{display:flex;align-items:center;gap:10px;cursor:pointer;}
        .brand-name{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--s9);}
        .brand-name em{font-style:normal;background:linear-gradient(90deg,var(--b6),var(--t5));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}

        /* Hero */
        .hero{background:linear-gradient(145deg,#0a1628 0%,#0f2044 45%,#0d2d60 100%);padding:60px 24px 56px;position:relative;overflow:hidden;}
        .hero-dots{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(34,211,238,.14) 1px,transparent 1px);background-size:26px 26px;}
        .hero-ga{position:absolute;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(29,78,216,.4),transparent 70%);top:-100px;right:-80px;filter:blur(80px);}
        .hero-gb{position:absolute;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(34,197,94,.22),transparent 70%);bottom:-40px;left:8%;filter:blur(70px);}
        .hero-in{position:relative;z-index:1;max-width:980px;margin:0 auto;display:flex;flex-direction:column;align-items:center;text-align:center;}

        .hero-ico{width:94px;height:94px;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;margin-bottom:26px;animation:popIn .5s cubic-bezier(.34,1.56,.64,1) .1s both;}
        @keyframes popIn{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}
        .hero-ico::before{content:'';position:absolute;inset:-8px;border-radius:50%;border:2px dashed rgba(34,197,94,.3);animation:rspin 14s linear infinite;}
        @keyframes rspin{to{transform:rotate(360deg)}}
        .hero-ico-inner{width:94px;height:94px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#22c55e);display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 10px 36px rgba(34,197,94,.45);}

        .hero-eyebrow{font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;animation:fu .4s ease .22s both;}
        .hero-title{font-family:'Lexend',sans-serif;font-size:clamp(26px,4vw,44px);font-weight:800;color:white;letter-spacing:-1px;line-height:1.1;margin-bottom:14px;animation:fu .4s ease .3s both;}
        .hero-title .gr{background:linear-gradient(90deg,var(--t4),var(--b4));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .hero-sub{font-size:15px;color:rgba(255,255,255,.42);font-weight:300;line-height:1.7;max-width:460px;margin-bottom:32px;animation:fu .4s ease .36s both;}
        @keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

        .oid-pill{display:inline-flex;align-items:center;gap:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);border-radius:14px;padding:12px 20px;animation:fu .4s ease .42s both;margin-bottom:18px;}
        .oid-lbl{font-size:10.5px;font-weight:700;color:rgba(255,255,255,.32);text-transform:uppercase;letter-spacing:1px;}
        .oid-val{font-family:'Lexend',sans-serif;font-size:18px;font-weight:800;color:white;letter-spacing:.5px;}
        .copy-btn{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:6px 12px;color:rgba(255,255,255,.6);font-size:12px;font-weight:700;font-family:'Nunito',sans-serif;cursor:pointer;transition:all .2s;}
        .copy-btn:hover{background:rgba(255,255,255,.18);color:white;}
        .copy-btn.ok{background:rgba(34,197,94,.2);border-color:rgba(34,197,94,.3);color:#86efac;}
        .meta-pills{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;animation:fu .4s ease .48s both;}
        .mail-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(37,99,235,.12);border:1px solid rgba(37,99,235,.2);border-radius:100px;padding:8px 18px;}
        .mail-badge-txt{font-size:13px;font-weight:600;color:var(--b4);}

        /* Content */
        .content{max-width:980px;margin:0 auto;padding:40px 24px 80px;display:grid;grid-template-columns:1fr 330px;gap:24px;align-items:start;}
        @media(max-width:760px){.content{grid-template-columns:1fr;}}

        /* Cards */
        .card{background:var(--w);border-radius:18px;border:1px solid var(--s2);overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.05);margin-bottom:18px;}
        .card:last-child{margin-bottom:0;}
        .card-head{padding:18px 22px 14px;border-bottom:1px solid var(--s1);display:flex;align-items:center;justify-content:space-between;}
        .card-title{font-family:'Lexend',sans-serif;font-size:14.5px;font-weight:800;color:var(--s9);}
        .card-body{padding:18px 22px;}

        /* Timeline */
        .tl{display:flex;flex-direction:column;}
        .tl-item{display:flex;gap:14px;position:relative;}
        .tl-item:not(:last-child)::after{content:'';position:absolute;left:18px;top:38px;width:2px;height:calc(100% - 6px);background:var(--s2);z-index:0;}
        .tl-item.done:not(:last-child)::after{background:linear-gradient(180deg,var(--b6),var(--t5));}
        .tl-l{display:flex;align-items:flex-start;flex-shrink:0;position:relative;z-index:1;}
        .tl-circle{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
        .tl-circle.done{background:linear-gradient(135deg,var(--b7),var(--t5));box-shadow:0 4px 12px rgba(37,99,235,.3);}
        .tl-circle.active{background:var(--b0);border:2px solid var(--b6);}
        .tl-circle.idle{background:var(--s1);border:2px solid var(--s2);opacity:.6;}
        .tl-r{flex:1;padding-bottom:22px;}
        .tl-lbl{font-family:'Lexend',sans-serif;font-size:13.5px;font-weight:700;color:var(--s9);margin-bottom:3px;}
        .tl-lbl.idle{color:var(--s4);}
        .tl-sub{font-size:12px;color:var(--s5);line-height:1.4;}
        .tl-sub.active{color:var(--b6);font-weight:600;}
        .pulse-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--b6);margin-right:5px;animation:pdot 2s ease-in-out infinite;}
        @keyframes pdot{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)}50%{box-shadow:0 0 0 5px rgba(37,99,235,0)}}

        /* Items */
        .oi-list{display:flex;flex-direction:column;gap:8px;}
        .oi{display:flex;align-items:center;gap:11px;padding:10px 13px;background:var(--s0);border:1px solid var(--s2);border-radius:12px;}
        .oi-thumb{width:44px;height:44px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:19px;}
        .oi-info{flex:1;min-width:0;}
        .oi-name{font-size:13px;font-weight:700;color:var(--s9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .oi-sub{font-size:11.5px;color:var(--s4);margin-top:1px;}
        .oi-price{font-family:'Lexend',sans-serif;font-size:13.5px;font-weight:800;color:var(--s9);flex-shrink:0;}
        .show-more{width:100%;margin-top:8px;padding:9px;background:none;border:1.5px solid var(--s2);border-radius:10px;font-size:13px;font-weight:700;color:var(--s5);cursor:pointer;font-family:'Nunito',sans-serif;transition:all .18s;}
        .show-more:hover{border-color:var(--b4);color:var(--b6);}

        /* Info rows */
        .irow{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--s1);}
        .irow:last-child{border-bottom:none;padding-bottom:0;}
        .irow-ico{width:30px;height:30px;border-radius:8px;background:var(--b0);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--b6);}
        .irow-lbl{font-size:10.5px;font-weight:700;color:var(--s4);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;}
        .irow-val{font-size:13.5px;font-weight:700;color:var(--s9);}

        /* Summary sidebar */
        .sc{background:var(--w);border-radius:18px;border:1px solid var(--s2);overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.05);position:sticky;top:20px;}
        .sc-head{padding:18px 20px 13px;font-family:'Lexend',sans-serif;font-size:15px;font-weight:800;color:var(--s9);border-bottom:1px solid var(--s1);}
        .sc-body{padding:15px 20px;}
        .sc-line{display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;}
        .sc-lbl{color:var(--s5);font-weight:500;}
        .sc-val{font-weight:700;color:var(--s9);}
        .sc-total{display:flex;justify-content:space-between;padding-top:12px;border-top:2px solid var(--s9);margin-top:4px;}
        .sc-tl{font-family:'Lexend',sans-serif;font-size:14px;font-weight:800;color:var(--s9);}
        .sc-tv{font-family:'Lexend',sans-serif;font-size:19px;font-weight:800;color:var(--s9);}
        .status-pill{display:flex;align-items:center;gap:7px;background:var(--green-bg);border:1px solid var(--green-bdr);border-radius:10px;padding:10px 13px;margin-bottom:14px;}
        .status-dot{width:8px;height:8px;border-radius:50%;background:var(--green);animation:blink 2.5s ease-in-out infinite;box-shadow:0 0 6px rgba(34,197,94,.5);}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
        .status-txt{font-size:13px;font-weight:700;color:var(--green);}
        .sc-foot{padding:14px 20px;border-top:1px solid var(--s1);}
        .btn-p{width:100%;padding:13px;background:linear-gradient(135deg,var(--b7),var(--b6),#0284c7);border:none;border-radius:12px;color:white;font-size:14px;font-weight:800;font-family:'Nunito',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .25s;box-shadow:0 4px 14px rgba(29,78,216,.28);margin-bottom:8px;}
        .btn-p:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(29,78,216,.38);}
        .btn-s{width:100%;padding:12px;background:none;border:1.5px solid var(--s2);border-radius:12px;color:var(--s7);font-size:13.5px;font-weight:700;font-family:'Nunito',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s;}
        .btn-s:hover{border-color:var(--b4);color:var(--b6);background:var(--b0);}

        /* Skeleton */
        .skel-bar{background:linear-gradient(90deg,var(--s1) 25%,var(--s2) 50%,var(--s1) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:6px;}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

        /* Error buttons */
        .btn-retry{padding:12px 28px;background:linear-gradient(135deg,#b91c1c,#ef4444);border:none;border-radius:12px;color:white;font-size:14px;font-weight:800;font-family:'Nunito',sans-serif;cursor:pointer;transition:all .25s;box-shadow:0 4px 14px rgba(239,68,68,.3);}
        .btn-retry:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(239,68,68,.4);}
        .btn-home{padding:12px 28px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.14);border-radius:12px;color:rgba(255,255,255,.7);font-size:14px;font-weight:700;font-family:'Nunito',sans-serif;cursor:pointer;transition:all .2s;}
        .btn-home:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.22);color:white;}

      `}</style>
  );
}
