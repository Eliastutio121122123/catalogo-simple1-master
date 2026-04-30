import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const LogoCatalogix = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <defs><linearGradient id="pr-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1e40af"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient></defs>
    <path d="M18 26 L30 26 L44 76 L88 76 L98 42 L34 42" stroke="url(#pr-g)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="50" cy="88" r="6" fill="url(#pr-g)"/><circle cx="80" cy="88" r="6" fill="url(#pr-g)"/>
    <rect x="50" y="24" width="16" height="22" rx="2.5" fill="#1d4ed8" opacity="0.95"/>
    <rect x="58" y="20" width="16" height="22" rx="2.5" fill="#0891b2" opacity="0.9"/>
    <rect x="66" y="16" width="16" height="22" rx="2.5" fill="#06b6d4" opacity="0.85"/>
  </svg>
);

// ─── Configuración de estados ─────────────────────────────────────────────────
const STATUSES = {
  success: {
    bg:       "linear-gradient(145deg,#0a1628 0%,#062919 50%,#064e3b 100%)",
    glowA:    "rgba(34,197,94,.35)",
    glowB:    "rgba(16,185,129,.2)",
    dotColor: "rgba(52,211,153,.14)",
    icoGrad:  "linear-gradient(135deg,#16a34a,#22c55e)",
    icoShadow:"rgba(34,197,94,.45)",
    eyebrow:  "¡Pago exitoso!",
    eyebrowC: "#86efac",
    title:    "Tu pago fue",
    titleGrad:"aprobado",
    gradC:    "linear-gradient(90deg,#34d399,#6ee7b7)",
    sub:      "Tu pedido ha sido procesado correctamente. Recibirás un correo de confirmación en breve.",
    emoji:    "✅",
    badge:    { bg:"rgba(34,197,94,.12)", bdr:"rgba(34,197,94,.22)", color:"#86efac", text:"Pago aprobado" },
    actions: [
      { label:"Ver confirmación del pedido", primary:true,  nav:"/order-confirmation" },
      { label:"Seguir comprando",            primary:false, nav:"/catalogs" },
    ],
    details: [
      { lbl:"Estado",      val:"Aprobado",             color:"#22c55e" },
      { lbl:"Procesado",   val:"hace unos segundos",   color:null },
      { lbl:"Método",      val:"Tarjeta ···· 4242",    color:null },
    ],
    tips: [
      { emoji:"📬", txt:"Revisa tu bandeja de entrada — te enviamos el recibo." },
      { emoji:"📦", txt:"Tu pedido entrará en preparación de inmediato." },
      { emoji:"🔔", txt:"Te notificaremos cuando salga para entrega." },
    ],
  },
  cod: {
    bg:       "linear-gradient(145deg,#041a1f 0%,#062a33 50%,#064e3b 100%)",
    glowA:    "rgba(34,197,94,.22)",
    glowB:    "rgba(6,182,212,.18)",
    dotColor: "rgba(34,197,94,.12)",
    icoGrad:  "linear-gradient(135deg,#06b6d4,#22c55e)",
    icoShadow:"rgba(6,182,212,.35)",
    eyebrow:  "Pedido confirmado",
    eyebrowC: "#99f6e4",
    title:    "Pagarás",
    titleGrad:"al recibir",
    gradC:    "linear-gradient(90deg,#5eead4,#86efac)",
    sub:      "Tu pedido fue registrado con pago contra entrega. Prepárate para pagar cuando llegue el mensajero.",
    emoji:    "💵",
    badge:    { bg:"rgba(6,182,212,.12)", bdr:"rgba(6,182,212,.22)", color:"#99f6e4", text:"Contra entrega" },
    actions: [
      { label:"Ver confirmación del pedido", primary:true,  nav:"/order-confirmation" },
      { label:"Seguir comprando",            primary:false, nav:"/catalogs" },
    ],
    details: [
      { lbl:"Estado",    val:"Confirmado",          color:"#22c55e" },
      { lbl:"Método",    val:"Pago contra entrega", color:null },
      { lbl:"Pago",      val:"Al recibir",          color:"#fbbf24" },
    ],
    tips: [
      { emoji:"📦", txt:"Tu pedido entrará en preparación y despacho." },
      { emoji:"💵", txt:"Ten el monto listo (idealmente exacto) al recibir." },
      { emoji:"📞", txt:"Mantén tu teléfono disponible por si te contactan." },
    ],
  },
  failed: {
    bg:       "linear-gradient(145deg,#1a0a0a 0%,#3b0d0d 50%,#450a0a 100%)",
    glowA:    "rgba(239,68,68,.35)",
    glowB:    "rgba(220,38,38,.2)",
    dotColor: "rgba(248,113,113,.1)",
    icoGrad:  "linear-gradient(135deg,#b91c1c,#ef4444)",
    icoShadow:"rgba(239,68,68,.45)",
    eyebrow:  "Pago rechazado",
    eyebrowC: "#fca5a5",
    title:    "No pudimos",
    titleGrad:"procesar el pago",
    gradC:    "linear-gradient(90deg,#fca5a5,#f87171)",
    sub:      "Tu pago fue rechazado por el emisor de la tarjeta. Ningún cargo fue realizado. Puedes intentarlo de nuevo con otro método.",
    emoji:    "❌",
    badge:    { bg:"rgba(239,68,68,.1)", bdr:"rgba(239,68,68,.22)", color:"#fca5a5", text:"Pago rechazado" },
    actions: [
      { label:"Reintentar con otro método", primary:true,  nav:"/checkout" },
      { label:"Volver al carrito",          primary:false, nav:"/cart" },
    ],
    details: [
      { lbl:"Estado",      val:"Rechazado",             color:"#ef4444" },
      { lbl:"Motivo",      val:"Fondos insuficientes",  color:null },
      { lbl:"Cobro",       val:"Ningún cargo realizado",color:"#22c55e" },
    ],
    tips: [
      { emoji:"💳", txt:"Verifica que el número de tarjeta sea correcto." },
      { emoji:"💰", txt:"Confirma que tienes fondos suficientes disponibles." },
      { emoji:"🏦", txt:"Considera usar PayPal o pago contra entrega como alternativa." },
    ],
  },
  pending: {
    bg:       "linear-gradient(145deg,#0a0e1a 0%,#0c1a3a 50%,#0a1f4e 100%)",
    glowA:    "rgba(251,191,36,.25)",
    glowB:    "rgba(245,158,11,.18)",
    dotColor: "rgba(251,191,36,.1)",
    icoGrad:  "linear-gradient(135deg,#b45309,#f59e0b)",
    icoShadow:"rgba(251,191,36,.4)",
    eyebrow:  "Pago en revisión",
    eyebrowC: "#fde68a",
    title:    "Tu pago está",
    titleGrad:"siendo verificado",
    gradC:    "linear-gradient(90deg,#fde68a,#fcd34d)",
    sub:      "Tu pago está siendo procesado por el banco. Esto puede tardar unos minutos. Te notificaremos cuando se confirme.",
    emoji:    "⏳",
    badge:    { bg:"rgba(251,191,36,.1)", bdr:"rgba(251,191,36,.22)", color:"#fde68a", text:"En revisión" },
    actions: [
      { label:"Revisar estado del pedido",  primary:true,  nav:"/orders" },
      { label:"Ir al inicio",               primary:false, nav:"/catalogs" },
    ],
    details: [
      { lbl:"Estado",      val:"Pendiente",               color:"#f59e0b" },
      { lbl:"Tiempo est.", val:"2–10 minutos",             color:null },
      { lbl:"Acción",      val:"No realizar otro pago",   color:null },
    ],
    tips: [
      { emoji:"⏰", txt:"No cierres la app — podrías perder el seguimiento." },
      { emoji:"📵", txt:"No realices otro pago por el mismo pedido." },
      { emoji:"📧", txt:"Recibirás un correo cuando el pago sea confirmado." },
    ],
  },
};

