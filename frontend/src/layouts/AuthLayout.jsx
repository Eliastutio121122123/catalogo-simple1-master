import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

// ─── Logo Catalogix ───────────────────────────────────────────────────────────
const LogoCatalogix = ({ size = 46 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="aulg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e40af"/>
        <stop offset="100%" stopColor="#06b6d4"/>
      </linearGradient>
    </defs>
    <path d="M18 26 L30 26 L44 76 L88 76 L98 42 L34 42"
      stroke="url(#aulg1)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="50" cy="88" r="6" fill="url(#aulg1)"/>
    <circle cx="80" cy="88" r="6" fill="url(#aulg1)"/>
    <rect x="50" y="24" width="16" height="22" rx="2.5" fill="#1d4ed8" opacity="0.95"/>
    <rect x="58" y="20" width="16" height="22" rx="2.5" fill="#0891b2" opacity="0.9"/>
    <rect x="66" y="16" width="16" height="22" rx="2.5" fill="#06b6d4" opacity="0.85"/>
    <line x1="54" y1="30" x2="62" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
    <line x1="54" y1="35" x2="62" y2="35" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <rect x="86" y="12" width="9" height="9" rx="2" fill="#06b6d4" opacity="0.8"/>
    <rect x="98" y="12" width="6" height="6" rx="1.5" fill="#22d3ee" opacity="0.55"/>
    <rect x="86" y="24" width="6" height="6" rx="1.5" fill="#0891b2" opacity="0.45"/>
    <rect x="98" y="22" width="4" height="4" rx="1" fill="#67e8f9" opacity="0.3"/>
  </svg>
);

// ─── Contenido del panel izquierdo según la ruta activa ───────────────────────
const PANEL_CONTENT = {
  "/login": {
    pill:     "Sistema activo",
    title:    <>Vende más con<br />catálogos<br /><span className="grad">inteligentes.</span></>,
    desc:     "Gestiona productos, pedidos y clientes desde un solo lugar. Multi-vendedor, pagos integrados y reportes en tiempo real con Odoo.",
  },
  "/register": {
    pill:     "Registro gratuito",
    title:    <>Empieza a vender<br />hoy mismo<br /><span className="grad">sin costo.</span></>,
    desc:     "Crea tu cuenta en minutos y accede a todas las herramientas para gestionar tu catálogo digital, pedidos y clientes.",
  },
  "/forgot-password": {
    pill:     "Recuperación segura",
    title:    <>Recupera el<br />acceso a tu<br /><span className="grad">cuenta.</span></>,
    desc:     "Te enviaremos un enlace seguro a tu correo para que puedas restablecer tu contraseña en minutos.",
  },
  "/reset-password": {
    pill:     "Nueva contraseña",
    title:    <>Crea una<br />contraseña<br /><span className="grad">segura.</span></>,
    desc:     "Elige una contraseña fuerte para proteger tu cuenta. Recuerda que debe tener al menos 8 caracteres.",
  },
  "/verify-email": {
    pill:     "Verificación",
    title:    <>Verifica tu<br />correo<br /><span className="grad">electrónico.</span></>,
    desc:     "Hemos enviado un código de verificación a tu correo. Revisa tu bandeja de entrada y sigue las instrucciones.",
  },
};

const DEFAULT_CONTENT = {
  pill:  "Bienvenido",
  title: <>Catalogix<br /><span className="grad">plataforma.</span></>,
  desc:  "Gestiona productos, pedidos y clientes desde un solo lugar.",
};

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function AuthLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => { setTimeout(() => setReady(true), 60); }, []);

  const content = PANEL_CONTENT[location.pathname] ?? DEFAULT_CONTENT;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Lexend:wght@600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }
        body { font-family: 'Nunito', sans-serif; }

        :root {
          --c-blue-950:  #0a1628;
          --c-blue-900:  #0f2044;
          --c-blue-800:  #1a3a6e;
          --c-blue-700:  #1d4ed8;
          --c-blue-600:  #2563eb;
          --c-blue-500:  #3b82f6;
          --c-blue-400:  #60a5fa;
          --c-blue-100:  #dbeafe;
          --c-teal-600:  #0891b2;
          --c-teal-500:  #06b6d4;
          --c-teal-400:  #22d3ee;
          --c-teal-300:  #67e8f9;
          --c-white:     #ffffff;
          --c-slate-50:  #f8fafc;
          --c-slate-100: #f1f5f9;
          --c-slate-200: #e2e8f0;
          --c-slate-300: #cbd5e1;
          --c-slate-400: #94a3b8;
          --c-slate-500: #64748b;
          --c-slate-700: #334155;
          --c-slate-900: #0f172a;
        }

        /* ════════════ LAYOUT ════════════ */
        .auth-page {
          min-height: 100vh;
          display: flex;
          background: var(--c-white);
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.45s ease, transform 0.45s ease;
        }
        .auth-page.in { opacity: 1; transform: translateY(0); }

        /* ════════════ PANEL IZQUIERDO ════════════ */
        .auth-side {
          flex: 1;
          position: relative;
          overflow: hidden;
          display: none;
        }
        @media (min-width: 960px) { .auth-side { display: block; } }

        .auth-side-bg {
          position: absolute; inset: 0;
          background: linear-gradient(145deg,
            var(--c-blue-950) 0%,
            var(--c-blue-900) 40%,
            #0d2d60 100%
          );
        }
        .auth-side-pattern {
          position: absolute; inset: 0;
          background-image: repeating-linear-gradient(
            -55deg, transparent 0px, transparent 38px,
            rgba(6,182,212,0.04) 38px, rgba(6,182,212,0.04) 40px
          );
        }
        .auth-side-dots {
          position: absolute; inset: 0;
          background-image: radial-gradient(
            circle, rgba(34,211,238,0.18) 1px, transparent 1px
          );
          background-size: 30px 30px;
          opacity: 0.6;
        }

        /* Orbes animados */
        .auth-orb {
          position: absolute; border-radius: 50%;
          filter: blur(90px); pointer-events: none;
        }
        .auth-orb-a {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(29,78,216,0.55), transparent 70%);
          top: -120px; left: -120px;
          animation: orb-a 10s ease-in-out infinite;
        }
        .auth-orb-b {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(6,182,212,0.4), transparent 70%);
          bottom: -60px; right: -80px;
          animation: orb-b 14s ease-in-out infinite;
        }
        .auth-orb-c {
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(34,211,238,0.2), transparent 70%);
          top: 42%; left: 38%;
          animation: orb-a 8s ease-in-out infinite reverse;
        }
        @keyframes orb-a { 0%,100%{transform:translate(0,0)} 50%{transform:translate(24px,-20px)} }
        @keyframes orb-b { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-18px,18px)} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.2} }

        /* Contenido del panel */
        .auth-side-inner {
          position: relative; z-index: 2;
          height: 100%;
          display: flex; flex-direction: column;
          padding: 52px 56px;
        }

        /* Marca */
        .auth-brand {
          display: flex; align-items: center; gap: 14px;
          cursor: pointer;
        }
        .auth-brand-name {
          font-family: 'Lexend', sans-serif;
          font-size: 26px; font-weight: 800;
          color: var(--c-white); letter-spacing: -0.5px;
        }
        .auth-brand-name em {
          font-style: normal;
          background: linear-gradient(90deg, var(--c-teal-400), var(--c-blue-400));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Hero */
        .auth-hero {
          flex: 1;
          display: flex; flex-direction: column;
          justify-content: center;
        }

        /* Pastilla */
        .auth-pill {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(6,182,212,0.1);
          border: 1px solid rgba(6,182,212,0.22);
          border-radius: 100px;
          padding: 5px 14px; margin-bottom: 30px;
          width: fit-content;
        }
        .auth-pill-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--c-teal-400);
          animation: blink 2.5s ease-in-out infinite;
          box-shadow: 0 0 6px rgba(34,211,238,0.6);
        }
        .auth-pill-txt {
          font-size: 11px; font-weight: 700;
          color: var(--c-teal-300);
          letter-spacing: 1.4px; text-transform: uppercase;
        }

        /* Titular */
        .auth-h1 {
          font-family: 'Lexend', sans-serif;
          font-size: clamp(30px, 3.2vw, 46px);
          font-weight: 800;
          color: var(--c-white);
          line-height: 1.1;
          letter-spacing: -1px;
          margin-bottom: 18px;
          transition: opacity 0.35s ease;
        }
        .auth-h1 .grad {
          background: linear-gradient(90deg, var(--c-teal-400) 0%, var(--c-blue-400) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .auth-desc {
          font-size: 14.5px; font-weight: 300;
          color: rgba(255,255,255,0.42);
          line-height: 1.8; max-width: 370px;
          transition: opacity 0.35s ease;
        }

        /* Separador de rutas en el panel */
        .auth-route-links {
          display: flex; flex-direction: column; gap: 10px;
          margin-top: 48px;
        }
        .auth-route-link {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .auth-route-link:hover {
          background: rgba(6,182,212,0.07);
          border-color: rgba(6,182,212,0.18);
          transform: translateX(4px);
        }
        .auth-route-link.current {
          background: rgba(37,99,235,0.15);
          border-color: rgba(6,182,212,0.25);
        }
        .auth-route-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
          background: rgba(255,255,255,0.15);
          transition: background 0.2s;
        }
        .auth-route-link.current .auth-route-dot {
          background: var(--c-teal-400);
          box-shadow: 0 0 6px rgba(34,211,238,0.5);
        }
        .auth-route-txt {
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.45);
          transition: color 0.2s;
        }
        .auth-route-link.current .auth-route-txt,
        .auth-route-link:hover .auth-route-txt {
          color: rgba(255,255,255,0.8);
        }

        /* ════════════ PANEL DERECHO ════════════ */
        .auth-form-side {
          width: 100%;
          display: flex; align-items: center; justify-content: center;
          padding: 48px 28px;
          background: var(--c-white);
          position: relative;
          overflow-y: auto;
        }
        @media (min-width: 960px) {
          .auth-form-side { width: 460px; flex-shrink: 0; }
        }
        @media (min-width: 960px) and (max-width: 1100px) {
          .auth-form-side { width: 420px; }
        }

        /* Fondo sutil */
        .auth-form-side::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 90% 5%,  rgba(37,99,235,0.05) 0%, transparent 55%),
            radial-gradient(ellipse at 10% 95%, rgba(6,182,212,0.05) 0%, transparent 55%);
          pointer-events: none;
        }

        /* Contenedor del outlet */
        .auth-outlet {
          position: relative; z-index: 1;
          width: 100%; max-width: 400px;
        }

        /* Logo móvil (visible solo en móvil) */
        .auth-mob-brand {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 36px;
          cursor: pointer;
        }
        @media (min-width: 960px) { .auth-mob-brand { display: none; } }
        .auth-mob-brand-name {
          font-family: 'Lexend', sans-serif;
          font-size: 22px; font-weight: 800;
          color: var(--c-blue-900); letter-spacing: -0.4px;
        }
        .auth-mob-brand-name em {
          font-style: normal;
          background: linear-gradient(90deg, var(--c-blue-600), var(--c-teal-500));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className={`auth-page${ready ? " in" : ""}`}>

        {/* ══ PANEL IZQUIERDO ══ */}
        <div className="auth-side">
          <div className="auth-side-bg" />
          <div className="auth-side-pattern" />
          <div className="auth-side-dots" />
          <div className="auth-orb auth-orb-a" />
          <div className="auth-orb auth-orb-b" />
          <div className="auth-orb auth-orb-c" />

          <div className="auth-side-inner">

            {/* Marca */}
            <div className="auth-brand" onClick={() => navigate("/home")}>
              <LogoCatalogix size={46} />
              <span className="auth-brand-name">Catalog<em>ix</em></span>
            </div>

            {/* Hero — cambia según la ruta */}
            <div className="auth-hero">
              <div className="auth-pill">
                <div className="auth-pill-dot" />
                <span className="auth-pill-txt">{content.pill}</span>
              </div>

              <h1 className="auth-h1">{content.title}</h1>
              <p className="auth-desc">{content.desc}</p>

              {/* Links de navegación entre páginas auth */}
              <div className="auth-route-links">
                {[
                  { path: "/login",           label: "Iniciar sesión"          },
                  { path: "/register",        label: "Crear cuenta"            },
                  { path: "/forgot-password", label: "Recuperar contraseña"    },
                ].map(r => (
                  <div
                    key={r.path}
                    className={`auth-route-link${location.pathname === r.path ? " current" : ""}`}
                    onClick={() => navigate(r.path)}
                  >
                    <div className="auth-route-dot" />
                    <span className="auth-route-txt">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ══ PANEL DERECHO — contenido de cada página ══ */}
        <div className="auth-form-side">
          <div className="auth-outlet">

            {/* Logo móvil */}
            <div className="auth-mob-brand" onClick={() => navigate("/home")}>
              <LogoCatalogix size={38} />
              <span className="auth-mob-brand-name">Catalog<em>ix</em></span>
            </div>

            {/* Aquí se renderizan Login, Register, ForgotPassword, etc. */}
            <Outlet />

          </div>
        </div>

      </div>
    </>
  );
}