import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import customerPortalService from "../services/odoo/customerPortalService";
import authService from "../services/odoo/authService";
import { CartContext } from "../context/CartContext";

// â”€â”€â”€ Iconos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const IcoUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoOrders = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IcoInvoices = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IcoStore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const IcoBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IcoCart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IcoSettings = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IcoLogout = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcoChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IcoMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IcoClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoPackage = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IcoAdmin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

// â”€â”€â”€ Logo Catalogix â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const LogoCatalogix = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="clg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e40af"/>
        <stop offset="100%" stopColor="#06b6d4"/>
      </linearGradient>
    </defs>
    <path d="M18 26 L30 26 L44 76 L88 76 L98 42 L34 42"
      stroke="url(#clg1)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="50" cy="88" r="6" fill="url(#clg1)"/>
    <circle cx="80" cy="88" r="6" fill="url(#clg1)"/>
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

// â”€â”€â”€ Links de navegaciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NAV_LINKS = [
  { label: "Mi Perfil",    path: "/customer/profile",  icon: IcoUser     },
  { label: "Mis Pedidos",  path: "/customer/orders",   icon: IcoOrders   },
  { label: "Facturas",     path: "/customer/invoices", icon: IcoInvoices },
  { label: "Notificaciones", path: "/customer/notifications", icon: IcoBell },
  { label: "Seguridad",    path: "/customer/change-password", icon: IcoSettings },
];

// â”€â”€â”€ Datos del cliente (reemplazar con authStore) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const EMPTY_USER = {
  name: "Cliente",
  email: "",
  avatar: "CL",
  avatarUrl: "",
  since: "Cliente",
};

const initialsFromName = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "CL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatNotifTime = (iso) =>
  iso ? new Date(iso).toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