// ─── Animación de spinner para pending ───────────────────────────────────────
function PendingRing() {
  return (
    <div style={{ position:"absolute", inset:0, borderRadius:"50%" }}>
      <div style={{
        position:"absolute", inset:0, borderRadius:"50%",
        border:"3px solid rgba(251,191,36,.15)",
      }}/>
      <div style={{
        position:"absolute", inset:0, borderRadius:"50%",
        border:"3px solid transparent",
        borderTopColor:"#f59e0b",
        borderRightColor:"#fde68a",
        animation:"spin .9s linear infinite",
      }}/>
</div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PaymentResult() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const rawStatus = params.get("status") || "success";
  const orderId   = params.get("order") || "CAT-2024-0041";
  const status    = STATUSES[rawStatus] || STATUSES.success;

  const [ready, setReady]       = useState(false);
  const [animDone, setAnimDone] = useState(false);
  const [countdown, setCountdown] = useState(rawStatus === "success" ? 8 : null);

  useEffect(() => { setTimeout(() => setReady(true), 60); }, []);
  useEffect(() => { setTimeout(() => setAnimDone(true), 700); }, []);

  // Auto-redirect on success
  useEffect(() => {
    if (rawStatus !== "success" || countdown === null) return;
    if (countdown <= 0) { navigate("/order-confirmation?order=" + orderId); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, rawStatus, navigate, orderId]);

  return (
    <>
<div className={`page${ready?" in":""}`} style={{ background: status.bg }}>
        {/* BG layers */}
        <div className="bg-layer">
          <div className="bg-dots" style={{ backgroundImage: `radial-gradient(circle,${status.dotColor} 1px,transparent 1px)` }} />
          <div className="bg-glowA" style={{ background: `radial-gradient(circle,${status.glowA},transparent 70%)` }} />
          <div className="bg-glowB" style={{ background: `radial-gradient(circle,${status.glowB},transparent 70%)` }} />
        </div>

        {/* HEADER */}
        <header className="hdr" style={{ position:"relative", zIndex:10 }}>
          <div className="hdr-in">
            <div className="brand" onClick={() => navigate("/")}><LogoCatalogix size={28}/><span className="brand-name">Catalog<em>ix</em></span></div>
            <div className="hdr-ref">#{orderId}</div>
          </div>
        </header>

        {/* MAIN */}
        <div className="main">
          {/* Icono */}
          <div className="ico-wrap">
            {rawStatus === "pending" && <PendingRing />}
            <div className="ico-inner" style={{ background: status.icoGrad, boxShadow: `0 12px 40px ${status.icoShadow}` }}>
              {status.emoji}
            </div>
          </div>

          {/* Texto */}
          <p className="eyebrow" style={{ color: status.eyebrowC }}>{status.eyebrow}</p>
          <h1 className="title">
            {status.title}<br />
            <span className="gr" style={{ backgroundImage: status.gradC }}>{status.titleGrad}</span>
          </h1>
          <p className="sub">{status.sub}</p>

          {/* Badge de estado */}
          <div className="badge" style={{ background: status.badge.bg, borderColor: status.badge.bdr }}>
            <div className="badge-dot" style={{ background: status.badge.color }} />
            <span className="badge-txt" style={{ color: status.badge.color }}>{status.badge.text}</span>
          </div>

          {/* Order ID */}
          <div className="oid-row">
            <div><div className="oid-lbl">Número de orden</div><div className="oid-val">{orderId}</div></div>
          </div>

          {/* Detalles + Tips */}
          <div className="cards-row">
            <div className="det-card">
              <div className="det-title">Detalles del pago</div>
              {status.details.map(d => (
                <div className="det-row" key={d.lbl}>
                  <span className="det-lbl">{d.lbl}</span>
                  <span className="det-val" style={d.color ? { color: d.color } : {}}>{d.val}</span>
                </div>
              ))}
            </div>
            <div className="tips-card">
              <div className="tips-title">¿Qué sigue?</div>
              {status.tips.map(t => (
                <div className="tip-item" key={t.txt}>
                  <span className="tip-emoji">{t.emoji}</span>
                  <span className="tip-txt">{t.txt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="actions">
            {status.actions.map((a, i) => (
              <button
                key={a.label}
                className={a.primary ? "btn-p" : "btn-s"}
                style={a.primary ? { color: "#0f172a" } : {}}
                onClick={() => navigate(a.nav + (a.nav === "/order-confirmation" ? "?order=" + orderId : ""))}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Countdown (solo success) */}
          {rawStatus === "success" && countdown !== null && (
            <div className="countdown-wrap">
              <p className="countdown-txt">Redirigiendo a la confirmación en {countdown}s…</p>
              <div className="countdown-bar">
                <div className="countdown-fill" style={{ width: `${(countdown / 8) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Lexend:wght@600;700;800&display=swap');

@keyframes spin{to{transform:rotate(360deg)}}

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{min-height:100%;}
        body{font-family:'Nunito',sans-serif;}

        .page{opacity:0;transform:translateY(8px);transition:opacity .45s ease,transform .45s ease;min-height:100vh;display:flex;flex-direction:column;}
        .page.in{opacity:1;transform:translateY(0);}

        .hdr{background:rgba(0,0,0,.25);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.08);}
        .hdr-in{max-width:860px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:64px;}
        .brand{display:flex;align-items:center;gap:10px;cursor:pointer;}
        .brand-name{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:white;}
        .brand-name em{font-style:normal;opacity:.55;}
        .hdr-ref{font-size:12px;font-weight:600;color:rgba(255,255,255,.3);background:rgba(255,255,255,.07);padding:6px 13px;border-radius:100px;border:1px solid rgba(255,255,255,.1);}

        /* Full page background */
        .bg-wrap{flex:1;display:flex;flex-direction:column;position:relative;overflow:hidden;}
        .bg-layer{position:absolute;inset:0;}
        .bg-dots{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.08) 1px,transparent 1px);background-size:24px 24px;}
        .bg-glowA{position:absolute;width:500px;height:500px;border-radius:50%;filter:blur(100px);top:-100px;right:-80px;pointer-events:none;}
        .bg-glowB{position:absolute;width:300px;height:300px;border-radius:50%;filter:blur(80px);bottom:-40px;left:5%;pointer-events:none;}

        /* Main content */
        .main{position:relative;z-index:1;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:52px 24px 64px;max-width:860px;margin:0 auto;width:100%;}

        /* Icon */
        .ico-wrap{width:104px;height:104px;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;margin-bottom:28px;animation:popIn .55s cubic-bezier(.34,1.56,.64,1) .12s both;}
        @keyframes popIn{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}
        .ico-wrap::before{content:'';position:absolute;inset:-9px;border-radius:50%;border:2px dashed rgba(255,255,255,.12);animation:rspin 16s linear infinite;}
        @keyframes rspin{to{transform:rotate(360deg)}}
        .ico-inner{width:104px;height:104px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:42px;position:relative;}

        .eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;animation:fu .4s ease .25s both;}
        .title{font-family:'Lexend',sans-serif;font-size:clamp(28px,5vw,52px);font-weight:800;color:white;letter-spacing:-1.2px;line-height:1.05;margin-bottom:16px;text-align:center;animation:fu .4s ease .32s both;}
        .title .gr{background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
        .sub{font-size:15px;color:rgba(255,255,255,.4);font-weight:300;line-height:1.75;max-width:500px;text-align:center;margin-bottom:36px;animation:fu .4s ease .38s both;}
        @keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

        /* Badge */
        .badge{display:inline-flex;align-items:center;gap:8px;border-radius:100px;padding:10px 22px;margin-bottom:28px;border:1px solid;animation:fu .4s ease .44s both;}
        .badge-dot{width:8px;height:8px;border-radius:50%;animation:blink 2.5s ease-in-out infinite;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
        .badge-txt{font-size:13px;font-weight:700;}

        /* Cards row */
        .cards-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;width:100%;max-width:680px;animation:fu .4s ease .5s both;}
        @media(max-width:560px){.cards-row{grid-template-columns:1fr;}}

        /* Detail card */
        .det-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:20px 22px;backdrop-filter:blur(8px);}
        .det-title{font-family:'Lexend',sans-serif;font-size:12px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:14px;}
        .det-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
        .det-row:last-child{margin-bottom:0;}
        .det-lbl{font-size:12.5px;color:rgba(255,255,255,.35);font-weight:500;}
        .det-val{font-size:13px;font-weight:700;color:rgba(255,255,255,.85);}

        /* Tips card */
        .tips-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:20px 22px;backdrop-filter:blur(6px);}
        .tips-title{font-family:'Lexend',sans-serif;font-size:12px;font-weight:700;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:14px;}
        .tip-item{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;}
        .tip-item:last-child{margin-bottom:0;}
        .tip-emoji{font-size:16px;line-height:1;flex-shrink:0;margin-top:1px;}
        .tip-txt{font-size:12.5px;color:rgba(255,255,255,.45);line-height:1.5;}

        /* Actions */
        .actions{display:flex;flex-direction:column;gap:10px;width:100%;max-width:380px;margin-top:28px;animation:fu .4s ease .56s both;}
        .btn-p{padding:15px;background:rgba(255,255,255,.95);border:none;border-radius:14px;font-size:14.5px;font-weight:800;font-family:'Nunito',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .25s;box-shadow:0 6px 24px rgba(0,0,0,.25);}
        .btn-p:hover{background:white;transform:translateY(-2px);box-shadow:0 10px 32px rgba(0,0,0,.32);}
        .btn-s{padding:13px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.14);border-radius:14px;font-size:14px;font-weight:700;font-family:'Nunito',sans-serif;cursor:pointer;color:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s;}
        .btn-s:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.22);color:white;}

        /* Countdown */
        .countdown-wrap{margin-top:16px;text-align:center;}
        .countdown-txt{font-size:12.5px;color:rgba(255,255,255,.28);font-weight:500;}
        .countdown-bar{width:100%;max-width:380px;height:3px;background:rgba(255,255,255,.08);border-radius:2px;margin:6px auto 0;overflow:hidden;}
        .countdown-fill{height:100%;background:rgba(255,255,255,.3);border-radius:2px;transition:width 1s linear;}

        /* Order ID */
        .oid-row{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px 16px;margin-bottom:24px;animation:fu .4s ease .44s both;}
        .oid-lbl{font-size:10.5px;font-weight:700;color:rgba(255,255,255,.28);text-transform:uppercase;letter-spacing:.8px;}
        .oid-val{font-family:'Lexend',sans-serif;font-size:15px;font-weight:800;color:rgba(255,255,255,.85);}

      `}</style>
</>
  );
}
