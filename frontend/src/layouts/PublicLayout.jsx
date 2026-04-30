import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import authService from "../services/odoo/authService";
import customerPortalService from "../services/odoo/customerPortalService";
// Importa CartContext desde App cuando esté disponible:
// import { CartContext } from "../context/CartContext";
// Mientras tanto, intenta leerlo con try/catch o importarlo dinámicamente.
// Por ahora usamos un contexto propio como fallback:
import { CartContext } from "../context/CartContext";

// ─── Iconos ───────────────────────────────────────────────────────────────────
const IcoSearch = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoCart = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IcoUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IcoClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcoChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IcoBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const IcoTag = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IcoMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const IcoPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IcoMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IcoArrowRight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcoLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcoOrders = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

// ─── Logo Catalogix ───────────────────────────────────────────────────────────
const LogoCatalogix = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="plg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e40af"/>
        <stop offset="100%" stopColor="#06b6d4"/>
      </linearGradient>
    </defs>
    <path d="M18 26 L30 26 L44 76 L88 76 L98 42 L34 42"
      stroke="url(#plg1)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="50" cy="88" r="6" fill="url(#plg1)"/>
    <circle cx="80" cy="88" r="6" fill="url(#plg1)"/>
    <rect x="50" y="24" width="16" height="22" rx="2.5" fill="#1d4ed8" opacity="0.95"/>
    <rect x="58" y="20" width="16" height="22" rx="2.5" fill="#0891b2" opacity="0.9"/>
    <rect x="66" y="16" width="16" height="22" rx="2.5" fill="#06b6d4" opacity="0.85"/>
    <line x1="54" y1="30" x2="62" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
    <line x1="54" y1="35" x2="62" y2="35" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <rect x="86" y="12" width="9" height="9" rx="2" fill="#06b6d4" opacity="0.8"/>
    <rect x="98" y="12" width="6" height="6" rx="1.5" fill="#22d3ee" opacity="0.55"/>
    <rect x="86" y="24" width="6" height="6" rx="1.5" fill="#0891b2" opacity="0.45"/>
  </svg>
);

// ─── Links de navegación ──────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Inicio",    path: "/home" },
  { label: "Catálogos", path: "/catalogs" },
  { label: "Ofertas",   path: "/search?filter=sale" },
];

// ─── Categorías del mega-menú ─────────────────────────────────────────────────
const CATEGORIES = [
  { emoji: "👗", label: "Moda",          path: "/search?cat=fashion" },
  { emoji: "⚽", label: "Deportes",      path: "/search?cat=sports" },
  { emoji: "💄", label: "Belleza",       path: "/search?cat=beauty" },
  { emoji: "🍔", label: "Alimentos",     path: "/search?cat=food"   },
  { emoji: "🏠", label: "Hogar",         path: "/search?cat=home"   },
  { emoji: "🔌", label: "Electrónica",   path: "/search?cat=electronics" },
  { emoji: "🛠️", label: "Servicios",    path: "/search?cat=services" },
  { emoji: "📦", label: "Otros",         path: "/search?cat=other"  },
];