// Componente Principal
export default function CustomerLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { cartCount = 0 } = useContext(CartContext) || {};

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [customerUser, setCustomerUser] = useState(EMPTY_USER);
  const [userRole, setUserRole] = useState(null);
  const [notifs,      setNotifs]      = useState([]);
  const [scrolled,    setScrolled]    = useState(false);

  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  // Cerrar dropdowns al cambiar ruta
  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const current = authService.getCurrentUser();
    setUserRole(current?.role || null);
  }, []);

  // Detectar scroll para sombra del header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Bloquear scroll del body con menÃº mÃ³vil abierto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Cargar perfil y notificaciones desde backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await customerPortalService.getProfile();
        const notifications = await customerPortalService.listNotifications(profile.partnerId);
        if (cancelled) return;
        const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || profile.fullName || "Cliente";
        setCustomerUser({
          name: fullName,
          email: profile.email || "",
          avatar: initialsFromName(fullName),
          avatarUrl: profile.avatarUrl || "",
          since: "Cliente",
        });
        setNotifs(Array.isArray(notifications) ? notifications : []);
      } catch {
        // no-op
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handler = async () => {
      try {
        const profile = await customerPortalService.getProfile();
        const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || profile.fullName || "Cliente";
        setCustomerUser((prev) => ({
          ...prev,
          name: fullName,
          email: profile.email || prev.email || "",
          avatar: initialsFromName(fullName),
          avatarUrl: profile.avatarUrl || "",
        }));
      } catch {
        // no-op
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("catalogix:profile-updated", handler);
      return () => window.removeEventListener("catalogix:profile-updated", handler);
    }
    return undefined;
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;
  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));

  const isActive = (path) => location.pathname === path;
  const normalizedRole = String(userRole || "").toLowerCase();
  const isVendor = normalizedRole === "vendor";
  const isAdmin = ["admin", "super admin", "superadmin", "administrator", "system"].includes(normalizedRole);

  const handleLogout = async () => {
    setMobileOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
    try {
      await authService.logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  // TÃ­tulo de la pÃ¡gina actual
  const pageLabel = NAV_LINKS.find(l => l.path === location.pathname)?.label ?? "Mi Cuenta";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Lexend:wght@600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }
        body { font-family: 'Nunito', sans-serif; background: #f8fafc; }

        /* â”€â”€ Variables â”€â”€ */
        :root {
          --c-blue-950: #0a1628;
          --c-blue-900: #0f2044;
          --c-blue-800: #1a3a6e;
          --c-blue-700: #1d4ed8;
          --c-blue-600: #2563eb;
          --c-blue-500: #3b82f6;
          --c-blue-400: #60a5fa;
          --c-blue-100: #dbeafe;
          --c-blue-50:  #eff6ff;
          --c-teal-600: #0891b2;
          --c-teal-500: #06b6d4;
          --c-teal-400: #22d3ee;
          --c-teal-300: #67e8f9;
          --c-white:    #ffffff;
          --c-slate-50: #f8fafc;
          --c-slate-100:#f1f5f9;
          --c-slate-200:#e2e8f0;
          --c-slate-300:#cbd5e1;
          --c-slate-400:#94a3b8;
          --c-slate-500:#64748b;
          --c-slate-600:#475569;
          --c-slate-700:#334155;
          --c-slate-800:#1e293b;
          --c-slate-900:#0f172a;
          --c-red:      #f87171;
          --c-red-bg:   rgba(248,113,113,0.07);
          --c-red-bdr:  rgba(248,113,113,0.22);
          --c-green:    #34d399;
          --c-amber:    #fbbf24;
          --header-h:   64px;
        }

        /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           LAYOUT RAÃZ
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
        .cl-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--c-slate-50);
        }

        /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           HEADER
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
        .cl-header {
          position: sticky;
          top: 0;
          z-index: 100;
          height: var(--header-h);
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cl-header.scrolled {
          border-bottom-color: var(--c-slate-200);
          box-shadow: 0 2px 20px rgba(15,23,42,0.06);
        }

        .cl-header-inner {
          max-width: 1280px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0 24px;
        }

        /* â”€â”€ Logo â”€â”€ */
        .cl-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          text-decoration: none;
          flex-shrink: 0;
          padding: 6px 0;
        }
        .cl-logo-name {
          font-family: 'Lexend', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: var(--c-slate-900);
          letter-spacing: -0.4px;
          line-height: 1;
        }
        .cl-logo-name em {
          font-style: normal;
          background: linear-gradient(90deg, var(--c-blue-600), var(--c-teal-500));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* â”€â”€ Nav desktop â”€â”€ */
        .cl-nav {
          display: none;
          align-items: center;
          gap: 2px;
          margin-left: 32px;
        }
        @media (min-width: 768px) { .cl-nav { display: flex; } }

        .cl-nav-link {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--c-slate-500);
          cursor: pointer;
          text-decoration: none;
          border: none;
          background: none;
          font-family: 'Nunito', sans-serif;
          transition: all 0.18s ease;
          position: relative;
          white-space: nowrap;
        }
        .cl-nav-link:hover {
          color: var(--c-blue-600);
          background: var(--c-blue-50);
        }
        .cl-nav-link.active {
          color: var(--c-blue-700);
          background: linear-gradient(135deg, rgba(37,99,235,0.09), rgba(6,182,212,0.06));
          font-weight: 700;
        }
        .cl-nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2.5px;
          background: linear-gradient(90deg, var(--c-blue-600), var(--c-teal-500));
          border-radius: 100px;
        }

        /* â”€â”€ Spacer â”€â”€ */
        .cl-spacer { flex: 1; }

        /* â”€â”€ Acciones del header â”€â”€ */
        .cl-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* BotÃ³n ir a la tienda */
        .cl-btn-store {
          display: none;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1.5px solid var(--c-slate-200);
          background: var(--c-white);
          font-size: 13px;
          font-weight: 700;
          color: var(--c-slate-600);
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        @media (min-width: 768px) { .cl-btn-store { display: flex; } }
        .cl-btn-store:hover {
          border-color: var(--c-blue-400);
          color: var(--c-blue-600);
          background: var(--c-blue-50);
        }

        .cl-btn-vendor {
          display: none;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1.5px solid rgba(6,182,212,0.25);
          background: rgba(6,182,212,0.08);
          font-size: 13px;
          font-weight: 800;
          color: var(--c-teal-600);
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        @media (min-width: 768px) { .cl-btn-vendor { display: flex; } }
        .cl-btn-vendor:hover {
          border-color: rgba(6,182,212,0.45);
          color: var(--c-teal-500);
          background: rgba(6,182,212,0.14);
        }

        .cl-btn-admin {
          display: none;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1.5px solid rgba(37,99,235,0.25);
          background: rgba(37,99,235,0.08);
          font-size: 13px;
          font-weight: 800;
          color: var(--c-blue-600);
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        @media (min-width: 768px) { .cl-btn-admin { display: flex; } }
        .cl-btn-admin:hover {
          border-color: rgba(37,99,235,0.45);
          color: var(--c-blue-700);
          background: rgba(37,99,235,0.14);
        }

        /* BotÃ³n carrito */
        .cl-cart-btn {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1.5px solid var(--c-slate-200);
          background: var(--c-white);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--c-slate-500);
          transition: all 0.2s;
        }
        .cl-cart-btn:hover {
          border-color: var(--c-blue-400);
          color: var(--c-blue-600);
          background: var(--c-blue-50);
        }
        .cl-cart-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 100px;
          background: linear-gradient(135deg, var(--c-blue-600), var(--c-teal-500));
          color: white;
          font-size: 10px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Nunito', sans-serif;
          border: 2px solid var(--c-white);
        }

        /* BotÃ³n notificaciones */
        .cl-notif-wrap { position: relative; }
        .cl-notif-btn {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1.5px solid var(--c-slate-200);
          background: var(--c-white);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--c-slate-500);
          transition: all 0.2s;
        }
        .cl-notif-btn:hover, .cl-notif-btn.open {
          border-color: var(--c-blue-400);
          color: var(--c-blue-600);
          background: var(--c-blue-50);
        }
        .cl-notif-dot {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--c-blue-600), var(--c-teal-500));
          border: 2px solid var(--c-white);
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.25); opacity: 0.8; }
        }

        /* Dropdown notificaciones */
        .cl-notif-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 340px;
          background: var(--c-white);
          border: 1px solid var(--c-slate-200);
          border-radius: 16px;
          box-shadow: 0 16px 48px rgba(15,23,42,0.12), 0 4px 16px rgba(15,23,42,0.06);
          overflow: hidden;
          animation: dropdown-in 0.18s ease;
          z-index: 200;
        }
        @keyframes dropdown-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .cl-notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px 12px;
          border-bottom: 1px solid var(--c-slate-100);
        }
        .cl-notif-title {
          font-size: 13.5px;
          font-weight: 800;
          color: var(--c-slate-900);
        }
        .cl-notif-mark {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--c-blue-600);
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          padding: 0;
          transition: color 0.2s;
        }
        .cl-notif-mark:hover { color: var(--c-teal-500); }
        .cl-notif-list { max-height: 300px; overflow-y: auto; }
        .cl-notif-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 13px 18px;
          border-bottom: 1px solid var(--c-slate-50);
          cursor: pointer;
          transition: background 0.15s;
          position: relative;
        }
        .cl-notif-item:hover { background: var(--c-slate-50); }
        .cl-notif-item:last-child { border-bottom: none; }
        .cl-notif-unread-bar {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, var(--c-blue-600), var(--c-teal-500));
        }
        .cl-notif-ico {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .cl-notif-ico.order   { background: linear-gradient(135deg,rgba(37,99,235,0.1),rgba(6,182,212,0.08));   color: var(--c-blue-600); }
        .cl-notif-ico.promo   { background: linear-gradient(135deg,rgba(251,191,36,0.12),rgba(251,191,36,0.06)); color: #d97706; }
        .cl-notif-ico.invoice { background: linear-gradient(135deg,rgba(52,211,153,0.12),rgba(52,211,153,0.06)); color: #059669; }
        .cl-notif-body { flex: 1; min-width: 0; }
        .cl-notif-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--c-slate-800);
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cl-notif-sub {
          font-size: 11.5px;
          color: var(--c-slate-400);
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cl-notif-time {
          font-size: 10.5px;
          color: var(--c-slate-300);
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .cl-notif-footer {
          padding: 11px 18px;
          text-align: center;
          border-top: 1px solid var(--c-slate-100);
          background: var(--c-slate-50);
        }
        .cl-notif-all {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--c-blue-600);
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          transition: color 0.2s;
        }
        .cl-notif-all:hover { color: var(--c-teal-500); }

        /* Avatar + dropdown de perfil */
        .cl-profile-wrap { position: relative; }
        .cl-avatar-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 5px 10px 5px 5px;
          border-radius: 12px;
          border: 1.5px solid var(--c-slate-200);
          background: var(--c-white);
          cursor: pointer;
          transition: all 0.2s;
        }
        .cl-avatar-btn:hover, .cl-avatar-btn.open {
          border-color: var(--c-blue-300);
          background: var(--c-blue-50);
        }
        .cl-avatar {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--c-blue-700), var(--c-teal-500));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          color: white;
          font-family: 'Lexend', sans-serif;
          flex-shrink: 0;
        }
        .cl-avatar.has-img {
          background-size: cover;
          background-position: center;
          color: transparent;
        }
        .cl-avatar-info { display: none; }
        @media (min-width: 640px) { .cl-avatar-info { display: block; } }
        .cl-avatar-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--c-slate-800);
          white-space: nowrap;
          line-height: 1.2;
        }
        .cl-avatar-role {
          font-size: 10.5px;
          color: var(--c-slate-400);
          font-weight: 500;
          white-space: nowrap;
        }
        .cl-chevron-ico {
          color: var(--c-slate-400);
          transition: transform 0.2s;
          flex-shrink: 0;
        }
        .cl-chevron-ico.open { transform: rotate(180deg); }

        /* Profile dropdown */
        .cl-profile-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 240px;
          background: var(--c-white);
          border: 1px solid var(--c-slate-200);
          border-radius: 16px;
          box-shadow: 0 16px 48px rgba(15,23,42,0.12);
          overflow: hidden;
          animation: dropdown-in 0.18s ease;
          z-index: 200;
        }
        .cl-profile-head {
          padding: 16px 18px 14px;
          border-bottom: 1px solid var(--c-slate-100);
          background: linear-gradient(135deg, rgba(37,99,235,0.03), rgba(6,182,212,0.03));
        }
        .cl-profile-head-name {
          font-size: 14px;
          font-weight: 800;
          color: var(--c-slate-900);
          margin-bottom: 2px;
        }
        .cl-profile-head-email {
          font-size: 12px;
          color: var(--c-slate-400);
          font-weight: 400;
        }
        .cl-profile-head-since {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 8px;
          font-size: 10.5px;
          font-weight: 700;
          color: var(--c-teal-600);
          background: rgba(6,182,212,0.08);
          border: 1px solid rgba(6,182,212,0.18);
          border-radius: 100px;
          padding: 3px 9px;
        }
        .cl-profile-menu { padding: 6px; }
        .cl-profile-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--c-slate-600);
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          font-family: 'Nunito', sans-serif;
          text-align: left;
          transition: all 0.15s;
        }
        .cl-profile-item:hover {
          background: var(--c-slate-50);
          color: var(--c-slate-800);
        }
        .cl-profile-item.logout {
          color: var(--c-red);
          margin-top: 2px;
        }
        .cl-profile-item.logout:hover {
          background: var(--c-red-bg);
          color: var(--c-red);
        }
        .cl-profile-separator {
          height: 1px;
          background: var(--c-slate-100);
          margin: 4px 12px;
        }

        /* Hamburger mÃ³vil */
        .cl-hamburger {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1.5px solid var(--c-slate-200);
          background: var(--c-white);
          cursor: pointer;
          color: var(--c-slate-600);
          transition: all 0.2s;
        }
        @media (min-width: 768px) { .cl-hamburger { display: none; } }
        .cl-hamburger:hover {
          border-color: var(--c-blue-400);
          color: var(--c-blue-600);
          background: var(--c-blue-50);
        }

        /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           BREADCRUMB
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
        .cl-breadcrumb-bar {
          background: var(--c-white);
          border-bottom: 1px solid var(--c-slate-100);
        }
        .cl-breadcrumb-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 10px 24px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cl-bc-item {
          font-size: 12.5px;
          font-weight: 500;
          color: var(--c-slate-400);
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'Nunito', sans-serif;
          padding: 0;
          transition: color 0.15s;
        }
        .cl-bc-item:hover { color: var(--c-blue-600); }
        .cl-bc-sep {
          font-size: 11px;
          color: var(--c-slate-300);
        }
        .cl-bc-current {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--c-slate-700);
        }

        /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           MAIN CONTENT
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
        .cl-main {
          flex: 1;
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
          padding: 32px 24px;
        }
        @media (max-width: 640px) {
          .cl-main { padding: 20px 16px; }
        }

        /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           FOOTER
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
        .cl-footer {
          background: var(--c-white);
          border-top: 1px solid var(--c-slate-100);
          padding: 20px 24px;
        }
        .cl-footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .cl-footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cl-footer-brand-name {
          font-family: 'Lexend', sans-serif;
          font-size: 14px;
          font-weight: 800;
          color: var(--c-slate-700);
        }
        .cl-footer-brand-name em {
          font-style: normal;
          background: linear-gradient(90deg, var(--c-blue-600), var(--c-teal-500));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .cl-footer-copy {
          font-size: 12px;
          color: var(--c-slate-400);
          font-weight: 400;
        }
        .cl-footer-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .cl-footer-link {
          font-size: 12px;
          font-weight: 600;
          color: var(--c-slate-400);
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'Nunito', sans-serif;
          transition: color 0.15s;
        }
        .cl-footer-link:hover { color: var(--c-blue-600); }

        /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           MOBILE MENU OVERLAY
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
        .cl-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.5);
          z-index: 150;
          backdrop-filter: blur(3px);
          animation: fade-in 0.2s ease;
        }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        .cl-overlay.open { display: block; }

        .cl-mobile-menu {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 280px;
          background: var(--c-white);
          z-index: 200;
          display: flex;
          flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          box-shadow: 4px 0 32px rgba(15,23,42,0.12);
        }
        .cl-mobile-menu.open { transform: translateX(0); }

        .cl-mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--c-slate-100);
        }
        .cl-mobile-close {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          border: 1.5px solid var(--c-slate-200);
          background: var(--c-white);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--c-slate-500);
          transition: all 0.2s;
        }
        .cl-mobile-close:hover {
          border-color: var(--c-red);
          color: var(--c-red);
          background: var(--c-red-bg);
        }

        /* Perfil en mobile */
        .cl-mobile-profile {
          padding: 18px 20px;
          border-bottom: 1px solid var(--c-slate-100);
          background: linear-gradient(135deg, rgba(37,99,235,0.03), rgba(6,182,212,0.03));
        }
        .cl-mobile-profile-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cl-mobile-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--c-blue-700), var(--c-teal-500));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          color: white;
          font-family: 'Lexend', sans-serif;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(29,78,216,0.25);
        }
        .cl-mobile-avatar.has-img {
          background-size: cover;
          background-position: center;
          color: transparent;
        }
        .cl-mobile-uname {
          font-size: 14.5px;
          font-weight: 800;
          color: var(--c-slate-900);
          margin-bottom: 2px;
        }
        .cl-mobile-uemail {
          font-size: 12px;
          color: var(--c-slate-400);
          font-weight: 400;
        }

        /* Nav en mobile */
        .cl-mobile-nav {
          flex: 1;
          padding: 12px 12px;
          overflow-y: auto;
        }
        .cl-mobile-section-label {
          font-size: 10.5px;
          font-weight: 800;
          color: var(--c-slate-400);
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 12px 8px 6px;
        }
        .cl-mobile-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 12px;
          border-radius: 11px;
          font-size: 14px;
          font-weight: 600;
          color: var(--c-slate-600);
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          font-family: 'Nunito', sans-serif;
          text-align: left;
          transition: all 0.15s;
          margin-bottom: 2px;
        }
        .cl-mobile-link:hover {
          background: var(--c-slate-50);
          color: var(--c-slate-800);
        }
        .cl-mobile-link.active {
          background: linear-gradient(135deg, rgba(37,99,235,0.09), rgba(6,182,212,0.06));
          color: var(--c-blue-700);
          font-weight: 700;
        }
        .cl-mobile-link-ico {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: var(--c-slate-100);
          color: var(--c-slate-500);
          transition: all 0.15s;
        }
        .cl-mobile-link.active .cl-mobile-link-ico {
          background: linear-gradient(135deg, var(--c-blue-600), var(--c-teal-500));
          color: white;
          box-shadow: 0 3px 10px rgba(29,78,216,0.25);
        }

        /* Footer del menÃº mobile */
        .cl-mobile-footer {
          padding: 12px;
          border-top: 1px solid var(--c-slate-100);
        }
        .cl-mobile-footer-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 11px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          width: 100%;
          font-family: 'Nunito', sans-serif;
          text-align: left;
          transition: all 0.15s;
          margin-bottom: 4px;
        }
        .cl-mobile-footer-btn.store {
          background: linear-gradient(135deg, rgba(37,99,235,0.08), rgba(6,182,212,0.06));
          color: var(--c-blue-700);
          border: 1.5px solid rgba(37,99,235,0.15);
        }
        .cl-mobile-footer-btn.store:hover {
          background: linear-gradient(135deg, rgba(37,99,235,0.14), rgba(6,182,212,0.1));
        }
        .cl-mobile-footer-btn.logout {
          background: none;
          color: var(--c-red);
          border: 1.5px solid var(--c-red-bdr);
        }
        .cl-mobile-footer-btn.logout:hover {
          background: var(--c-red-bg);
        }

        /* Scrollbar custom para el dropdown de notificaciones */
        .cl-notif-list::-webkit-scrollbar { width: 4px; }
        .cl-notif-list::-webkit-scrollbar-track { background: transparent; }
        .cl-notif-list::-webkit-scrollbar-thumb { background: var(--c-slate-200); border-radius: 100px; }
      `}</style>

      <div className="cl-root">

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            HEADER
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <header className={`cl-header${scrolled ? " scrolled" : ""}`}>
          <div className="cl-header-inner">

            {/* Logo */}
            <div className="cl-logo" onClick={() => navigate("/home")}>
              <LogoCatalogix size={30} />
              <span className="cl-logo-name">Catalog<em>ix</em></span>
            </div>

            {/* Nav desktop */}
            <nav className="cl-nav">
              {NAV_LINKS.map(link => (
                <button key={link.path}
                  className={`cl-nav-link${isActive(link.path) ? " active" : ""}`}
                  onClick={() => navigate(link.path)}>
                  <link.icon />
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="cl-spacer" />

            <div className="cl-actions">

              {/* Ir a la tienda */}
              <button className="cl-btn-store" onClick={() => navigate("/home")}>
                <IcoStore />
                Ver tienda
              </button>

              {/* Ir al panel de vendedor */}
              {isVendor && (
                <button className="cl-btn-vendor" onClick={() => navigate("/vendor/dashboard")}>
                  <IcoPackage />
                  Panel vendedor
                </button>
              )}

              {/* Ir al panel de admin */}
              {isAdmin && (
                <button className="cl-btn-admin" onClick={() => navigate("/admin/dashboard")}>
                  <IcoAdmin />
                  Panel admin
                </button>
              )}

              {/* Carrito */}
              <button className="cl-cart-btn" onClick={() => navigate("/cart")} title="Mi carrito">
                <IcoCart />
                {cartCount > 0 && (
                  <span className="cl-cart-badge">{cartCount > 99 ? "99+" : cartCount}</span>
                )}
              </button>

              {/* Notificaciones */}
              <div className="cl-notif-wrap" ref={notifRef}>
                <button
                  className={`cl-notif-btn${notifOpen ? " open" : ""}`}
                  onClick={() => { setNotifOpen(p => !p); setProfileOpen(false); }}
                  title="Notificaciones">
                  <IcoBell />
                  {unreadCount > 0 && <span className="cl-notif-dot" />}
                </button>

                {notifOpen && (
                  <div className="cl-notif-dropdown">
                    <div className="cl-notif-header">
                      <span className="cl-notif-title">
                        Notificaciones
                        {unreadCount > 0 && (
                          <span style={{
                            marginLeft: 8,
                            background: "linear-gradient(135deg,var(--c-blue-600),var(--c-teal-500))",
                            color: "white",
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "2px 7px",
                            borderRadius: 100,
                          }}>
                            {unreadCount}
                          </span>
                        )}
                      </span>
                      {unreadCount > 0 && (
                        <button className="cl-notif-mark" onClick={markAllRead}>
                          Marcar todas como leÃ­das
                        </button>
                      )}
                    </div>
                    <div className="cl-notif-list">
                      {notifs.map(n => (
                        <div className="cl-notif-item" key={n.id}>
                          {!n.read && <div className="cl-notif-unread-bar" />}
                          <div className={`cl-notif-ico ${n.type}`}>
                            {n.type === "order" && <IcoPackage />}
                            {n.type === "promo" && "ðŸŽ"}
                            {n.type === "invoice" && <IcoInvoices />}
                          </div>
                          <div className="cl-notif-body">
                            <div className="cl-notif-name" style={{ fontWeight: n.read ? 600 : 800 }}>
                              {n.title}
                            </div>
                            <div className="cl-notif-sub">{n.body || n.sub}</div>
                          </div>
                          <div className="cl-notif-time">{n.time || formatNotifTime(n.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="cl-notif-footer">
                      <button className="cl-notif-all" onClick={() => { setNotifOpen(false); navigate("/customer/notifications"); }}>
                        Ver todas →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar + dropdown */}
              <div className="cl-profile-wrap" ref={profileRef}>
                <button
                  className={`cl-avatar-btn${profileOpen ? " open" : ""}`}
                  onClick={() => { setProfileOpen(p => !p); setNotifOpen(false); }}>
                  <div className={`cl-avatar${customerUser.avatarUrl ? " has-img" : ""}`} style={customerUser.avatarUrl ? { backgroundImage: `url(${customerUser.avatarUrl})` } : undefined}>{customerUser.avatarUrl ? "" : customerUser.avatar}</div>
                  <div className="cl-avatar-info">
                    <div className="cl-avatar-name">{customerUser.name.split(" ")[0]}</div>
                    <div className="cl-avatar-role">Cliente</div>
                  </div>
                  <div className={`cl-chevron-ico${profileOpen ? " open" : ""}`}>
                    <IcoChevron />
                  </div>
                </button>

                {profileOpen && (
                  <div className="cl-profile-dropdown">
                    <div className="cl-profile-head">
                      <div className="cl-profile-head-name">{customerUser.name}</div>
                      <div className="cl-profile-head-email">{customerUser.email}</div>
                      <div className="cl-profile-head-since">
                        <IcoCheck />
                        {customerUser.since}
                      </div>
                    </div>
                    <div className="cl-profile-menu">
                      {isVendor && (
                        <>
                          <button className="cl-profile-item" onClick={() => { setProfileOpen(false); navigate("/vendor/dashboard"); }}>
                            <IcoPackage />
                            Panel vendedor
                          </button>
                          <div className="cl-profile-separator" />
                        </>
                      )}
                      {NAV_LINKS.map(link => (
                        <button key={link.path} className="cl-profile-item"
                          onClick={() => { setProfileOpen(false); navigate(link.path); }}>
                          <link.icon />
                          {link.label}
                        </button>
                      ))}
                      <div className="cl-profile-separator" />
                      <button className="cl-profile-item" onClick={() => { setProfileOpen(false); navigate("/customer/profile"); }}>
                        <IcoSettings />
                        ConfiguraciÃ³n
                      </button>
                      <button className="cl-profile-item logout" onClick={handleLogout}>
                        <IcoLogout />
                        Cerrar sesiÃ³n
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hamburger mobile */}
              <button className="cl-hamburger" onClick={() => setMobileOpen(true)}>
                <IcoMenu />
              </button>

            </div>
          </div>
        </header>

        {/* â”€â”€ Breadcrumb â”€â”€ */}
        <div className="cl-breadcrumb-bar">
          <div className="cl-breadcrumb-inner">
            <button className="cl-bc-item" onClick={() => navigate("/home")}>Inicio</button>
            <span className="cl-bc-sep">â€º</span>
            <button className="cl-bc-item" onClick={() => navigate("/customer/profile")}>Mi Cuenta</button>
            <span className="cl-bc-sep">â€º</span>
            <span className="cl-bc-current">{pageLabel}</span>
          </div>
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            CONTENIDO DE LA PÃGINA
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <main className="cl-main">
          <Outlet />
        </main>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            FOOTER
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <footer className="cl-footer">
          <div className="cl-footer-inner">
            <div>
              <div className="cl-footer-brand">
                <LogoCatalogix size={20} />
                <span className="cl-footer-brand-name">Catalog<em>ix</em></span>
              </div>
              <div className="cl-footer-copy" style={{ marginTop: 4 }}>
                Â© {new Date().getFullYear()} Catalogix Â· Todos los derechos reservados
              </div>
            </div>
            <div className="cl-footer-links">
              <button className="cl-footer-link">TÃ©rminos</button>
              <button className="cl-footer-link">Privacidad</button>
              <button className="cl-footer-link">Soporte</button>
              <button className="cl-footer-link" onClick={() => navigate("/home")}>Ir a la tienda</button>
            </div>
          </div>
        </footer>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            MENÃš MÃ“VIL
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className={`cl-overlay${mobileOpen ? " open" : ""}`} onClick={() => setMobileOpen(false)} />

        <div className={`cl-mobile-menu${mobileOpen ? " open" : ""}`}>

          {/* Header mobile */}
          <div className="cl-mobile-header">
            <div className="cl-logo">
              <LogoCatalogix size={26} />
              <span className="cl-logo-name" style={{ fontSize: 17 }}>Catalog<em>ix</em></span>
            </div>
            <button className="cl-mobile-close" onClick={() => setMobileOpen(false)}>
              <IcoClose />
            </button>
          </div>

          {/* Perfil mobile */}
          <div className="cl-mobile-profile">
            <div className="cl-mobile-profile-row">
              <div className={`cl-mobile-avatar${customerUser.avatarUrl ? " has-img" : ""}`} style={customerUser.avatarUrl ? { backgroundImage: `url(${customerUser.avatarUrl})` } : undefined}>{customerUser.avatarUrl ? "" : customerUser.avatar}</div>
              <div>
                <div className="cl-mobile-uname">{customerUser.name}</div>
                <div className="cl-mobile-uemail">{customerUser.email}</div>
              </div>
            </div>
          </div>

          {/* Nav mobile */}
          <nav className="cl-mobile-nav">
            <div className="cl-mobile-section-label">Mi Cuenta</div>
            {NAV_LINKS.map(link => (
              <button key={link.path}
                className={`cl-mobile-link${isActive(link.path) ? " active" : ""}`}
                onClick={() => navigate(link.path)}>
                <div className="cl-mobile-link-ico"><link.icon /></div>
                {link.label}
              </button>
            ))}
            {isVendor && (
              <>
                <div className="cl-mobile-section-label">Vendedor</div>
                <button
                  className={`cl-mobile-link${location.pathname.startsWith("/vendor") ? " active" : ""}`}
                  onClick={() => navigate("/vendor/dashboard")}
                >
                  <div className="cl-mobile-link-ico"><IcoPackage /></div>
                  Panel vendedor
                </button>
              </>
            )}
            {isAdmin && (
              <>
                <div className="cl-mobile-section-label">Admin</div>
                <button
                  className={`cl-mobile-link${location.pathname.startsWith("/admin") ? " active" : ""}`}
                  onClick={() => navigate("/admin/dashboard")}
                >
                  <div className="cl-mobile-link-ico"><IcoAdmin /></div>
                  Panel admin
                </button>
              </>
            )}
          </nav>

          {/* Footer mobile */}
          <div className="cl-mobile-footer">
            <button className="cl-mobile-footer-btn store" onClick={() => navigate("/home")}>
              <IcoStore />
              Ver tienda
            </button>
            <button className="cl-mobile-footer-btn logout" onClick={handleLogout}>
              <IcoLogout />
              Cerrar sesiÃ³n
            </button>
          </div>

        </div>

      </div>
    </>
  );
}
