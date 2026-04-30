import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import authService from "../../services/odoo/authService";

const IconLock     = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IconLockBig  = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IconEye      = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const IconEyeOff   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const IconCheck    = () => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconCheckBig = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconAlert    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconAlertBig = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconShield   = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
const IconArrowRight=() => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);

const checkPassword = (pwd) => ({ length: pwd.length >= 8, uppercase: /[A-Z]/.test(pwd), number: /[0-9]/.test(pwd) });

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [tokenStatus, setTokenStatus] = useState("validating");
  const [userEmail, setUserEmail]     = useState("");
  const [form, setForm]               = useState({ password:"", confirm:"" });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);

  useEffect(() => {
    if (!token) { setTokenStatus("invalid"); return; }
    authService.validateResetToken(token)
      .then(res => { setUserEmail(res.email); setTokenStatus("valid"); })
      .catch(() => setTokenStatus("invalid"));
  }, [token]);

  const pwdCheck  = checkPassword(form.password);
  const pwdStrong = pwdCheck.length && pwdCheck.uppercase && pwdCheck.number;
  const update    = (f) => (e) => { setForm(p => ({ ...p, [f]: e.target.value })); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!form.password)                 { setError("La contraseña es obligatoria"); return; }
    if (!pwdStrong)                     { setError("La contraseña no cumple los requisitos mínimos"); return; }
    if (form.password !== form.confirm) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true);
    try { await authService.resetPassword(token, form.password); setSuccess(true); }
    catch (err) { setError(err.message || "Ocurrió un error. Intenta de nuevo."); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        .f-eyebrow{font-size:11px;font-weight:700;color:var(--c-teal-500);text-transform:uppercase;letter-spacing:1.8px;margin-bottom:9px}
        .f-title{font-family:'Lexend',sans-serif;font-size:27px;font-weight:800;color:var(--c-slate-900);letter-spacing:-0.6px;line-height:1.15;margin-bottom:8px}
        .f-sub{font-size:13.5px;font-weight:400;color:var(--c-slate-400);line-height:1.5}
        .f-rule{width:44px;height:3.5px;background:linear-gradient(90deg,var(--c-blue-600),var(--c-teal-500));border-radius:100px;margin:16px 0 28px}
        .f-group{margin-bottom:18px}
        .f-label{display:block;font-size:11px;font-weight:700;color:var(--c-slate-500);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:7px}
        .f-wrap{position:relative}
        .f-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--c-slate-300);pointer-events:none;display:flex;align-items:center;transition:color 0.2s}
        .f-input{width:100%;background:var(--c-slate-50);border:1.5px solid var(--c-slate-200);border-radius:13px;padding:13.5px 14px 13.5px 42px;font-size:14px;font-weight:500;color:var(--c-slate-900);font-family:'Nunito',sans-serif;outline:none;transition:all 0.22s}
        .f-input::placeholder{color:var(--c-slate-300);font-weight:400}
        .f-input:focus{border-color:var(--c-blue-600);background:var(--c-white);box-shadow:0 0 0 4px rgba(37,99,235,0.09)}
        .f-wrap:focus-within .f-icon{color:var(--c-blue-600)}
        .f-input.err{border-color:var(--c-red);background:var(--c-red-bg);box-shadow:0 0 0 3px var(--c-red-bg)}
        .f-eye{position:absolute;right:13px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--c-slate-300);padding:4px;display:flex;align-items:center;transition:color 0.2s;border-radius:6px}
        .f-eye:hover{color:var(--c-blue-600)}
        .pwd-strength{margin-top:10px;display:flex;flex-direction:column;gap:6px}
        .pwd-bars{display:flex;gap:4px}.pwd-bar{flex:1;height:3px;border-radius:100px;background:var(--c-slate-200);transition:background 0.3s}
        .pwd-bar.filled{background:linear-gradient(90deg,var(--c-blue-600),var(--c-teal-500))}
        .pwd-rules{display:flex;flex-wrap:wrap;gap:6px}
        .pwd-rule{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:500;color:var(--c-slate-400);transition:color 0.2s}.pwd-rule.ok{color:var(--c-teal-500)}
        .pwd-rule-dot{width:14px;height:14px;border-radius:50%;background:var(--c-slate-200);display:flex;align-items:center;justify-content:center;transition:background 0.2s;flex-shrink:0}
        .pwd-rule.ok .pwd-rule-dot{background:linear-gradient(135deg,var(--c-blue-600),var(--c-teal-500));color:white}
        .err-box{display:flex;align-items:center;gap:9px;background:var(--c-red-bg);border:1px solid var(--c-red-bdr);border-radius:11px;padding:11px 14px;margin-bottom:18px;animation:shake 0.38s ease}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
        .err-txt{font-size:13px;font-weight:600;color:var(--c-red)}
        .btn-submit{width:100%;background:linear-gradient(135deg,var(--c-blue-700),var(--c-blue-600),#0284c7);border:none;border-radius:13px;padding:15px;font-size:15px;font-weight:700;color:var(--c-white);font-family:'Nunito',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;transition:all 0.25s;box-shadow:0 4px 18px rgba(29,78,216,0.32);margin-top:8px}
        .btn-submit:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(29,78,216,0.42)}
        .btn-submit:disabled{opacity:0.6;cursor:not-allowed;transform:none;box-shadow:none}
        .spin{width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:rot 0.65s linear infinite}
        @keyframes rot{to{transform:rotate(360deg)}}
        .secure{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:12px}
        .secure-txt{font-size:11.5px;color:var(--c-slate-400);font-weight:400}
        .header-email-pill{display:inline-flex;align-items:center;gap:7px;background:rgba(37,99,235,0.06);border:1.5px solid rgba(37,99,235,0.14);border-radius:100px;padding:6px 14px}
        .header-email-txt{font-size:13px;font-weight:700;color:var(--c-blue-700)}
        /* Validating */
        .validating-box{display:flex;flex-direction:column;align-items:center;gap:20px;padding:60px 0;animation:fadeIn 0.4s ease}
        @keyframes fadeIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
        .val-spinner-wrap{width:88px;height:88px;position:relative;display:flex;align-items:center;justify-content:center}
        .val-ring{position:absolute;inset:0;border-radius:50%;border:3px solid var(--c-slate-100)}
        .val-ring-spin{position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:var(--c-blue-600);border-right-color:var(--c-teal-500);animation:rot 1s linear infinite}
        .val-inner{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,rgba(29,78,216,0.08),rgba(6,182,212,0.08));display:flex;align-items:center;justify-content:center;color:var(--c-blue-600)}
        .val-title{font-family:'Lexend',sans-serif;font-size:18px;font-weight:800;color:var(--c-slate-900);text-align:center}
        .val-sub{font-size:13.5px;color:var(--c-slate-400);text-align:center}
        .dots-anim::after{content:'';animation:dots 1.4s steps(3,end) infinite}
        @keyframes dots{0%{content:''}33%{content:'.'}66%{content:'..'}100%{content:'...'}}
        /* State box */
        .state-box{display:flex;flex-direction:column;align-items:center;gap:0;animation:fadeIn 0.45s ease}
        .state-ico-wrap{width:88px;height:88px;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;margin-bottom:24px}
        .state-ico-wrap::before{content:'';position:absolute;inset:-7px;border-radius:50%;border:1.5px dashed rgba(6,182,212,0.22);animation:spin-slow 12s linear infinite}
        @keyframes spin-slow{to{transform:rotate(360deg)}}
        .state-ico-wrap.success{background:linear-gradient(135deg,rgba(29,78,216,0.08),rgba(6,182,212,0.1));border:2px solid rgba(6,182,212,0.18)}
        .state-ico-wrap.error{background:rgba(248,113,113,0.06);border:2px solid rgba(248,113,113,0.18)}
        .state-ico-inner{width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center}
        .state-ico-inner.success{background:linear-gradient(135deg,var(--c-blue-700),var(--c-teal-500));color:white;box-shadow:0 8px 24px rgba(37,99,235,0.3)}
        .state-ico-inner.error{background:linear-gradient(135deg,#ef4444,#f87171);color:white;box-shadow:0 8px 24px rgba(248,113,113,0.3)}
        .state-eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.8px;margin-bottom:8px}
        .state-eyebrow.success{color:var(--c-teal-500)}.state-eyebrow.error{color:var(--c-red)}
        .state-title{font-family:'Lexend',sans-serif;font-size:24px;font-weight:800;color:var(--c-slate-900);letter-spacing:-0.5px;margin-bottom:10px;text-align:center}
        .state-sub{font-size:14px;color:var(--c-slate-400);line-height:1.7;max-width:320px;text-align:center;font-weight:400;margin-bottom:28px}
        .divider{display:flex;align-items:center;gap:14px;margin:24px 0;width:100%}
        .divider-line{flex:1;height:1px;background:var(--c-slate-200)}.divider-txt{font-size:12px;color:var(--c-slate-400);white-space:nowrap}
        .row-login{text-align:center;width:100%}.btn-login{background:none;border:none;cursor:pointer;font-size:13.5px;font-weight:700;color:var(--c-blue-600);font-family:'Nunito',sans-serif;transition:color 0.2s}
        .btn-login:hover{color:var(--c-teal-500)}
      `}</style>

      {tokenStatus === "validating" && (
        <div className="validating-box">
          <div className="val-spinner-wrap">
            <div className="val-ring"/><div className="val-ring-spin"/>
            <div className="val-inner"><IconLockBig /></div>
          </div>
          <p className="f-eyebrow">Verificando enlace</p>
          <h2 className="val-title">Validando tu solicitud<span className="dots-anim"/></h2>
          <p className="val-sub">Solo tomará un momento.</p>
        </div>
      )}

      {tokenStatus === "invalid" && (
        <div className="state-box">
          <div className="state-ico-wrap error"><div className="state-ico-inner error"><IconAlertBig /></div></div>
          <p className="state-eyebrow error">Enlace inválido</p>
          <h2 className="state-title">El enlace ha expirado</h2>
          <p className="state-sub">Este enlace ya no es válido. Los enlaces expiran después de 24 horas por seguridad. Solicita uno nuevo desde la página de recuperación.</p>
          <button className="btn-submit" onClick={() => navigate("/forgot-password")}>
            Solicitar nuevo enlace <IconArrowRight />
          </button>
          <div className="divider" style={{marginTop:20}}><div className="divider-line"/><span className="divider-txt">¿Ya lo recuerdas?</span><div className="divider-line"/></div>
          <div className="row-login"><button className="btn-login" onClick={() => navigate("/login")}>Iniciar sesión →</button></div>
        </div>
      )}

      {tokenStatus === "valid" && !success && (
        <>
          <div style={{marginBottom:28}}>
            <p className="f-eyebrow">Restablecer contraseña</p>
            <h2 className="f-title">Nueva contraseña</h2>
            <div className="f-rule" />
            <p className="f-sub">Elige una contraseña segura para tu cuenta.</p>
            {userEmail && (
              <div className="header-email-pill" style={{marginTop:16}}>
                <IconShield style={{color:"var(--c-blue-600)"}}/>
                <span className="header-email-txt">{userEmail}</span>
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="err-box"><IconAlert /><span className="err-txt">{error}</span></div>}
            <div className="f-group">
              <label className="f-label">Nueva contraseña</label>
              <div className="f-wrap">
                <span className="f-icon"><IconLock /></span>
                <input type={showPass?"text":"password"} className="f-input" placeholder="Mínimo 8 caracteres"
                  value={form.password} onChange={update("password")} autoComplete="new-password" disabled={loading} autoFocus />
                <button type="button" className="f-eye" onClick={() => setShowPass(p=>!p)} tabIndex={-1}>{showPass?<IconEyeOff/>:<IconEye/>}</button>
              </div>
              {form.password && (
                <div className="pwd-strength">
                  <div className="pwd-bars">{[pwdCheck.length,pwdCheck.uppercase,pwdCheck.number].map((ok,i)=>(<div key={i} className={`pwd-bar${ok?" filled":""}`}/>))}</div>
                  <div className="pwd-rules">{[{key:"length",label:"8+ caracteres"},{key:"uppercase",label:"Mayúscula"},{key:"number",label:"Número"}].map(r=>(<span key={r.key} className={`pwd-rule${pwdCheck[r.key]?" ok":""}`}><span className="pwd-rule-dot">{pwdCheck[r.key]&&<IconCheck/>}</span>{r.label}</span>))}</div>
                </div>
              )}
            </div>
            <div className="f-group">
              <label className="f-label">Confirmar contraseña</label>
              <div className="f-wrap">
                <span className="f-icon"><IconLock /></span>
                <input type={showConfirm?"text":"password"} className={`f-input${form.confirm&&form.confirm!==form.password?" err":""}`}
                  placeholder="Repite la contraseña" value={form.confirm} onChange={update("confirm")} autoComplete="new-password" disabled={loading} />
                <button type="button" className="f-eye" onClick={() => setShowConfirm(p=>!p)} tabIndex={-1}>{showConfirm?<IconEyeOff/>:<IconEye/>}</button>
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p style={{fontSize:12,color:"var(--c-red)",marginTop:6,fontWeight:600}}>Las contraseñas no coinciden</p>
              )}
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading?<><span className="spin"/>Guardando contraseña...</>:"Guardar nueva contraseña"}
            </button>
            <div className="secure"><IconShield style={{color:"var(--c-slate-400)"}}/><span className="secure-txt">Tu contraseña se guarda con cifrado seguro</span></div>
          </form>
        </>
      )}

      {success && (
        <div className="state-box">
          <div className="state-ico-wrap success"><div className="state-ico-inner success"><IconCheckBig /></div></div>
          <p className="state-eyebrow success">¡Listo!</p>
          <h2 className="state-title">Contraseña actualizada</h2>
          <p className="state-sub">Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva clave.</p>
          <button className="btn-submit" onClick={() => navigate("/login")} style={{marginTop:0}}>
            Ir al inicio de sesión <IconArrowRight />
          </button>
          <div className="secure" style={{marginTop:14}}><IconShield style={{color:"var(--c-slate-400)"}}/><span className="secure-txt">Tu cuenta está segura y protegida</span></div>
        </div>
      )}
    </>
  );
}
