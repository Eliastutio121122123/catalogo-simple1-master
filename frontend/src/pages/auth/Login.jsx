import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/odoo/authService";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";

const IconMail = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const IconLock = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IconEye = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const IconEyeOff = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const IconAlert = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconShield = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);

class RoleRouter {
  static pathForUser(user) {
    const role = String(user?.role || "").toLowerCase();
    if (role === "admin") return "/admin/dashboard";
    if (role === "vendor") return "/vendor/dashboard";
    return "/home";
  }
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!email.trim())               { setError("El usuario o correo es obligatorio"); return; }
    if (email.includes("@") && !/\S+@\S+\.\S+/.test(email)) {
      setError("Ingresa un correo electrónico válido");
      return;
    }
    if (!password.trim())            { setError("La contraseña es obligatoria"); return; }
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      navigate(RoleRouter.pathForUser(user));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        .f-head{margin-bottom:34px}
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
        .err-box{display:flex;align-items:center;gap:9px;background:var(--c-red-bg);border:1px solid var(--c-red-bdr);border-radius:11px;padding:11px 14px;margin-bottom:18px;animation:shake 0.38s ease}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
        .err-txt{font-size:13px;font-weight:600;color:var(--c-red)}
        .row-forgot{display:flex;justify-content:flex-end;margin-top:-6px;margin-bottom:26px}
        .btn-forgot{background:none;border:none;cursor:pointer;font-size:12.5px;font-weight:600;color:var(--c-blue-600);font-family:'Nunito',sans-serif;transition:color 0.2s;padding:0}
        .btn-forgot:hover{color:var(--c-teal-500)}
        .btn-submit{width:100%;background:linear-gradient(135deg,var(--c-blue-700),var(--c-blue-600),#0284c7);border:none;border-radius:13px;padding:15px;font-size:15px;font-weight:700;color:var(--c-white);font-family:'Nunito',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;transition:all 0.25s;box-shadow:0 4px 18px rgba(29,78,216,0.32)}
        .btn-submit:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(29,78,216,0.42)}
        .btn-submit:disabled{opacity:0.6;cursor:not-allowed;transform:none;box-shadow:none}
        .spin{width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:rot 0.65s linear infinite}
        @keyframes rot{to{transform:rotate(360deg)}}
        .secure{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:12px}
        .secure-txt{font-size:11.5px;color:var(--c-slate-400);font-weight:400}
        .divider{display:flex;align-items:center;gap:14px;margin:28px 0}
        .divider-line{flex:1;height:1px;background:var(--c-slate-200)}
        .divider-txt{font-size:12px;color:var(--c-slate-400);white-space:nowrap}
        .gwrap{margin:18px 0 10px}
        .row-reg{text-align:center}
        .btn-reg{background:none;border:none;cursor:pointer;font-size:13.5px;font-weight:700;color:var(--c-blue-600);font-family:'Nunito',sans-serif;transition:color 0.2s}
        .btn-reg:hover{color:var(--c-teal-500)}
      `}</style>

      <div className="f-head">
        <p className="f-eyebrow">Bienvenido de vuelta</p>
        <h2 className="f-title">Inicia sesión<br />en tu cuenta</h2>
        <div className="f-rule" />
        <p className="f-sub">Ingresa tus datos para acceder al panel de control</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {error && <div className="err-box"><IconAlert /><span className="err-txt">{error}</span></div>}

        <div className="gwrap">
          <GoogleSignInButton
            role="customer"
            onAuthed={(user) => navigate(RoleRouter.pathForUser(user))}
            onError={(msg) => setError(msg)}
          />
        </div>

        <div className="divider" style={{ margin: "18px 0 22px" }}>
          <div className="divider-line" /><span className="divider-txt">o</span><div className="divider-line" />
        </div>

        <div className="f-group">
          <label className="f-label" htmlFor="email">Usuario o correo</label>
          <div className="f-wrap">
            <span className="f-icon"><IconMail /></span>
            <input id="email" type="text" className={`f-input${error && !email ? " err" : ""}`}
              placeholder="usuario o correo@empresa.com" value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              autoComplete="username" disabled={loading} />
          </div>
        </div>

        <div className="f-group">
          <label className="f-label" htmlFor="password">Contraseña</label>
          <div className="f-wrap">
            <span className="f-icon"><IconLock /></span>
            <input id="password" type={showPass ? "text" : "password"}
              className={`f-input${error && !password ? " err" : ""}`}
              placeholder="••••••••••" value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              autoComplete="current-password" disabled={loading} />
            <button type="button" className="f-eye" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
              {showPass ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </div>

        <div className="row-forgot">
          <button type="button" className="btn-forgot" onClick={() => navigate("/forgot-password")}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? <><span className="spin" />Verificando...</> : "Iniciar sesión"}
        </button>
        <div className="secure">
          <IconShield style={{ color:"var(--c-slate-400)" }} />
          <span className="secure-txt">Conexión protegida con SSL · Powered by Odoo</span>
        </div>
      </form>

      <div className="divider">
        <div className="divider-line" /><span className="divider-txt">¿Nuevo en Catalogix?</span><div className="divider-line" />
      </div>
      <div className="row-reg">
        <button className="btn-reg" onClick={() => navigate("/register")}>Crear cuenta gratis →</button>
      </div>
    </>
  );
}
