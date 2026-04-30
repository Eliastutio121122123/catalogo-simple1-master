import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const IconMail     = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const IconMailSm   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const IconCheck    = () => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconCheckBig = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconAlertBig = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconRefresh  = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);
const IconShield   = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
const IconArrowRight=() => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);
const IconClock    = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);

const verifyEmailService = {
  verify: async (token) => {
    await new Promise(r => setTimeout(r, 2000));
    if (token === "invalid") throw new Error("El enlace ha expirado o es inválido.");
    return { ok: true, email: "usuario@ejemplo.com" };
  },
  resend: async (email) => {
    await new Promise(r => setTimeout(r, 1400));
    return { ok: true };
  },
};

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus]           = useState(token ? "verifying" : "pending");
  const [email, setEmail]             = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending]     = useState(false);
  const [resent, setResent]           = useState(false);
  const [countdown, setCountdown]     = useState(60);
  const [canResend, setCanResend]     = useState(false);

  useEffect(() => {
    if (!token) return;
    verifyEmailService.verify(token)
      .then(res => { setEmail(res.email); setStatus("success"); })
      .catch(() => setStatus("error"));
  }, [token]);

  useEffect(() => {
    if (status !== "pending") return;
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, status]);

  const handleResend = async () => {
    setResending(true);
    try { await verifyEmailService.resend(resendEmail); setResent(true); setCountdown(60); setCanResend(false); }
    catch {/* silencioso */}
    finally { setResending(false); }
  };

  return (
    <>
      <style>{`
        .f-eyebrow{font-size:11px;font-weight:700;color:var(--c-teal-500);text-transform:uppercase;letter-spacing:1.8px;margin-bottom:9px}
        .f-label{display:block;font-size:11px;font-weight:700;color:var(--c-slate-500);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:7px}
        .f-wrap{position:relative}
        .f-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--c-slate-300);pointer-events:none;display:flex;align-items:center;transition:color 0.2s}
        .f-input{width:100%;background:var(--c-slate-50);border:1.5px solid var(--c-slate-200);border-radius:13px;padding:13px 14px 13px 42px;font-size:14px;font-weight:500;color:var(--c-slate-900);font-family:'Nunito',sans-serif;outline:none;transition:all 0.22s}
        .f-input::placeholder{color:var(--c-slate-300);font-weight:400}
        .f-input:focus{border-color:var(--c-blue-600);background:var(--c-white);box-shadow:0 0 0 4px rgba(37,99,235,0.09)}
        .f-wrap:focus-within .f-icon{color:var(--c-blue-600)}
        .f-group{margin-bottom:20px;margin-top:28px;width:100%}
        .btn-submit{width:100%;background:linear-gradient(135deg,var(--c-blue-700),var(--c-blue-600),#0284c7);border:none;border-radius:13px;padding:15px;font-size:15px;font-weight:700;color:var(--c-white);font-family:'Nunito',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;transition:all 0.25s;box-shadow:0 4px 18px rgba(29,78,216,0.32)}
        .btn-submit:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(29,78,216,0.42)}
        .btn-submit:disabled{opacity:0.6;cursor:not-allowed;transform:none;box-shadow:none}
        .btn-outline{width:100%;background:none;border:1.5px solid var(--c-slate-200);border-radius:13px;padding:14px;font-size:14px;font-weight:700;color:var(--c-slate-600);font-family:'Nunito',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s;margin-top:10px}
        .btn-outline:hover{border-color:var(--c-blue-400);color:var(--c-blue-600);background:rgba(37,99,235,0.04)}
        .btn-outline:disabled{opacity:0.5;cursor:not-allowed}
        .spin{width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:rot 0.65s linear infinite}
        .spin-dark{width:16px;height:16px;border:2px solid rgba(0,0,0,0.1);border-top-color:var(--c-blue-600);border-radius:50%;animation:rot 0.65s linear infinite}
        @keyframes rot{to{transform:rotate(360deg)}}
        .secure{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:14px}
        .secure-txt{font-size:11.5px;color:var(--c-slate-400);font-weight:400}
        .countdown-row{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:8px;font-size:12.5px;color:var(--c-slate-400)}
        .countdown-num{font-weight:700;color:var(--c-blue-600)}
        .resent-toast{display:flex;align-items:center;gap:8px;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.25);border-radius:10px;padding:10px 14px;width:100%;margin-bottom:10px;animation:fadeIn 0.3s ease}
        .resent-toast-txt{font-size:13px;font-weight:600;color:#34d399}
        .divider{display:flex;align-items:center;gap:14px;margin:24px 0;width:100%}
        .divider-line{flex:1;height:1px;background:var(--c-slate-200)}.divider-txt{font-size:12px;color:var(--c-slate-400);white-space:nowrap}
        .row-login{text-align:center;width:100%}.btn-login{background:none;border:none;cursor:pointer;font-size:13.5px;font-weight:700;color:var(--c-blue-600);font-family:'Nunito',sans-serif;transition:color 0.2s}
        .btn-login:hover{color:var(--c-teal-500)}
        /* Verifying spinner */
        .verifying-box{display:flex;flex-direction:column;align-items:center;gap:20px;padding:60px 0;animation:fadeIn 0.4s ease}
        @keyframes fadeIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
        .verify-spinner-wrap{width:88px;height:88px;position:relative;display:flex;align-items:center;justify-content:center}
        .verify-ring{position:absolute;inset:0;border-radius:50%;border:3px solid var(--c-slate-100)}
        .verify-ring-spin{position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:var(--c-blue-600);border-right-color:var(--c-teal-500);animation:rot 1s linear infinite}
        .verify-inner{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,rgba(29,78,216,0.08),rgba(6,182,212,0.08));display:flex;align-items:center;justify-content:center;color:var(--c-blue-600)}
        .verifying-title{font-family:'Lexend',sans-serif;font-size:18px;font-weight:800;color:var(--c-slate-900);text-align:center}
        .verifying-sub{font-size:13.5px;color:var(--c-slate-400);text-align:center;line-height:1.6}
        .dots-anim::after{content:'';animation:dots 1.4s steps(3,end) infinite}
        @keyframes dots{0%{content:''}33%{content:'.'}66%{content:'..'}100%{content:'...'}}
        /* State box */
        .state-box{display:flex;flex-direction:column;align-items:center;gap:0;animation:fadeIn 0.45s ease}
        .state-ico-wrap{width:88px;height:88px;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;margin-bottom:24px}
        .state-ico-wrap::before{content:'';position:absolute;inset:-7px;border-radius:50%;border:1.5px dashed rgba(6,182,212,0.22);animation:spin-slow 12s linear infinite}
        @keyframes spin-slow{to{transform:rotate(360deg)}}
        .state-ico-wrap.success{background:linear-gradient(135deg,rgba(29,78,216,0.08),rgba(6,182,212,0.1));border:2px solid rgba(6,182,212,0.18)}
        .state-ico-wrap.error{background:rgba(248,113,113,0.06);border:2px solid rgba(248,113,113,0.18)}
        .state-ico-inner{width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(37,99,235,0.25)}
        .state-ico-inner.success{background:linear-gradient(135deg,var(--c-blue-700),var(--c-teal-500));color:white}
        .state-ico-inner.error{background:linear-gradient(135deg,#ef4444,#f87171);color:white;box-shadow:0 8px 24px rgba(248,113,113,0.3)}
        .state-eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.8px;margin-bottom:8px}
        .state-eyebrow.success{color:var(--c-teal-500)}.state-eyebrow.error{color:var(--c-red)}
        .state-title{font-family:'Lexend',sans-serif;font-size:24px;font-weight:800;color:var(--c-slate-900);letter-spacing:-0.5px;margin-bottom:10px;text-align:center}
        .state-sub{font-size:14px;color:var(--c-slate-400);line-height:1.7;max-width:320px;text-align:center;font-weight:400;margin-bottom:28px}
        .email-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(37,99,235,0.06);border:1.5px solid rgba(37,99,235,0.14);border-radius:100px;padding:8px 18px;margin-bottom:28px}
        .email-pill-txt{font-size:13.5px;font-weight:700;color:var(--c-blue-700)}
        .check-list{width:100%;display:flex;flex-direction:column;gap:10px;margin-bottom:28px}
        .check-item{display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--c-slate-50);border:1px solid var(--c-slate-200);border-radius:12px}
        .check-item-dot{width:28px;height:28px;flex-shrink:0;border-radius:8px;background:linear-gradient(135deg,var(--c-blue-600),var(--c-teal-500));display:flex;align-items:center;justify-content:center;color:white;font-size:13px}
        .check-item-txt{font-size:13px;font-weight:600;color:var(--c-slate-700)}
        .check-item-sub{font-size:11.5px;color:var(--c-slate-400);font-weight:400;margin-top:1px}
      `}</style>

      {/* ── VERIFICANDO ── */}
      {status === "verifying" && (
        <div className="verifying-box">
          <div className="verify-spinner-wrap">
            <div className="verify-ring"/><div className="verify-ring-spin"/>
            <div className="verify-inner"><IconMail /></div>
          </div>
          <p className="f-eyebrow">Verificando enlace</p>
          <h2 className="verifying-title">Validando tu correo<span className="dots-anim"/></h2>
          <p className="verifying-sub">Estamos verificando tu enlace de activación.<br/>Esto solo tardará un momento.</p>
        </div>
      )}

      {/* ── ÉXITO ── */}
      {status === "success" && (
        <div className="state-box">
          <div className="state-ico-wrap success"><div className="state-ico-inner success"><IconCheckBig /></div></div>
          <p className="state-eyebrow success">Verificación completada</p>
          <h2 className="state-title">¡Correo verificado!</h2>
          <p className="state-sub">Tu cuenta en Catalogix está activa.<br/>Ya puedes comenzar a usar todas las funciones.</p>
          {email && (<div className="email-pill"><IconMailSm /><span className="email-pill-txt">{email}</span></div>)}
          <div className="check-list">
            {[
              {ico:"🛍️",txt:"Explora los catálogos disponibles",sub:"Descubre productos de múltiples vendedores"},
              {ico:"🛒",txt:"Agrega productos a tu carrito",sub:"Compra con Stripe, PayPal y más"},
              {ico:"📦",txt:"Seguimiento de tus pedidos en tiempo real",sub:"Recibe notificaciones de cada estado"},
            ].map(s=>(<div className="check-item" key={s.txt}><div className="check-item-dot">{s.ico}</div><div><div className="check-item-txt">{s.txt}</div><div className="check-item-sub">{s.sub}</div></div></div>))}
          </div>
          <button className="btn-submit" onClick={() => navigate("/login")}>Ir al inicio de sesión <IconArrowRight /></button>
          <div className="secure"><IconShield style={{color:"var(--c-slate-400)"}}/><span className="secure-txt">Tu cuenta está protegida con cifrado SSL</span></div>
        </div>
      )}

      {/* ── ERROR ── */}
      {status === "error" && (
        <div className="state-box">
          <div className="state-ico-wrap error"><div className="state-ico-inner error"><IconAlertBig /></div></div>
          <p className="state-eyebrow error">Enlace inválido</p>
          <h2 className="state-title">No pudimos verificarte</h2>
          <p className="state-sub">El enlace de verificación ha expirado o ya fue utilizado. Solicita uno nuevo ingresando tu correo.</p>
          <div className="f-group">
            <label className="f-label">Tu correo electrónico</label>
            <div className="f-wrap">
              <span className="f-icon" style={{color:"var(--c-slate-300)"}}><IconMailSm /></span>
              <input type="email" className="f-input" placeholder="correo@empresa.com"
                value={resendEmail} onChange={e => setResendEmail(e.target.value)} disabled={resending} />
            </div>
          </div>
          {resent && (<div className="resent-toast"><span style={{color:"#34d399",display:"flex"}}><IconCheck /></span><span className="resent-toast-txt">Nuevo enlace enviado a tu correo</span></div>)}
          <button className="btn-submit" onClick={handleResend} disabled={resending || !resendEmail}>
            {resending?<><span className="spin"/>Enviando...</>:"Reenviar enlace de verificación"}
          </button>
          <button className="btn-outline" onClick={() => navigate("/login")}>Volver al inicio de sesión</button>
        </div>
      )}

      {/* ── PENDIENTE ── */}
      {status === "pending" && (
        <div className="state-box">
          <div className="state-ico-wrap success"><div className="state-ico-inner success"><IconMail /></div></div>
          <p className="state-eyebrow success">Revisa tu correo</p>
          <h2 className="state-title">Confirma tu cuenta</h2>
          <p className="state-sub">Enviamos un enlace de verificación a tu correo. Ábrelo para activar tu cuenta en Catalogix.</p>
          <div className="check-list">
            {[
              {ico:"📬",txt:"Abre el correo de Catalogix",sub:"Puede tardar hasta 2 minutos en llegar"},
              {ico:"🔗",txt:"Haz clic en «Verificar mi correo»",sub:"El enlace es válido por 24 horas"},
              {ico:"🎉",txt:"¡Tu cuenta queda activa al instante!",sub:"Sin pasos adicionales"},
            ].map(s=>(<div className="check-item" key={s.txt}><div className="check-item-dot">{s.ico}</div><div><div className="check-item-txt">{s.txt}</div><div className="check-item-sub">{s.sub}</div></div></div>))}
          </div>
          {resent && (<div className="resent-toast"><span style={{color:"#34d399",display:"flex"}}><IconCheck /></span><span className="resent-toast-txt">Correo reenviado exitosamente</span></div>)}
          <button className="btn-outline" onClick={handleResend} disabled={resending || !canResend} style={{marginTop:0}}>
            {resending?<><span className="spin-dark"/>Reenviando...</>:<><IconRefresh/>Reenviar correo de verificación</>}
          </button>
          {!canResend && !resending && (
            <div className="countdown-row"><IconClock /><span>Reenviar disponible en</span><span className="countdown-num">{countdown}s</span></div>
          )}
          <div className="divider"><div className="divider-line"/><span className="divider-txt">¿Correo equivocado?</span><div className="divider-line"/></div>
          <div className="row-login"><button className="btn-login" onClick={() => navigate("/register")}>Volver a registrarse →</button></div>
        </div>
      )}
    </>
  );
}