// ─── Usuario simulado (null = no autenticado) ─────────────────────────────────
// Cambiar a un objeto real cuando authStore esté listo:
// const user = useAuthStore(s => s.user);

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function PublicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount = 0 } = useContext(CartContext) || {};

  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);

  const [searchVal,     setSearchVal]     = useState("");
  const [catOpen,       setCatOpen]       = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [user,          setUser]          = useState(() => authService.getCurrentUser());

  const catRef     = useRef(null);
  const profileRef = useRef(null);

  // Sombra del header al hacer scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cerrar todo al cambiar ruta
  useEffect(() => {
    setMobileOpen(false);
    setCatOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (catRef.current     && !catRef.current.contains(e.target))     setCatOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll body bloqueado con menú móvil abierto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const initialsFromName = (name) => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "CL";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const buildUserFromRaw = (raw) => {
    if (!raw) return null;
    const name = String(raw.name || raw.login || raw.email || "Cliente");
    const email = String(raw.email || raw.login || "");
    const avatarUrl = raw.avatarUrl || (raw.image_128 ? `data:image/png;base64,${raw.image_128}` : "");
    return {
      name,
      email,
      avatar: initialsFromName(name),
      avatarUrl,
    };
  };

  const loadProfile = async () => {
    try {
      const profile = await customerPortalService.getProfile();
      const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || profile.fullName || "Cliente";
      setUser({
        name: fullName,
        email: profile.email || "",
        avatar: initialsFromName(fullName),
        avatarUrl: profile.avatarUrl || "",
      });
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    const syncUser = () => {
      const raw = authService.getCurrentUser();
      setUser(buildUserFromRaw(raw));
    };
    window.addEventListener("storage", syncUser);
    syncUser();
    if (authService.isAuthenticated()) {
      loadProfile();
    }
    const handler = () => {
      if (authService.isAuthenticated()) loadProfile();
    };
    window.addEventListener("catalogix:profile-updated", handler);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("catalogix:profile-updated", handler);
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setProfileOpen(false);
    navigate("/home");
  };


  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
    }
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Lexend:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body, #root { height:100%; }
        body { font-family:'Nunito',sans-serif; background:#f8fafc; }

        :root {
          --pb-700:#1d4ed8; --pb-600:#2563eb; --pb-500:#3b82f6;
          --pb-400:#60a5fa; --pb-100:#dbeafe; --pb-50:#eff6ff;
          --pt-600:#0891b2; --pt-500:#06b6d4; --pt-400:#22d3ee;
          --pt-300:#67e8f9; --pt-50:#ecfeff;
          --pw:#ffffff;
          --ps-50:#f8fafc;  --ps-100:#f1f5f9; --ps-200:#e2e8f0;
          --ps-300:#cbd5e1; --ps-400:#94a3b8; --ps-500:#64748b;
          --ps-600:#475569; --ps-700:#334155; --ps-800:#1e293b; --ps-900:#0f172a;
          --pred:#f87171; --pred-bg:rgba(248,113,113,.07); --pred-bdr:rgba(248,113,113,.22);
          --header-h:68px;
        }

        /* ════ ROOT ════ */
        .pl-root { min-height:100vh; display:flex; flex-direction:column; background:var(--ps-50); }

        /* ════════════════════════════════════════
           ANNOUNCEMENT BAR
        ════════════════════════════════════════ */
        .pl-announce {
          background:linear-gradient(90deg,var(--pb-700),var(--pt-600));
          padding:9px 24px;
          display:flex; align-items:center; justify-content:center;
          gap:10px;
        }
        .pl-announce-txt {
          font-size:12.5px; font-weight:700; color:white;
          text-align:center; letter-spacing:.2px;
        }
        .pl-announce-txt em { font-style:normal; color:var(--pt-300); }
        .pl-announce-link {
          font-size:12px; font-weight:800; color:white;
          background:rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.3);
          border-radius:100px; padding:3px 12px; cursor:pointer;
          white-space:nowrap; transition:background .2s; text-decoration:none;
          font-family:'Nunito',sans-serif;
        }
        .pl-announce-link:hover { background:rgba(255,255,255,.28); }

        /* ════════════════════════════════════════
           HEADER
        ════════════════════════════════════════ */
        .pl-header {
          position:sticky; top:0; z-index:100;
          background:rgba(255,255,255,.95);
          backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
          border-bottom:1px solid transparent;
          transition:border-color .2s, box-shadow .2s;
        }
        .pl-header.scrolled {
          border-bottom-color:var(--ps-200);
          box-shadow:0 2px 24px rgba(15,23,42,.07);
        }

        .pl-header-inner {
          max-width:1280px; margin:0 auto;
          height:var(--header-h);
          display:flex; align-items:center;
          padding:0 24px; gap:0;
        }

        /* ── Logo ── */
        .pl-logo {
          display:flex; align-items:center; gap:10px;
          cursor:pointer; text-decoration:none; flex-shrink:0;
        }
        .pl-logo-name {
          font-family:'Lexend',sans-serif;
          font-size:21px; font-weight:800;
          color:var(--ps-900); letter-spacing:-.4px; line-height:1;
        }
        .pl-logo-name em {
          font-style:normal;
          background:linear-gradient(90deg,var(--pb-600),var(--pt-500));
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }

        /* ── Nav desktop ── */
        .pl-nav {
          display:none; align-items:center; gap:2px;
          margin-left:28px;
        }
        @media(min-width:900px){ .pl-nav { display:flex; } }

        .pl-nav-link {
          padding:8px 14px; border-radius:10px;
          font-size:14px; font-weight:600;
          color:var(--ps-500); cursor:pointer;
          border:none; background:none;
          font-family:'Nunito',sans-serif;
          transition:all .18s; white-space:nowrap;
          position:relative;
        }
        .pl-nav-link:hover { color:var(--pb-600); background:var(--pb-50); }
        .pl-nav-link.active { color:var(--pb-700); background:var(--pb-50); font-weight:700; }
        .pl-nav-link.active::after {
          content:''; position:absolute; bottom:2px; left:50%; transform:translateX(-50%);
          width:18px; height:2.5px;
          background:linear-gradient(90deg,var(--pb-600),var(--pt-500));
          border-radius:100px;
        }

        /* Dropdown categorías */
        .pl-cat-wrap { position:relative; }
        .pl-cat-btn {
          display:none; align-items:center; gap:6px;
          padding:8px 14px; border-radius:10px;
          font-size:14px; font-weight:600;
          color:var(--ps-500); cursor:pointer;
          border:none; background:none;
          font-family:'Nunito',sans-serif;
          transition:all .18s; white-space:nowrap;
          margin-left:2px;
        }
        @media(min-width:900px){ .pl-cat-btn { display:flex; } }
        .pl-cat-btn:hover, .pl-cat-btn.open {
          color:var(--pb-600); background:var(--pb-50);
        }
        .pl-cat-chev { transition:transform .2s; }
        .pl-cat-btn.open .pl-cat-chev { transform:rotate(180deg); }

        .pl-cat-dropdown {
          position:absolute; top:calc(100% + 10px); left:0;
          width:340px;
          background:var(--pw);
          border:1px solid var(--ps-200);
          border-radius:18px;
          box-shadow:0 20px 60px rgba(15,23,42,.12);
          padding:16px;
          animation:pl-dd .18s ease;
          z-index:200;
        }
        @keyframes pl-dd{ from{opacity:0;transform:translateY(-8px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .pl-cat-dd-title {
          font-size:10.5px; font-weight:800; color:var(--ps-400);
          text-transform:uppercase; letter-spacing:1px;
          margin-bottom:12px; padding:0 4px;
        }
        .pl-cat-grid {
          display:grid; grid-template-columns:1fr 1fr; gap:6px;
        }
        .pl-cat-item {
          display:flex; align-items:center; gap:10px;
          padding:10px 12px; border-radius:12px;
          cursor:pointer; transition:background .15s;
          border:none; background:none; width:100%;
          font-family:'Nunito',sans-serif; text-align:left;
        }
        .pl-cat-item:hover { background:var(--pb-50); }
        .pl-cat-emoji {
          width:32px; height:32px; border-radius:9px;
          background:linear-gradient(135deg,var(--pb-50),var(--pt-50));
          display:flex; align-items:center; justify-content:center;
          font-size:16px; flex-shrink:0;
          border:1px solid var(--ps-200);
        }
        .pl-cat-label { font-size:13px; font-weight:600; color:var(--ps-700); }
        .pl-cat-dd-footer {
          margin-top:12px; padding-top:12px;
          border-top:1px solid var(--ps-100);
          text-align:center;
        }
        .pl-cat-dd-all {
          font-size:13px; font-weight:700; color:var(--pb-600);
          background:none; border:none; cursor:pointer;
          font-family:'Nunito',sans-serif; transition:color .2s;
          display:inline-flex; align-items:center; gap:5px;
        }
        .pl-cat-dd-all:hover { color:var(--pt-500); }

        /* ── Spacer ── */
        .pl-spacer { flex:1; }

        /* ── Búsqueda expandible ── */
        .pl-search-wrap { position:relative; }
        .pl-search-bar {
          display:flex; align-items:center; gap:9px;
          background:var(--ps-50); border:1.5px solid var(--ps-200);
          border-radius:12px; padding:9px 14px;
          width:200px;
          transition:border-color .2s, box-shadow .2s, width .25s;
          cursor:text;
        }
        @media(min-width:768px){ .pl-search-bar { width:240px; } }
        @media(min-width:1024px){ .pl-search-bar { width:280px; } }
        .pl-search-bar:hover { border-color:var(--pb-400); }
        .pl-search-bar:focus-within {
          border-color:var(--pb-600);
          background:var(--pw);
          box-shadow:0 0 0 4px rgba(37,99,235,.09);
        }
        .pl-search-ico { color:var(--ps-400); flex-shrink:0; display:flex; transition:color .2s; }
        .pl-search-bar:focus-within .pl-search-ico { color:var(--pb-600); }
        .pl-search-input {
          flex:1; background:none; border:none; outline:none;
          font-size:13.5px; font-weight:500;
          color:var(--ps-800); font-family:'Nunito',sans-serif;
          min-width:0;
        }
        .pl-search-input::placeholder { color:var(--ps-400); font-weight:400; }

        /* Mobile search overlay */
        .pl-search-overlay {
          display:none;
          position:fixed; inset:0; z-index:150;
          background:rgba(15,23,42,.5);
          backdrop-filter:blur(4px);
          animation:pl-fade .2s ease;
        }
        @keyframes pl-fade{from{opacity:0}to{opacity:1}}
        .pl-search-overlay.open { display:block; }
        .pl-search-modal {
          position:fixed; top:0; left:0; right:0; z-index:160;
          background:var(--pw);
          padding:16px 16px 20px;
          box-shadow:0 8px 32px rgba(15,23,42,.12);
          animation:pl-slide-down .2s ease;
        }
        @keyframes pl-slide-down{from{transform:translateY(-100%)}to{transform:translateY(0)}}
        .pl-sm-row {
          display:flex; align-items:center; gap:10px;
          background:var(--ps-50); border:1.5px solid var(--pb-600);
          border-radius:14px; padding:12px 16px;
          box-shadow:0 0 0 4px rgba(37,99,235,.09);
        }
        .pl-sm-input {
          flex:1; background:none; border:none; outline:none;
          font-size:15px; font-weight:500; color:var(--ps-800);
          font-family:'Nunito',sans-serif;
        }
        .pl-sm-input::placeholder { color:var(--ps-400); }
        .pl-sm-close {
          background:none; border:none; cursor:pointer;
          color:var(--ps-400); padding:2px; display:flex;
          transition:color .2s;
        }
        .pl-sm-close:hover { color:var(--ps-700); }
        .pl-sm-hints { margin-top:14px; display:flex; flex-wrap:wrap; gap:8px; }
        .pl-sm-hint {
          padding:6px 14px; border-radius:100px;
          background:var(--ps-100); border:1px solid var(--ps-200);
          font-size:12.5px; font-weight:600; color:var(--ps-600);
          cursor:pointer; transition:all .15s;
          font-family:'Nunito',sans-serif; border:none;
        }
        .pl-sm-hint:hover { background:var(--pb-50); color:var(--pb-600); }

        /* ── Carrito ── */
        .pl-cart-btn {
          position:relative;
          width:42px; height:42px; border-radius:11px;
          border:1.5px solid var(--ps-200); background:var(--pw);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; color:var(--ps-600);
          transition:all .2s; flex-shrink:0;
        }
        .pl-cart-btn:hover { border-color:var(--pb-400); color:var(--pb-600); background:var(--pb-50); }
        .pl-cart-badge {
          position:absolute; top:-6px; right:-6px;
          min-width:20px; height:20px; padding:0 5px;
          border-radius:100px;
          background:linear-gradient(135deg,var(--pb-700),var(--pt-500));
          color:white; font-size:10px; font-weight:800;
          display:flex; align-items:center; justify-content:center;
          font-family:'Nunito',sans-serif;
          border:2.5px solid white;
          animation:pl-pop .2s ease;
        }
        @keyframes pl-pop{ from{transform:scale(.6)} to{transform:scale(1)} }

        /* ── Perfil / Login ── */
        .pl-profile-wrap { position:relative; margin-left:8px; }

        /* Si no está autenticado: botones de auth */
        .pl-auth-btns {
          display:none; align-items:center; gap:8px;
        }
        @media(min-width:640px){ .pl-auth-btns { display:flex; } }
        .pl-btn-login {
          padding:8px 16px; border-radius:10px;
          border:1.5px solid var(--ps-200); background:var(--pw);
          font-size:13.5px; font-weight:700; color:var(--ps-600);
          font-family:'Nunito',sans-serif; cursor:pointer; transition:all .2s;
          white-space:nowrap;
        }
        .pl-btn-login:hover { border-color:var(--pb-400); color:var(--pb-600); background:var(--pb-50); }
        .pl-btn-register {
          padding:8px 16px; border-radius:10px;
          border:none;
          background:linear-gradient(135deg,var(--pb-700),var(--pt-600));
          font-size:13.5px; font-weight:700; color:white;
          font-family:'Nunito',sans-serif; cursor:pointer;
          box-shadow:0 3px 12px rgba(29,78,216,.28);
          transition:all .2s; white-space:nowrap;
        }
        .pl-btn-register:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(29,78,216,.38); }

        /* Si está autenticado: avatar */
        .pl-avatar-btn {
          display:flex; align-items:center; gap:8px;
          padding:5px 10px 5px 5px;
          border-radius:11px;
          border:1.5px solid var(--ps-200); background:var(--pw);
          cursor:pointer; transition:all .2s;
        }
        .pl-avatar-btn:hover, .pl-avatar-btn.open {
          border-color:var(--pb-300); background:var(--pb-50);
        }
        .pl-avatar {
          width:30px; height:30px; border-radius:8px;
          background:linear-gradient(135deg,var(--pb-700),var(--pt-500));
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:800; color:white;
          font-family:'Lexend',sans-serif; flex-shrink:0;
        }
        .pl-avatar.has-img{
          background-size:cover;
          background-position:center;
          color:transparent;
        }
        .pl-av-name { font-size:13px; font-weight:700; color:var(--ps-800); white-space:nowrap; }
        @media(max-width:639px){ .pl-av-name { display:none; } }
        .pl-av-chev { color:var(--ps-400); transition:transform .2s; }
        .pl-av-chev.open { transform:rotate(180deg); }

        /* Dropdown perfil */
        .pl-profile-dd {
          position:absolute; top:calc(100% + 10px); right:0;
          width:230px;
          background:var(--pw); border:1px solid var(--ps-200);
          border-radius:16px;
          box-shadow:0 16px 48px rgba(15,23,42,.12);
          overflow:hidden; animation:pl-dd .18s ease; z-index:200;
        }
        .pl-pd-head {
          padding:14px 16px 12px; border-bottom:1px solid var(--ps-100);
          background:linear-gradient(135deg,rgba(37,99,235,.03),rgba(6,182,212,.02));
        }
        .pl-pd-name { font-size:14px; font-weight:800; color:var(--ps-900); margin-bottom:2px; }
        .pl-pd-email { font-size:12px; color:var(--ps-400); font-weight:400; }
        .pl-pd-menu { padding:6px; }
        .pl-pd-item {
          display:flex; align-items:center; gap:11px;
          padding:10px 12px; border-radius:9px;
          font-size:13.5px; font-weight:600; color:var(--ps-600);
          cursor:pointer; border:none; background:none;
          width:100%; font-family:'Nunito',sans-serif; text-align:left;
          transition:all .15s;
        }
        .pl-pd-item:hover { background:var(--ps-50); color:var(--ps-800); }
        .pl-pd-sep { height:1px; background:var(--ps-100); margin:4px 12px; }
        .pl-pd-item.logout { color:var(--pred); }
        .pl-pd-item.logout:hover { background:var(--pred-bg); }

        /* ── Hamburger ── */
        .pl-hamburger {
          display:flex; align-items:center; justify-content:center;
          width:42px; height:42px; border-radius:11px;
          border:1.5px solid var(--ps-200); background:var(--pw);
          cursor:pointer; color:var(--ps-600);
          transition:all .2s; margin-left:8px;
        }
        @media(min-width:900px){ .pl-hamburger { display:none; } }
        .pl-hamburger:hover { border-color:var(--pb-400); color:var(--pb-600); background:var(--pb-50); }

        /* ═══════════════════════════════════
           MOBILE MENU
        ═══════════════════════════════════ */
        .pl-mob-overlay {
          display:none; position:fixed; inset:0; z-index:150;
          background:rgba(15,23,42,.55); backdrop-filter:blur(4px);
          animation:pl-fade .2s ease;
        }
        .pl-mob-overlay.open { display:block; }

        .pl-mob-menu {
          position:fixed; top:0; right:0; bottom:0; z-index:160;
          width:300px;
          background:var(--pw);
          display:flex; flex-direction:column;
          transform:translateX(100%);
          transition:transform .28s cubic-bezier(.25,.46,.45,.94);
          box-shadow:-8px 0 40px rgba(15,23,42,.14);
        }
        .pl-mob-menu.open { transform:translateX(0); }

        .pl-mob-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:18px 20px;
          border-bottom:1px solid var(--ps-100);
        }
        .pl-mob-close {
          width:36px; height:36px; border-radius:9px;
          border:1.5px solid var(--ps-200); background:var(--pw);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; color:var(--ps-500); transition:all .2s;
        }
        .pl-mob-close:hover { border-color:var(--pred); color:var(--pred); background:var(--pred-bg); }

        /* Búsqueda en mobile */
        .pl-mob-search {
          padding:14px 16px 10px;
          border-bottom:1px solid var(--ps-100);
        }
        .pl-mob-search-row {
          display:flex; align-items:center; gap:9px;
          background:var(--ps-50); border:1.5px solid var(--ps-200);
          border-radius:12px; padding:10px 14px; transition:all .2s;
        }
        .pl-mob-search-row:focus-within {
          border-color:var(--pb-600); background:var(--pw);
          box-shadow:0 0 0 3px rgba(37,99,235,.09);
        }
        .pl-mob-search-input {
          flex:1; background:none; border:none; outline:none;
          font-size:14px; font-weight:500; color:var(--ps-800);
          font-family:'Nunito',sans-serif;
        }
        .pl-mob-search-input::placeholder { color:var(--ps-400); }

        .pl-mob-nav { flex:1; overflow-y:auto; padding:12px 12px; }

        .pl-mob-section-label {
          font-size:10.5px; font-weight:800; color:var(--ps-400);
          text-transform:uppercase; letter-spacing:1px;
          padding:12px 8px 6px;
        }
        .pl-mob-link {
          display:flex; align-items:center; gap:10px;
          padding:12px 12px; border-radius:11px;
          font-size:14px; font-weight:600; color:var(--ps-600);
          cursor:pointer; border:none; background:none;
          width:100%; font-family:'Nunito',sans-serif; text-align:left;
          transition:all .15s; margin-bottom:2px;
        }
        .pl-mob-link:hover { background:var(--ps-50); color:var(--ps-800); }
        .pl-mob-link.active {
          background:linear-gradient(135deg,rgba(37,99,235,.08),rgba(6,182,212,.05));
          color:var(--pb-700); font-weight:700;
        }
        .pl-mob-cat-item {
          display:flex; align-items:center; gap:10px;
          padding:10px 12px; border-radius:11px;
          font-size:13.5px; font-weight:600; color:var(--ps-600);
          cursor:pointer; border:none; background:none;
          width:100%; font-family:'Nunito',sans-serif; text-align:left;
          transition:background .15s; margin-bottom:2px;
        }
        .pl-mob-cat-item:hover { background:var(--ps-50); }
        .pl-mob-cat-emoji { font-size:18px; width:24px; text-align:center; }

        .pl-mob-footer {
          padding:12px 12px;
          border-top:1px solid var(--ps-100);
          display:flex; flex-direction:column; gap:8px;
        }
        .pl-mob-btn-login {
          padding:12px; border-radius:11px;
          border:1.5px solid var(--ps-200); background:var(--pw);
          font-size:14px; font-weight:700; color:var(--ps-600);
          font-family:'Nunito',sans-serif; cursor:pointer; transition:all .2s;
          text-align:center;
        }
        .pl-mob-btn-login:hover { border-color:var(--pb-400); color:var(--pb-600); }
        .pl-mob-btn-register {
          padding:12px; border-radius:11px; border:none;
          background:linear-gradient(135deg,var(--pb-700),var(--pt-600));
          font-size:14px; font-weight:700; color:white;
          font-family:'Nunito',sans-serif; cursor:pointer;
          box-shadow:0 4px 14px rgba(29,78,216,.3); transition:all .2s;
        }
        .pl-mob-btn-register:hover { box-shadow:0 6px 20px rgba(29,78,216,.4); }

        /* ════════════════════════════════════════
           CONTENIDO
        ════════════════════════════════════════ */
        .pl-main { flex:1; }

        /* ════════════════════════════════════════
           FOOTER
        ════════════════════════════════════════ */
        .pl-footer {
          background:var(--ps-900);
          color:var(--ps-400);
        }

        /* Franja superior del footer */
        .pl-footer-top {
          max-width:1280px; margin:0 auto;
          padding:56px 24px 40px;
          display:grid;
          grid-template-columns:1.8fr 1fr 1fr 1fr;
          gap:40px;
        }
        @media(max-width:900px){
          .pl-footer-top { grid-template-columns:1fr 1fr; gap:32px; }
        }
        @media(max-width:600px){
          .pl-footer-top { grid-template-columns:1fr; gap:28px; padding:40px 20px 28px; }
        }

        /* Columna marca */
        .pl-ft-brand {}
        .pl-ft-logo {
          display:flex; align-items:center; gap:10px; margin-bottom:16px;
        }
        .pl-ft-logo-name {
          font-family:'Lexend',sans-serif; font-size:20px; font-weight:800;
          color:white; letter-spacing:-.4px;
        }
        .pl-ft-logo-name em {
          font-style:normal;
          background:linear-gradient(90deg,var(--pb-400),var(--pt-400));
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .pl-ft-desc {
          font-size:13.5px; font-weight:400; line-height:1.7;
          color:var(--ps-400); max-width:280px; margin-bottom:20px;
        }
        .pl-ft-contact { display:flex; flex-direction:column; gap:9px; }
        .pl-ft-contact-item {
          display:flex; align-items:center; gap:8px;
          font-size:13px; color:var(--ps-400);
        }
        .pl-ft-contact-item a {
          color:var(--ps-400); text-decoration:none; transition:color .2s;
        }
        .pl-ft-contact-item a:hover { color:var(--pt-400); }

        /* Columnas de links */
        .pl-ft-col-title {
          font-size:13px; font-weight:800; color:white;
          text-transform:uppercase; letter-spacing:.8px;
          margin-bottom:18px;
        }
        .pl-ft-col-links { display:flex; flex-direction:column; gap:10px; }
        .pl-ft-col-link {
          font-size:13.5px; color:var(--ps-400); cursor:pointer;
          background:none; border:none; padding:0; text-align:left;
          font-family:'Nunito',sans-serif; transition:color .2s;
        }
        .pl-ft-col-link:hover { color:var(--pt-400); }

        /* Newsletter */
        .pl-ft-newsletter-title {
          font-size:13.5px; font-weight:700; color:white;
          margin-bottom:6px;
        }
        .pl-ft-newsletter-sub {
          font-size:12.5px; color:var(--ps-500); line-height:1.5; margin-bottom:16px;
        }
        .pl-ft-newsletter-row {
          display:flex; gap:8px;
        }
        .pl-ft-newsletter-input {
          flex:1; padding:10px 14px; border-radius:10px;
          background:rgba(255,255,255,.06); border:1.5px solid rgba(255,255,255,.1);
          font-size:13px; font-weight:500; color:white;
          font-family:'Nunito',sans-serif; outline:none; transition:all .2s;
          min-width:0;
        }
        .pl-ft-newsletter-input::placeholder { color:var(--ps-500); }
        .pl-ft-newsletter-input:focus { border-color:var(--pt-500); background:rgba(255,255,255,.09); }
        .pl-ft-newsletter-btn {
          padding:10px 16px; border-radius:10px; border:none;
          background:linear-gradient(135deg,var(--pb-600),var(--pt-600));
          color:white; font-size:13px; font-weight:700;
          font-family:'Nunito',sans-serif; cursor:pointer;
          box-shadow:0 3px 10px rgba(6,182,212,.3);
          transition:all .2s; white-space:nowrap; flex-shrink:0;
        }
        .pl-ft-newsletter-btn:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(6,182,212,.4); }

        /* Divider footer */
        .pl-footer-divider {
          border:none; height:1px;
          background:rgba(255,255,255,.07);
          margin:0;
        }

        /* Franja inferior del footer */
        .pl-footer-bottom {
          max-width:1280px; margin:0 auto;
          padding:20px 24px;
          display:flex; align-items:center;
          justify-content:space-between;
          flex-wrap:wrap; gap:12px;
        }
        .pl-fb-copy {
          font-size:12.5px; color:var(--ps-500);
        }
        .pl-fb-links {
          display:flex; align-items:center; gap:20px;
        }
        .pl-fb-link {
          font-size:12.5px; color:var(--ps-500); cursor:pointer;
          background:none; border:none;
          font-family:'Nunito',sans-serif; transition:color .2s;
        }
        .pl-fb-link:hover { color:var(--pt-400); }

        /* Social icons */
        .pl-ft-socials {
          display:flex; gap:10px; margin-top:20px;
        }
        .pl-ft-social {
          width:36px; height:36px; border-radius:10px;
          background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; font-size:16px; transition:all .2s;
        }
        .pl-ft-social:hover {
          background:linear-gradient(135deg,rgba(37,99,235,.3),rgba(6,182,212,.2));
          border-color:rgba(6,182,212,.3);
          transform:translateY(-2px);
        }

        /* Badges de métodos de pago */
        .pl-ft-payments {
          display:flex; align-items:center; gap:8px; margin-top:16px; flex-wrap:wrap;
        }
        .pl-ft-pay-badge {
          background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12);
          border-radius:6px; padding:4px 10px;
          font-size:11px; font-weight:700; color:var(--ps-300);
          letter-spacing:.3px;
        }
      `}</style>

      <div className="pl-root">

        {/* ─── Barra de anuncio ─── */}
        <div className="pl-announce">
          <span className="pl-announce-txt">
            🎉 Envío gratis en pedidos mayores a <em>$999</em> — Solo por tiempo limitado
          </span>
          <button className="pl-announce-link" onClick={() => navigate("/catalogs")}>
            Ver catálogos
          </button>
        </div>

        {/* ════════════════════════════════════════
            HEADER
        ════════════════════════════════════════ */}
        <header className={`pl-header${scrolled ? " scrolled" : ""}`}>
          <div className="pl-header-inner">

            {/* Logo */}
            <div className="pl-logo" onClick={() => navigate("/home")}>
              <LogoCatalogix size={32} />
              <span className="pl-logo-name">Catalog<em>ix</em></span>
            </div>

            {/* Nav links */}
            <nav className="pl-nav">
              {NAV_LINKS.map(l => (
                <button key={l.path}
                  className={`pl-nav-link${isActive(l.path) ? " active" : ""}`}
                  onClick={() => navigate(l.path)}>
                  {l.label}
                </button>
              ))}
            </nav>

            {/* Mega-menú categorías */}
            <div className="pl-cat-wrap" ref={catRef}>
              <button
                className={`pl-cat-btn${catOpen ? " open" : ""}`}
                onClick={() => { setCatOpen(p => !p); setProfileOpen(false); }}>
                <IcoBook />
                Categorías
                <span className="pl-cat-chev"><IcoChevron /></span>
              </button>

              {catOpen && (
                <div className="pl-cat-dropdown">
                  <div className="pl-cat-dd-title">Explorar por categoría</div>
                  <div className="pl-cat-grid">
                    {CATEGORIES.map(c => (
                      <button key={c.path} className="pl-cat-item"
                        onClick={() => { setCatOpen(false); navigate(c.path); }}>
                        <div className="pl-cat-emoji">{c.emoji}</div>
                        <span className="pl-cat-label">{c.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="pl-cat-dd-footer">
                    <button className="pl-cat-dd-all"
                      onClick={() => { setCatOpen(false); navigate("/catalogs"); }}>
                      Ver todos los catálogos <IcoArrowRight />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pl-spacer" />

            {/* ── Búsqueda desktop ── */}
            <form className="pl-search-bar" onSubmit={handleSearch}>
              <span className="pl-search-ico"><IcoSearch /></span>
              <input
                className="pl-search-input"
                placeholder="Buscar productos..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
              />
            </form>

            {/* ── Carrito ── */}
            <div style={{ marginLeft:10 }}>
              <button className="pl-cart-btn" onClick={() => navigate("/cart")} title="Mi carrito">
                <IcoCart />
                {cartCount > 0 && (
                  <span className="pl-cart-badge">{cartCount > 99 ? "99+" : cartCount}</span>
                )}
              </button>
            </div>

            {/* ── Usuario ── */}
            <div className="pl-profile-wrap" ref={profileRef}>
              {user ? (
                <>
                  <button
                    className={`pl-avatar-btn${profileOpen ? " open" : ""}`}
                    onClick={() => setProfileOpen(p => !p)}>
                    <div
                      className={`pl-avatar${user.avatarUrl ? " has-img" : ""}`}
                      style={user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : undefined}
                    >
                      {user.avatarUrl ? "" : user.avatar}
                    </div>
                    <span className="pl-av-name">{user.name.split(" ")[0]}</span>
                    <div className={`pl-av-chev${profileOpen ? " open" : ""}`}>
                      <IcoChevron />
                    </div>
                  </button>
                  {profileOpen && (
                    <div className="pl-profile-dd">
                      <div className="pl-pd-head">
                        <div className="pl-pd-name">{user.name}</div>
                        <div className="pl-pd-email">{user.email}</div>
                      </div>
                      <div className="pl-pd-menu">
                        <button className="pl-pd-item" onClick={() => { setProfileOpen(false); navigate("/customer/profile"); }}>
                          <IcoUser />Mi perfil
                        </button>
                        <button className="pl-pd-item" onClick={() => { setProfileOpen(false); navigate("/customer/orders"); }}>
                          <IcoOrders />Mis pedidos
                        </button>
                        <div className="pl-pd-sep" />
                        <button className="pl-pd-item logout" onClick={handleLogout}>
                          <IcoLogout />Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="pl-auth-btns">
                  <button className="pl-btn-login" onClick={() => navigate("/login")}>
                    Iniciar sesión
                  </button>
                  <button className="pl-btn-register" onClick={() => navigate("/register")}>
                    Crear cuenta
                  </button>
                </div>
              )}
            </div>

            {/* Hamburger móvil */}
            <button className="pl-hamburger" onClick={() => setMobileOpen(true)}>
              <IcoMenu />
            </button>

          </div>
        </header>

        {/* ════════════════════════════════════════
            MOBILE SEARCH OVERLAY
        ════════════════════════════════════════ */}
        {/* (versión móvil abierta con hints de búsqueda) */}

        {/* ════════════════════════════════════════
            MOBILE MENU
        ════════════════════════════════════════ */}
        <div className={`pl-mob-overlay${mobileOpen ? " open" : ""}`}
          onClick={() => setMobileOpen(false)} />

        <div className={`pl-mob-menu${mobileOpen ? " open" : ""}`}>

          {/* Header móvil */}
          <div className="pl-mob-header">
            <div className="pl-logo" onClick={() => navigate("/home")}>
              <LogoCatalogix size={28} />
              <span className="pl-logo-name" style={{ fontSize:18 }}>Catalog<em>ix</em></span>
            </div>
            <button className="pl-mob-close" onClick={() => setMobileOpen(false)}>
              <IcoClose />
            </button>
          </div>

          {/* Búsqueda móvil */}
          <div className="pl-mob-search">
            <form className="pl-mob-search-row" onSubmit={handleSearch}>
              <span style={{ color:"var(--ps-400)", display:"flex" }}><IcoSearch /></span>
              <input
                className="pl-mob-search-input"
                placeholder="Buscar productos..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
              />
            </form>
          </div>

          {/* Nav móvil */}
          <nav className="pl-mob-nav">

            <div className="pl-mob-section-label">Navegación</div>
            {NAV_LINKS.map(l => (
              <button key={l.path}
                className={`pl-mob-link${isActive(l.path) ? " active" : ""}`}
                onClick={() => navigate(l.path)}>
                {l.label}
              </button>
            ))}

            <div className="pl-mob-section-label" style={{ marginTop:8 }}>Categorías</div>
            {CATEGORIES.map(c => (
              <button key={c.path} className="pl-mob-cat-item"
                onClick={() => navigate(c.path)}>
                <span className="pl-mob-cat-emoji">{c.emoji}</span>
                {c.label}
              </button>
            ))}

          </nav>

          {/* Footer móvil */}
          <div className="pl-mob-footer">
            {user ? (
              <>
                <button className="pl-mob-btn-login"
                  onClick={() => navigate("/customer/profile")}>
                  Mi cuenta →
                </button>
                <button className="pl-mob-btn-login" style={{ color:"var(--pred)", borderColor:"var(--pred-bdr)" }}
                  onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <button className="pl-mob-btn-login" onClick={() => navigate("/login")}>
                  Iniciar sesión
                </button>
                <button className="pl-mob-btn-register" onClick={() => navigate("/register")}>
                  Crear cuenta gratis
                </button>
              </>
            )}
          </div>

        </div>

        {/* ════════════════════════════════════════
            CONTENIDO DE PÁGINAS HIJAS
        ════════════════════════════════════════ */}
        <main className="pl-main">
          <Outlet />
        </main>

        {/* ════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════ */}
        <footer className="pl-footer">
          <div className="pl-footer-top">

            {/* Columna marca */}
            <div className="pl-ft-brand">
              <div className="pl-ft-logo">
                <LogoCatalogix size={30} />
                <span className="pl-ft-logo-name">Catalog<em>ix</em></span>
              </div>
              <p className="pl-ft-desc">
                La plataforma de catálogos digitales más completa. Conectamos vendedores y compradores en un mismo lugar.
              </p>
              <div className="pl-ft-contact">
                <div className="pl-ft-contact-item">
                  <IcoMapPin />
                  <span>Santo Domingo, República Dominicana</span>
                </div>
                <div className="pl-ft-contact-item">
                  <IcoPhone />
                  <a href="tel:+18095550000">+1 (809) 555-0000</a>
                </div>
                <div className="pl-ft-contact-item">
                  <IcoMail />
                  <a href="mailto:hola@catalogix.com">hola@catalogix.com</a>
                </div>
              </div>
              <div className="pl-ft-socials">
                {["𝕏","in","f","📷"].map((s, i) => (
                  <div key={i} className="pl-ft-social">{s}</div>
                ))}
              </div>
            </div>

            {/* Columna tienda */}
            <div>
              <div className="pl-ft-col-title">Tienda</div>
              <div className="pl-ft-col-links">
                {["Catálogos", "Productos nuevos", "Ofertas", "Más vendidos", "Búsqueda"].map(l => (
                  <button key={l} className="pl-ft-col-link"
                    onClick={() => navigate(l === "Búsqueda" ? "/search" : l === "Catálogos" ? "/catalogs" : "/home")}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Columna empresa */}
            <div>
              <div className="pl-ft-col-title">Empresa</div>
              <div className="pl-ft-col-links">
                {["Sobre nosotros", "Blog", "Trabaja con nosotros", "Prensa", "Contacto"].map(l => (
                  <button key={l} className="pl-ft-col-link">{l}</button>
                ))}
              </div>
            </div>

            {/* Columna newsletter */}
            <div>
              <div className="pl-ft-col-title">Newsletter</div>
              <div className="pl-ft-newsletter-title">¿Quieres las mejores ofertas?</div>
              <p className="pl-ft-newsletter-sub">
                Suscríbete y recibe descuentos exclusivos directamente en tu correo.
              </p>
              <div className="pl-ft-newsletter-row">
                <input
                  className="pl-ft-newsletter-input"
                  placeholder="tu@correo.com"
                  type="email"
                />
                <button className="pl-ft-newsletter-btn">Suscribir</button>
              </div>
              <div className="pl-ft-payments">
                {["Visa", "Mastercard", "PayPal", "Stripe"].map(p => (
                  <span key={p} className="pl-ft-pay-badge">{p}</span>
                ))}
              </div>
            </div>

          </div>

          <hr className="pl-footer-divider" />

          <div className="pl-footer-bottom">
            <span className="pl-fb-copy">
              © {new Date().getFullYear()} Catalogix · Todos los derechos reservados
            </span>
            <div className="pl-fb-links">
              <button className="pl-fb-link">Términos de uso</button>
              <button className="pl-fb-link">Privacidad</button>
              <button className="pl-fb-link">Cookies</button>
              <button className="pl-fb-link">Ayuda</button>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
