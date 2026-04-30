import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/odoo/authService";

const IconMail     = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const IconAlert    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconShield   = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
const IconCheck    = () => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconRefresh  = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);
const IconArrowLeft= () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>);

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [resent, setResent]   = useState(false);
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!email.trim())                { setError("El correo es obligatorio"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Ingresa un correo válido"); return; }
    setLoading(true);
    try {
      const data = await authService.forgotPassword(email);
      setResetUrl(data?.reset_url || "");
      setSuccess(true);
    }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResent(false); setLoading(true);
    try {
      const data = await authService.forgotPassword(email);
      setResetUrl(data?.reset_url || resetUrl);
      setResent(true);
    }
    catch {/* silencioso */}
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        .f-eyebrow{font-size:11px;font-weight:700;color:var(--c-teal-500);text-transform:uppercase;letter-spacing:1.8px;margin-bottom:9px}
        .f-title{font-family:'Lexend',sans-serif;font-size:27px;font-weight:800;color:var(--c-slate-900);letter-spacing:-0.6px;line-height:1.15;margin-bottom:8px}
        .f-sub{font-size:13.5px;font-weight:400;color:var(--c-slate-400);line-height:1.5}
        .f-rule{width:44px;height:3.5px;background:linear-gradient(90deg,var(--c-blue-600),var(--c-teal-500));border-radius:100px;margin:16px 0 28px}
        .f-head{margin-bottom:34px}
        .f-group{margin-bottom:18px}
        .f-label{display:block;font-size:11px;font-weight:700;color:var(--c-slate-500);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:7px}
        .f-wrap{position:relative}
        .f-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--c-slate-300);pointer-events:none;display:flex;align-items:center;transition:color 0.2s}
        .f-input{width:100%;background:var(--c-slate-50);border:1.5px solid var(--c-slate-200);border-radius:13px;padding:13.5px 14px 13.5px 42px;font-size:14px;font-weight:500;color:var(--c-slate-900);font-family:'Nunito',sans-serif;outline:none;transition:all 0.22s}
        .f-input::placeholder{color:var(--c-slate-300);font-weight:400}
        .f-input:focus{border-color:var(--c-blue-600);background:var(--c-white);box-shadow:0 0 0 4px rgba(37,99,235,0.09)}
        .f-wrap:focus-within .f-icon{color:var(--c-blue-600)}
        .f-hint{display:flex;align-items:flex-start;gap:7px;margin-top:8px}
        .f-hint-ico{color:var(--c-slate-400);flex-shrink:0;margin-top:1px}
        .f-hint-txt{font-size:12px;color:var(--c-slate-400);line-height:1.5}
        .err-box{display:flex;align-items:center;gap:9px;background:var(--c-red-bg);border:1px solid var(--c-red-bdr);border-radius:11px;padding:11px 14px;margin-bottom:18px;animation:shake 0.38s ease}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
        .err-txt{font-size:13px;font-weight:600;color:var(--c-red)}
        .btn-submit{width:100%;background:linear-gradient(135deg,var(--c-blue-700),var(--c-blue-600),#0284c7);border:none;border-radius:13px;padding:15px;font-size:15px;font-weight:700;color:var(--c-white);font-family:'Nunito',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;transition:all 0.25s;box-shadow:0 4px 18px rgba(29,78,216,0.32)}
        .btn-submit:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(29,78,216,0.42)}
        .btn-submit:disabled{opacity:0.6;cursor:not-allowed;transform:none;box-shadow:none}
        .spin{width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:rot 0.65s linear infinite}
        @keyframes rot{to{transform:rotate(360deg)}}
        .secure{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:12px}
        .secure-txt{font-size:11.5px;color:var(--c-slate-400);font-weight:400}
        .btn-back{background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;color:var(--c-slate-400);font-family:'Nunito',sans-serif;display:flex;align-items:center;gap:6px;padding:0;margin-bottom:28px;transition:color 0.2s}
        .btn-back:hover{color:var(--c-blue-600)}
        .divider{display:flex;align-items:center;gap:14px;margin:28px 0}
        .divider-line{flex:1;height:1px;background:var(--c-slate-200)}.divider-txt{font-size:12px;color:var(--c-slate-400);white-space:nowrap}
        .row-login{text-align:center}.btn-login{background:none;border:none;cursor:pointer;font-size:13.5px;font-weight:700;color:var(--c-blue-600);font-family:'Nunito',sans-serif;transition:color 0.2s}
        .btn-login:hover{color:var(--c-teal-500)}
        /* Success */
        .success-box{display:flex;flex-direction:column;align-items:center;gap:16px;animation:fadeUp 0.4s ease}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .success-ico-wrap{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,rgba(29,78,216,0.08),rgba(6,182,212,0.1));border:2px solid rgba(6,182,212,0.18);display:flex;align-items:center;justify-content:center}
        .success-ico-inner{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--c-blue-700),var(--c-teal-500));display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 8px 24px rgba(37,99,235,0.3)}
        .success-eyebrow{font-size:11px;font-weight:700;color:var(--c-teal-500);text-transform:uppercase;letter-spacing:1.8px}
        .success-title{font-family:'Lexend',sans-serif;font-size:24px;font-weight:800;color:var(--c-slate-900);letter-spacing:-0.5px;text-align:center}
        .success-sub{font-size:13.5px;color:var(--c-slate-400);text-align:center;line-height:1.6}
        .success-email-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(37,99,235,0.06);border:1.5px solid rgba(37,99,235,0.14);border-radius:100px;padding:8px 18px}
        .success-email-txt{font-size:13.5px;font-weight:700;color:var(--c-blue-700)}
        .success-steps{width:100%;display:flex;flex-direction:column;gap:10px}
        .success-step{display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--c-slate-50);border:1px solid var(--c-slate-200);border-radius:12px}
        .success-step-ico{width:28px;height:28px;flex-shrink:0;border-radius:8px;background:linear-gradient(135deg,var(--c-blue-600),var(--c-teal-500));display:flex;align-items:center;justify-content:center;font-size:13px}
        .success-step-txt{font-size:13px;font-weight:600;color:var(--c-slate-700)}
        .success-step-sub{font-size:11.5px;color:var(--c-slate-400);font-weight:400;margin-top:1px}
        .resent-toast{display:flex;align-items:center;gap:8px;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.25);border-radius:10px;padding:10px 14px;animation:fadeUp 0.3s ease}
        .resent-toast-txt{font-size:13px;font-weight:600;color:#34d399}
        .btn-resend{background:none;border:1.5px solid var(--c-slate-200);border-radius:13px;padding:13px;font-size:14px;font-weight:700;color:var(--c-slate-600);font-family:'Nunito',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s;width:100%}
        .btn-resend:hover{border-color:var(--c-blue-400);color:var(--c-blue-600);background:rgba(37,99,235,0.04)}
        .btn-resend:disabled{opacity:0.5;cursor:not-allowed}
      `}</style>

      {success ? (
        <div className="success-box">
          <div className="success-ico-wrap">
            <div className="success-ico-inner"><IconMail /></div>
          </div>
          <p className="success-eyebrow">Correo enviado</p>
          <h2 className="success-title">Revisa tu bandeja</h2>
          <p className="success-sub">Enviamos el enlace de recuperación a:</p>
          <div className="success-email-pill">
            <IconMail />
            <span className="success-email-txt">{email}</span>
          </div>
          <div className="success-steps">
            {[
              { ico:"📬", txt:"Abre el correo de Catalogix",       sub:"Puede tardar hasta 2 minutos en llegar" },
              { ico:"🔗", txt:"Haz clic en el enlace de recuperación", sub:"El enlace es válido por 24 horas" },
              { ico:"🔑", txt:"Crea tu nueva contraseña",           sub:"Elige una contraseña segura y memorable" },
            ].map(s => (
              <div className="success-step" key={s.txt}>
                <div className="success-step-ico">{s.ico}</div>
                <div>
                  <div className="success-step-txt">{s.txt}</div>
                  <div className="success-step-sub">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
          {resetUrl && (
            <div className="success-step" style={{width:"100%"}}>
              <div>
                <div className="success-step-txt">Modo desarrollo: enlace directo</div>
                <a href={resetUrl} className="btn-login" style={{fontSize:12}}>
                  Abrir enlace de recuperacion
                </a>
              </div>
            </div>
          )}
          {resent && (
            <div className="resent-toast" style={{width:"100%"}}>
              <span style={{color:"#34d399",display:"flex"}}><IconCheck /></span>
              <span className="resent-toast-txt">Correo reenviado exitosamente</span>
            </div>
          )}
          <button className="btn-resend" onClick={handleResend} disabled={loading}>
            {loading ? <><span className="spin" style={{borderColor:"rgba(0,0,0,0.15)",borderTopColor:"var(--c-blue-600)"}}/>Reenviando...</> : <><IconRefresh />Reenviar correo</>}
          </button>
          <div className="divider" style={{width:"100%"}}>
            <div className="divider-line"/><span className="divider-txt">¿Ya recuperaste el acceso?</span><div className="divider-line"/>
          </div>
          <div className="row-login">
            <button className="btn-login" onClick={() => { setSuccess(false); setEmail(""); setResent(false); }}>
              Iniciar sesión →
            </button>
          </div>
        </div>
      ) : (
        <>
          <button className="btn-back" type="button" onClick={() => navigate("/login")}>
            <IconArrowLeft />Volver al inicio de sesión
          </button>
          <div className="f-head">
            <p className="f-eyebrow">Recuperar contraseña</p>
            <h2 className="f-title">¿Olvidaste tu clave?</h2>
            <div className="f-rule" />
            <p className="f-sub">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="err-box"><IconAlert /><span className="err-txt">{error}</span></div>}
            <div className="f-group">
              <label className="f-label">Correo electrónico</label>
              <div className="f-wrap">
                <span className="f-icon"><IconMail /></span>
                <input type="email" className="f-input" placeholder="correo@empresa.com"
                  value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                  autoComplete="email" autoFocus disabled={loading} />
              </div>
              <div className="f-hint">
                <span className="f-hint-ico"><IconShield /></span>
                <span className="f-hint-txt">Usa el correo registrado en tu cuenta de Catalogix.</span>
              </div>
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? <><span className="spin"/>Enviando enlace...</> : "Enviar enlace de recuperación"}
            </button>
            <div className="secure">
              <IconShield style={{color:"var(--c-slate-400)"}}/><span className="secure-txt">El enlace es seguro y expira en 24 horas</span>
            </div>
          </form>
          <div className="divider"><div className="divider-line"/><span className="divider-txt">¿No tienes cuenta?</span><div className="divider-line"/></div>
          <div className="row-login"><button className="btn-login" onClick={() => navigate("/register")}>Crea cuenta gratis →</button></div>
        </>
      )}
    </>
  );
}
