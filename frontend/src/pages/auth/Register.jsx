import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/odoo/authService";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";

const IconUser     = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconMail     = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const IconPhone    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const IconLock     = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IconEye      = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const IconEyeOff   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const IconAlert    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconShield   = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
const IconCheck    = () => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconBuilding = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>);

const checkPassword = (pwd) => ({ length: pwd.length >= 8, uppercase: /[A-Z]/.test(pwd), number: /[0-9]/.test(pwd) });

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", phone:"", company:"", password:"", confirm:"", role:"customer" });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);
  const [agreed, setAgreed]           = useState(false);

  const pwdCheck  = checkPassword(form.password);
  const pwdStrong = pwdCheck.length && pwdCheck.uppercase && pwdCheck.number;
  const update    = (f) => (e) => { setForm(p => ({ ...p, [f]: e.target.value })); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!form.name.trim())                    { setError("El nombre es obligatorio"); return; }
    if (!form.email.trim())                   { setError("El correo es obligatorio"); return; }
    if (!/\S+@\S+\.\S+/.test(form.email))     { setError("Ingresa un correo válido"); return; }
    if (!form.password)                       { setError("La contraseña es obligatoria"); return; }
    if (!pwdStrong)                           { setError("La contraseña no cumple los requisitos"); return; }
    if (form.password !== form.confirm)       { setError("Las contraseñas no coinciden"); return; }
    if (!agreed)                              { setError("Debes aceptar los términos y condiciones"); return; }
    setLoading(true);
    try {
      const result = await authService.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone,
        company: form.company,
      });
      const loggedUser = await authService.login(form.email, form.password);
      const role = loggedUser?.role || result?.user?.role || form.role;
      const target = role === "vendor" ? "/vendor/dashboard" : "/home";
      setSuccess(true);
      navigate(target);
    }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        .f-head{margin-bottom:20px}
        .f-eyebrow{font-size:11px;font-weight:700;color:var(--c-teal-500);text-transform:uppercase;letter-spacing:1.8px;margin-bottom:9px}
        .f-title{font-family:'Lexend',sans-serif;font-size:26px;font-weight:800;color:var(--c-slate-900);letter-spacing:-0.6px;line-height:1.15;margin-bottom:8px}
        .f-sub{font-size:13px;font-weight:400;color:var(--c-slate-400);line-height:1.5}
        .f-rule{width:44px;height:3.5px;background:linear-gradient(90deg,var(--c-blue-600),var(--c-teal-500));border-radius:100px;margin:14px 0 20px}
        .role-tabs{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
        .role-tab{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;border-radius:14px;border:1.5px solid var(--c-slate-200);background:var(--c-slate-50);cursor:pointer;transition:all 0.2s;font-family:'Nunito',sans-serif}
        .role-tab.active{border-color:var(--c-blue-600);background:rgba(37,99,235,0.05);box-shadow:0 0 0 3px rgba(37,99,235,0.09)}
        .role-tab-ico{font-size:20px}.role-tab-name{font-size:13px;font-weight:700;color:var(--c-slate-700)}.role-tab-desc{font-size:10.5px;color:var(--c-slate-400);text-align:center}
        .fields-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:2px}
        .f-full{grid-column:1/-1}.f-group{margin-bottom:0}
        .f-label{display:block;font-size:11px;font-weight:700;color:var(--c-slate-500);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px}
        .f-wrap{position:relative}
        .f-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--c-slate-300);pointer-events:none;display:flex;align-items:center;transition:color 0.2s}
        .f-input{width:100%;background:var(--c-slate-50);border:1.5px solid var(--c-slate-200);border-radius:13px;padding:12px 14px 12px 42px;font-size:13.5px;font-weight:500;color:var(--c-slate-900);font-family:'Nunito',sans-serif;outline:none;transition:all 0.22s}
        .f-input::placeholder{color:var(--c-slate-300);font-weight:400}
        .f-input:focus{border-color:var(--c-blue-600);background:var(--c-white);box-shadow:0 0 0 4px rgba(37,99,235,0.09)}
        .f-wrap:focus-within .f-icon{color:var(--c-blue-600)}
        .f-input.err{border-color:var(--c-red);background:var(--c-red-bg)}
        .f-eye{position:absolute;right:13px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--c-slate-300);padding:4px;display:flex;align-items:center;transition:color 0.2s;border-radius:6px}
        .f-eye:hover{color:var(--c-blue-600)}
        .pwd-strength{margin-top:8px;display:flex;flex-direction:column;gap:6px}
        .pwd-bars{display:flex;gap:4px}.pwd-bar{flex:1;height:3px;border-radius:100px;background:var(--c-slate-200);transition:background 0.3s}
        .pwd-bar.filled{background:linear-gradient(90deg,var(--c-blue-600),var(--c-teal-500))}
        .pwd-rules{display:flex;flex-wrap:wrap;gap:6px}
        .pwd-rule{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:500;color:var(--c-slate-400);transition:color 0.2s}.pwd-rule.ok{color:var(--c-teal-500)}
        .pwd-rule-dot{width:14px;height:14px;border-radius:50%;background:var(--c-slate-200);display:flex;align-items:center;justify-content:center;transition:background 0.2s;flex-shrink:0}
        .pwd-rule.ok .pwd-rule-dot{background:linear-gradient(135deg,var(--c-blue-600),var(--c-teal-500));color:white}
        .err-box{display:flex;align-items:center;gap:9px;background:var(--c-red-bg);border:1px solid var(--c-red-bdr);border-radius:11px;padding:11px 14px;margin-bottom:16px;animation:shake 0.38s ease}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
        .err-txt{font-size:13px;font-weight:600;color:var(--c-red)}
        .success-box{display:flex;flex-direction:column;align-items:center;gap:16px;padding:40px 24px;text-align:center;animation:fadeUp 0.4s ease}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .success-ico{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--c-blue-600),var(--c-teal-500));display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 8px 24px rgba(37,99,235,0.3)}
        .success-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--c-slate-900)}
        .success-sub{font-size:14px;color:var(--c-slate-400);line-height:1.6;max-width:300px}
        .success-btn{background:linear-gradient(135deg,var(--c-blue-700),var(--c-blue-600),#0284c7);border:none;border-radius:13px;padding:13px 32px;font-size:14px;font-weight:700;color:var(--c-white);font-family:'Nunito',sans-serif;cursor:pointer;box-shadow:0 4px 18px rgba(29,78,216,0.32);transition:all 0.2s}
        .success-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(29,78,216,0.4)}
        .terms-row{display:flex;align-items:flex-start;gap:10px;margin-top:16px;margin-bottom:16px}
        .terms-check{width:18px;height:18px;flex-shrink:0;border:1.5px solid var(--c-slate-300);border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;margin-top:1px;background:var(--c-slate-50)}
        .terms-check.checked{background:linear-gradient(135deg,var(--c-blue-600),var(--c-teal-500));border-color:transparent;box-shadow:0 2px 8px rgba(37,99,235,0.3)}
        .terms-txt{font-size:12.5px;color:var(--c-slate-500);line-height:1.5}
        .terms-link{color:var(--c-blue-600);font-weight:600;cursor:pointer;background:none;border:none;font-size:inherit;font-family:inherit}
        .terms-link:hover{color:var(--c-teal-500)}
        .btn-submit{width:100%;background:linear-gradient(135deg,var(--c-blue-700),var(--c-blue-600),#0284c7);border:none;border-radius:13px;padding:14px;font-size:15px;font-weight:700;color:var(--c-white);font-family:'Nunito',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;transition:all 0.25s;box-shadow:0 4px 18px rgba(29,78,216,0.32)}
        .btn-submit:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(29,78,216,0.42)}
        .btn-submit:disabled{opacity:0.6;cursor:not-allowed;transform:none;box-shadow:none}
        .spin{width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:rot 0.65s linear infinite}
        @keyframes rot{to{transform:rotate(360deg)}}
        .secure{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:10px}
        .secure-txt{font-size:11.5px;color:var(--c-slate-400);font-weight:400}
        .gwrap{margin:16px 0 4px}
        .divider{display:flex;align-items:center;gap:14px;margin:20px 0}
        .divider-line{flex:1;height:1px;background:var(--c-slate-200)}.divider-txt{font-size:12px;color:var(--c-slate-400);white-space:nowrap}
        .row-login{text-align:center}.btn-login{background:none;border:none;cursor:pointer;font-size:13.5px;font-weight:700;color:var(--c-blue-600);font-family:'Nunito',sans-serif;transition:color 0.2s}
        .btn-login:hover{color:var(--c-teal-500)}
      `}</style>

      {success ? (
        <div className="success-box">
          <div className="success-ico">✅</div>
          <h2 className="success-title">¡Cuenta creada!</h2>
          <p className="success-sub">Tu cuenta ha sido registrada exitosamente. Revisa tu correo para confirmar tu dirección y activar tu cuenta.</p>
          <button className="success-btn" onClick={() => navigate("/home")}>Ir al inicio →</button>
        </div>
      ) : (
        <>
          <div className="f-head">
            <p className="f-eyebrow">Crear cuenta</p>
            <h2 className="f-title">Únete a Catalogix</h2>
            <div className="f-rule" />
            <p className="f-sub">Completa el formulario para comenzar</p>
          </div>

          <div className="role-tabs">
            {[{val:"customer",ico:"👤",name:"Cliente",desc:"Compra y realiza pedidos"},{val:"vendor",ico:"🏪",name:"Vendedor",desc:"Publica y gestiona catálogos"}].map(r => (
              <button key={r.val} type="button" className={`role-tab${form.role===r.val?" active":""}`}
                onClick={() => setForm(p => ({ ...p, role: r.val }))}>
                <span className="role-tab-ico">{r.ico}</span>
                <span className="role-tab-name">{r.name}</span>
                <span className="role-tab-desc">{r.desc}</span>
              </button>
            ))}
          </div>

          {form.role === "customer" && (
            <>
              <div className="gwrap">
                <GoogleSignInButton
                  role="customer"
                  text="signup_with"
                  onAuthed={() => navigate("/home")}
                  onError={(msg) => setError(msg)}
                />
              </div>
              <div className="divider">
                <div className="divider-line" /><span className="divider-txt">o regístrate con correo</span><div className="divider-line" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="err-box"><IconAlert /><span className="err-txt">{error}</span></div>}
            <div className="fields-grid">
              <div className="f-group f-full"><label className="f-label">Nombre completo</label><div className="f-wrap"><span className="f-icon"><IconUser /></span><input type="text" className="f-input" placeholder="Juan García" value={form.name} onChange={update("name")} autoComplete="name" disabled={loading} /></div></div>
              <div className="f-group f-full"><label className="f-label">Correo electrónico</label><div className="f-wrap"><span className="f-icon"><IconMail /></span><input type="email" className="f-input" placeholder="correo@empresa.com" value={form.email} onChange={update("email")} autoComplete="email" disabled={loading} /></div></div>
              <div className="f-group"><label className="f-label">Teléfono</label><div className="f-wrap"><span className="f-icon"><IconPhone /></span><input type="tel" className="f-input" placeholder="+1 809 000 0000" value={form.phone} onChange={update("phone")} autoComplete="tel" disabled={loading} /></div></div>
              <div className="f-group"><label className="f-label">{form.role==="vendor"?"Empresa / Tienda":"Empresa (opcional)"}</label><div className="f-wrap"><span className="f-icon"><IconBuilding /></span><input type="text" className="f-input" placeholder={form.role==="vendor"?"Mi Tienda S.A.":"Empresa S.A."} value={form.company} onChange={update("company")} disabled={loading} /></div></div>
              <div className="f-group f-full">
                <label className="f-label">Contraseña</label>
                <div className="f-wrap">
                  <span className="f-icon"><IconLock /></span>
                  <input type={showPass?"text":"password"} className="f-input" placeholder="Mínimo 8 caracteres" value={form.password} onChange={update("password")} autoComplete="new-password" disabled={loading} />
                  <button type="button" className="f-eye" onClick={() => setShowPass(p=>!p)} tabIndex={-1}>{showPass?<IconEyeOff />:<IconEye />}</button>
                </div>
                {form.password && (<div className="pwd-strength"><div className="pwd-bars">{[pwdCheck.length,pwdCheck.uppercase,pwdCheck.number].map((ok,i)=>(<div key={i} className={`pwd-bar${ok?" filled":""}`}/>))}</div><div className="pwd-rules">{[{key:"length",label:"8+ caracteres"},{key:"uppercase",label:"Mayúscula"},{key:"number",label:"Número"}].map(r=>(<span key={r.key} className={`pwd-rule${pwdCheck[r.key]?" ok":""}`}><span className="pwd-rule-dot">{pwdCheck[r.key]&&<IconCheck/>}</span>{r.label}</span>))}</div></div>)}
              </div>
              <div className="f-group f-full">
                <label className="f-label">Confirmar contraseña</label>
                <div className="f-wrap">
                  <span className="f-icon"><IconLock /></span>
                  <input type={showConfirm?"text":"password"} className={`f-input${form.confirm&&form.confirm!==form.password?" err":""}`} placeholder="Repite la contraseña" value={form.confirm} onChange={update("confirm")} autoComplete="new-password" disabled={loading} />
                  <button type="button" className="f-eye" onClick={() => setShowConfirm(p=>!p)} tabIndex={-1}>{showConfirm?<IconEyeOff />:<IconEye />}</button>
                </div>
              </div>
            </div>
            <div className="terms-row">
              <div className={`terms-check${agreed?" checked":""}`} onClick={() => setAgreed(a=>!a)} role="checkbox" aria-checked={agreed} tabIndex={0} onKeyDown={e=>e.key===" "&&setAgreed(a=>!a)}>
                {agreed && <IconCheck style={{color:"white"}} />}
              </div>
              <span className="terms-txt">Acepto los <button type="button" className="terms-link">Términos y Condiciones</button> y la <button type="button" className="terms-link">Política de Privacidad</button> de Catalogix</span>
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading?<><span className="spin"/>Creando cuenta...</>:"Crear mi cuenta gratis"}
            </button>
            <div className="secure"><IconShield style={{color:"var(--c-slate-400)"}}/><span className="secure-txt">Tus datos están protegidos con cifrado SSL</span></div>
          </form>
          <div className="divider"><div className="divider-line"/><span className="divider-txt">¿Ya tienes cuenta?</span><div className="divider-line"/></div>
          <div className="row-login"><button className="btn-login" onClick={() => navigate("/login")}>Iniciar sesión →</button></div>
        </>
      )}
    </>
  );
}
