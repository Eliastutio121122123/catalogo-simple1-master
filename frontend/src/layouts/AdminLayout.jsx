import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import authService from "../services/odoo/authService";
import { api } from "../services/odoo/odooClient";

// ─── Iconos ───────────────────────────────────────────────────────────────────
const IcoDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IcoUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoVendors = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
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
const IcoProducts = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IcoCatalogs = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const IcoReports = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IcoAudit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="15" x2="15" y2="15"/>
    <line x1="9" y1="11" x2="15" y2="11"/>
  </svg>
);
const IcoSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2"/>
  </svg>
);
const IcoPayments = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IcoBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IcoSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IcoChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcoLogout = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcoStore = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const IcoVendorPanel = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IcoCollapse = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

// ─── Logo Catalogix ───────────────────────────────────────────────────────────
const LogoCatalogix = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="alg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e40af"/>
        <stop offset="100%" stopColor="#06b6d4"/>
      </linearGradient>
    </defs>
    <path d="M18 26 L30 26 L44 76 L88 76 L98 42 L34 42"
      stroke="url(#alg1)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="50" cy="88" r="6" fill="url(#alg1)"/>
    <circle cx="80" cy="88" r="6" fill="url(#alg1)"/>
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

// ─── Estructura del menú de navegación ───────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { label: "Dashboard",    path: "/admin/dashboard", icon: IcoDashboard },
    ],
  },
  {
    label: "Gestión",
    items: [
      { label: "Usuarios",     path: "/admin/users",     icon: IcoUsers    },
      { label: "Vendedores",   path: "/admin/vendors",   icon: IcoVendors  },
      { label: "Catálogos",    path: "/admin/catalogs",  icon: IcoCatalogs },
      { label: "Productos",    path: "/admin/products",  icon: IcoProducts },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { label: "Pedidos",      path: "/admin/orders",    icon: IcoOrders   },
      { label: "Pagos",        path: "/admin/payments",  icon: IcoPayments },
    ],
  },
  {
    label: "Análisis",
    items: [
      { label: "Reportes",     path: "/admin/reports",   icon: IcoReports  },
      { label: "Auditoría",    path: "/admin/audit",     icon: IcoAudit    },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Configuración", path: "/admin/settings", icon: IcoSettings },
    ],
  },
];

// ─── Datos simulados del admin (reemplazar con authStore cuando esté listo) ──
const ADMIN_USER = {
  name:   "Administrador",
  email:  "admin@catalogix.com",
  avatar: "AD",
  avatarUrl: "",
  role:   "Super Admin",
};

const toTitleCase = (value) => {
  const str = String(value || "").trim();
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const roleLabel = (role) => {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "admin") return "Super Admin";
  if (normalized === "vendor") return "Vendedor";
  if (normalized === "customer") return "Cliente";
  return toTitleCase(normalized || "Admin");
};

const initialsFromName = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "AD";
  const clean = raw.includes("@") ? raw.split("@")[0] : raw;
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const avatarFromUser = (raw) => {
  if (!raw) return "";
  if (raw.avatarUrl) return raw.avatarUrl;
  if (raw.image_128) return `data:image/png;base64,${raw.image_128}`;
  return "";
};

const buildAdminUser = (raw) => {
  if (!raw) return ADMIN_USER;
  const name = String(raw.name || raw.login || raw.email || ADMIN_USER.name);
  const email = String(raw.email || raw.login || ADMIN_USER.email);
  return {
    name,
    email,
    role: roleLabel(raw.role),
    avatar: initialsFromName(name || email),
    avatarUrl: avatarFromUser(raw),
  };
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [collapsed,    setCollapsed]    = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [searchVal,    setSearchVal]    = useState("");
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [adminUser,    setAdminUser]    = useState(ADMIN_USER);

  // Cerrar dropdowns al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handler = () => { setNotifOpen(false); setProfileOpen(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    const current = authService.getCurrentUser?.();
    if (current) setAdminUser(buildAdminUser(current));
  }, []);

  useEffect(() => {
    const refresh = async () => {
      try {
        const me = await api.get("/api/users/me");
        const next = buildAdminUser(me);
        setAdminUser(next);
        try {
          localStorage.setItem("catalogix_user", JSON.stringify(me));
        } catch {
          // no-op
        }
      } catch {
        // no-op
      }
    };
    const handler = () => refresh();
    refresh();
    if (typeof window !== "undefined") {
      window.addEventListener("catalogix:profile-updated", handler);
      return () => window.removeEventListener("catalogix:profile-updated", handler);
    }
    return undefined;
  }, []);

  const isActive = (path) => location.pathname === path ||
    (path !== "/admin/dashboard" && location.pathname.startsWith(path));

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  // Título de la página actual
  const currentPage = NAV_SECTIONS
    .flatMap(s => s.items)
    .find(i => isActive(i.path))?.label ?? "Panel";

  // Notificaciones simuladas
  const NOTIFS = [
    { id: 1, txt: "Nuevo vendedor registrado",    time: "hace 5 min",  dot: "blue", unread: true  },
    { id: 2, txt: "Pedido #1042 completado",       time: "hace 18 min", dot: "teal", unread: true  },
    { id: 3, txt: "Reporte mensual disponible",    time: "hace 1h",     dot: "blue", unread: false },
    { id: 4, txt: "Usuario reportado por abuso",   time: "hace 3h",     dot: "red",  unread: false },
  ];
  const unreadCount = NOTIFS.filter(n => n.unread).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Lexend:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }
        body { font-family: 'Nunito', sans-serif; background: #f1f5f9; }

        :root {
          --blue-950: #0a1628; --blue-900: #0f2044; --blue-800: #1a3a6e;
          --blue-700: #1d4ed8; --blue-600: #2563eb; --blue-500: #3b82f6;
          --blue-400: #60a5fa; --blue-100: #dbeafe;
          --teal-600: #0891b2; --teal-500: #06b6d4; --teal-400: #22d3ee;
          --teal-300: #67e8f9;
          --white:    #ffffff;
          --slate-50: #f8fafc; --slate-100: #f1f5f9; --slate-200: #e2e8f0;
          --slate-300: #cbd5e1; --slate-400: #94a3b8; --slate-500: #64748b;
          --slate-600: #475569; --slate-700: #334155; --slate-800: #1e293b;
          --slate-900: #0f172a;
          --sidebar-w:      260px;
          --sidebar-w-coll: 72px;
          --header-h:       64px;
          --transition:     0.25s ease;
        }

        /* ════════════════════════════════════════
           LAYOUT SHELL
        ════════════════════════════════════════ */
        .admin-shell {
          display: flex; min-height: 100vh;
          background: var(--slate-100);
        }

        /* ════════════════════════════════════════
           OVERLAY MÓVIL
        ════════════════════════════════════════ */
        .sidebar-overlay {
          display: none;
          position: fixed; inset: 0; z-index: 40;
          background: rgba(10,22,40,0.6);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .sidebar-overlay.open { display: block; }
        @media(min-width: 1024px) { .sidebar-overlay { display: none !important; } }

        /* ════════════════════════════════════════
           SIDEBAR
        ════════════════════════════════════════ */
        .sidebar {
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 50;
          width: var(--sidebar-w);
          background: var(--blue-950);
          display: flex; flex-direction: column;
          transition: width var(--transition), transform var(--transition);
          overflow: hidden;
          box-shadow: 4px 0 24px rgba(0,0,0,0.25);
        }
        .sidebar.collapsed { width: var(--sidebar-w-coll); }

        /* Móvil: oculto por defecto, slide-in al abrir */
        @media(max-width: 1023px) {
          .sidebar { transform: translateX(-100%); width: var(--sidebar-w) !important; }
          .sidebar.mobile-open { transform: translateX(0); }
        }

        /* Patrón de fondo sutil */
        .sidebar::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(34,211,238,0.06) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none;
        }

        /* Orbe decorativo */
        .sidebar::after {
          content: '';
          position: absolute;
          width: 280px; height: 280px; border-radius: 50%;
          background: radial-gradient(circle, rgba(29,78,216,0.35), transparent 70%);
          top: -80px; left: -80px;
          pointer-events: none; filter: blur(50px);
        }

        /* ── Sidebar header (logo) ── */
        .sidebar-header {
          position: relative; z-index: 1;
          display: flex; align-items: center;
          height: var(--header-h);
          padding: 0 18px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
          gap: 12px;
        }
        .sidebar-logo { flex-shrink: 0; }
        .sidebar-brand {
          font-family: 'Lexend', sans-serif;
          font-size: 18px; font-weight: 800;
          color: white; letter-spacing: -0.4px;
          white-space: nowrap;
          overflow: hidden;
          transition: opacity var(--transition), width var(--transition);
        }
        .sidebar-brand em {
          font-style: normal;
          background: linear-gradient(90deg, #22d3ee, #60a5fa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .sidebar.collapsed .sidebar-brand { opacity: 0; width: 0; }

        /* Botón colapsar */
        .collapse-btn {
          position: absolute; right: -12px; top: 50%; transform: translateY(-50%);
          width: 24px; height: 24px; border-radius: 50%;
          background: var(--blue-700);
          border: 2px solid var(--blue-950);
          color: white; cursor: pointer;
          display: none; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.25s;
          z-index: 2;
        }
        @media(min-width:1024px){ .collapse-btn { display: flex; } }
        .collapse-btn:hover { background: var(--blue-600); }
        .sidebar.collapsed .collapse-btn { transform: translateY(-50%) rotate(180deg); }

        /* Badge "Admin" */
        .admin-badge {
          display: inline-flex; align-items: center;
          background: linear-gradient(135deg, rgba(37,99,235,0.3), rgba(6,182,212,0.3));
          border: 1px solid rgba(6,182,212,0.2);
          border-radius: 100px; padding: 2px 8px;
          font-size: 9.5px; font-weight: 800;
          color: #67e8f9; letter-spacing: 1px; text-transform: uppercase;
          white-space: nowrap;
          transition: opacity var(--transition);
        }
        .sidebar.collapsed .admin-badge { opacity: 0; pointer-events: none; }

        /* ── Búsqueda en sidebar ── */
        .sidebar-search {
          position: relative; z-index: 1;
          padding: 14px 14px 8px;
          flex-shrink: 0;
          overflow: hidden;
        }
        .sidebar-search-inner {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 9px 12px;
          transition: all 0.2s;
          cursor: text;
        }
        .sidebar-search-inner:focus-within {
          background: rgba(255,255,255,0.09);
          border-color: rgba(6,182,212,0.3);
        }
        .sidebar-search-ico { color: rgba(255,255,255,0.3); flex-shrink: 0; display: flex; }
        .sidebar-search-input {
          background: none; border: none; outline: none;
          font-size: 13px; color: white; width: 100%;
          font-family: 'Nunito', sans-serif; font-weight: 500;
        }
        .sidebar-search-input::placeholder { color: rgba(255,255,255,0.25); }
        .sidebar.collapsed .sidebar-search { padding: 14px 10px 8px; }
        .sidebar.collapsed .sidebar-search-inner { justify-content: center; padding: 9px; }
        .sidebar.collapsed .sidebar-search-input { display: none; }

        /* ── Nav scrollable ── */
        .sidebar-nav {
          position: relative; z-index: 1;
          flex: 1; overflow-y: auto; overflow-x: hidden;
          padding: 6px 10px 10px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

        /* Sección del nav */
        .nav-section { margin-bottom: 6px; }
        .nav-section-label {
          font-size: 9.5px; font-weight: 800;
          color: rgba(255,255,255,0.22);
          text-transform: uppercase; letter-spacing: 1.4px;
          padding: 8px 8px 4px;
          white-space: nowrap; overflow: hidden;
          transition: opacity var(--transition);
        }
        .sidebar.collapsed .nav-section-label { opacity: 0; height: 0; padding: 0; margin: 0; }

        /* Item de nav */
        .nav-item {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 10px;
          border-radius: 11px;
          cursor: pointer;
          transition: all 0.18s ease;
          position: relative;
          margin-bottom: 2px;
          color: rgba(255,255,255,0.45);
          font-size: 13.5px; font-weight: 600;
          white-space: nowrap;
          text-decoration: none;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.85);
        }
        .nav-item.active {
          background: linear-gradient(135deg, rgba(37,99,235,0.35), rgba(6,182,212,0.2));
          color: white;
          border: 1px solid rgba(6,182,212,0.18);
          box-shadow: 0 2px 12px rgba(37,99,235,0.2);
        }
        .nav-item.active .nav-icon { color: #22d3ee; }

        /* Indicador activo */
        .nav-item.active::before {
          content: '';
          position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #3b82f6, #22d3ee);
          left: -10px;
        }

        .nav-icon { flex-shrink: 0; display: flex; transition: color 0.18s; }
        .nav-label {
          transition: opacity var(--transition);
          overflow: hidden;
        }
        .sidebar.collapsed .nav-label { opacity: 0; width: 0; overflow: hidden; }
        .sidebar.collapsed .nav-item { justify-content: center; padding: 10px; }

        /* Tooltip en modo colapsado */
        .sidebar.collapsed .nav-item { position: relative; }
        .sidebar.collapsed .nav-item:hover::after {
          content: attr(data-label);
          position: absolute; left: calc(100% + 12px); top: 50%;
          transform: translateY(-50%);
          background: var(--blue-800);
          color: white; font-size: 12px; font-weight: 600;
          padding: 6px 12px; border-radius: 8px;
          white-space: nowrap; pointer-events: none;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          z-index: 100;
        }

        /* ── Perfil usuario (sidebar bottom) ── */
        .sidebar-profile {
          position: relative; z-index: 1;
          flex-shrink: 0;
          padding: 12px 10px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .profile-trigger {
          display: flex; align-items: center; gap: 10px;
          padding: 10px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
          background: none; border: none; width: 100%;
          text-align: left;
        }
        .profile-trigger:hover { background: rgba(255,255,255,0.06); }
        .avatar {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, var(--blue-700), var(--teal-500));
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: white;
          font-family: 'Lexend', sans-serif;
          box-shadow: 0 2px 8px rgba(37,99,235,0.3);
        }
        .avatar.has-img {
          background-size: cover;
          background-position: center;
          color: transparent;
        }
        .profile-info { overflow: hidden; transition: opacity var(--transition); }
        .profile-name {
          font-size: 13px; font-weight: 700; color: white;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .profile-role {
          font-size: 11px; color: rgba(255,255,255,0.35); font-weight: 500;
          white-space: nowrap;
        }
        .sidebar.collapsed .profile-info { opacity: 0; width: 0; overflow: hidden; }
        .sidebar.collapsed .profile-trigger { justify-content: center; }

        /* Dropdown de perfil */
        .profile-dropdown {
          position: absolute; bottom: calc(100% + 8px); left: 10px; right: 10px;
          background: var(--blue-900);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 8px;
          box-shadow: 0 -8px 32px rgba(0,0,0,0.4);
          animation: dropUp 0.18s ease;
          z-index: 10;
        }
        @keyframes dropUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .profile-email {
          padding: 8px 10px 12px;
          font-size: 12px; color: rgba(255,255,255,0.35);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 6px;
        }
        .dropdown-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 9px;
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.6);
          cursor: pointer; transition: all 0.15s;
          background: none; border: none; width: 100%;
          font-family: 'Nunito', sans-serif;
          text-align: left;
        }
        .dropdown-item:hover { background: rgba(255,255,255,0.06); color: white; }
        .dropdown-item.danger { color: #f87171; }
        .dropdown-item.danger:hover { background: rgba(248,113,113,0.1); }
        .dropdown-sep { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }

        /* ════════════════════════════════════════
           MAIN CONTENT
        ════════════════════════════════════════ */
        .main {
          flex: 1;
          margin-left: var(--sidebar-w);
          transition: margin-left var(--transition);
          display: flex; flex-direction: column;
          min-height: 100vh; min-width: 0;
        }
        .main.collapsed { margin-left: var(--sidebar-w-coll); }
        @media(max-width:1023px){ .main { margin-left: 0 !important; } }

        /* ════════════════════════════════════════
           HEADER TOPBAR
        ════════════════════════════════════════ */
        .topbar {
          position: sticky; top: 0; z-index: 30;
          height: var(--header-h);
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--slate-200);
          display: flex; align-items: center;
          padding: 0 24px; gap: 16px;
          box-shadow: 0 2px 12px rgba(15,32,68,0.05);
        }

        /* Botón menú móvil */
        .mobile-menu-btn {
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer;
          color: var(--slate-600); padding: 8px; border-radius: 10px;
          transition: all 0.2s;
        }
        .mobile-menu-btn:hover { background: var(--slate-100); color: var(--blue-600); }
        @media(min-width:1024px){ .mobile-menu-btn { display: none; } }

        /* Breadcrumb / título */
        .topbar-title {
          display: flex; align-items: center; gap: 8px;
          flex: 1; min-width: 0;
        }
        .topbar-page {
          font-family: 'Lexend', sans-serif;
          font-size: 17px; font-weight: 800;
          color: var(--slate-900); letter-spacing: -0.3px;
        }
        .topbar-breadcrumb {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--slate-400); font-weight: 500;
        }
        .bc-sep { color: var(--slate-300); }

        /* Búsqueda en topbar */
        .topbar-search {
          display: none; position: relative;
        }
        @media(min-width:640px){ .topbar-search { display: flex; } }
        .topbar-search-ico {
          position: absolute; left:12px; top:50%; transform:translateY(-50%);
          color: var(--slate-400); display:flex; pointer-events:none;
        }
        .topbar-search-input {
          background: var(--slate-100); border: 1.5px solid var(--slate-200);
          border-radius: 100px; padding: 8px 16px 8px 36px;
          font-size: 13px; font-weight: 500; color: var(--slate-900);
          font-family: 'Nunito', sans-serif; outline: none;
          width: 220px; transition: all 0.2s;
        }
        .topbar-search-input::placeholder { color: var(--slate-400); font-weight: 400; }
        .topbar-search-input:focus {
          border-color: var(--blue-500); width: 280px;
          background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.09);
        }

        /* Acciones del topbar */
        .topbar-actions { display:flex; align-items:center; gap:8px; margin-left:auto; }

        /* Botón ir a la tienda */
        .store-btn {
          display: flex; align-items: center; gap: 7px;
          background: none; border: 1.5px solid var(--slate-200);
          border-radius: 100px; padding: 7px 14px;
          font-size: 12.5px; font-weight: 700; color: var(--slate-600);
          cursor: pointer; font-family: 'Nunito', sans-serif;
          transition: all 0.2s; white-space: nowrap;
        }
        .store-btn:hover { border-color: var(--blue-400); color: var(--blue-600); background: var(--blue-50, #eff6ff); }

        /* Botón panel vendedor */
        .vendor-btn {
          display: flex; align-items: center; gap: 7px;
          background: none; border: 1.5px solid var(--slate-200);
          border-radius: 100px; padding: 7px 14px;
          font-size: 12.5px; font-weight: 700; color: var(--slate-600);
          cursor: pointer; font-family: 'Nunito', sans-serif;
          transition: all 0.2s; white-space: nowrap;
        }
        .vendor-btn:hover { border-color: var(--teal-500, #06b6d4); color: var(--teal-600, #0891b2); background: rgba(6,182,212,0.05); }

        /* Botón notificaciones */
        .notif-btn {
          position: relative;
          background: none; border: none; cursor: pointer;
          color: var(--slate-500); padding: 9px; border-radius: 10px;
          display: flex; align-items: center; transition: all 0.2s;
        }
        .notif-btn:hover { background: var(--slate-100); color: var(--blue-600); }
        .notif-badge {
          position: absolute; top: 5px; right: 5px;
          width: 16px; height: 16px; border-radius: 50%;
          background: var(--blue-600); color: white;
          font-size: 9px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Nunito', sans-serif;
          border: 2px solid white;
        }

        /* Dropdown de notificaciones */
        .notif-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 340px;
          background: white; border: 1px solid var(--slate-200);
          border-radius: 18px; box-shadow: 0 16px 48px rgba(15,32,68,0.14);
          animation: dropDown 0.18s ease;
          z-index: 50; overflow: hidden;
        }
        @keyframes dropDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .notif-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 18px 12px;
          border-bottom: 1px solid var(--slate-100);
        }
        .notif-title { font-size: 14px; font-weight: 800; color: var(--slate-900); }
        .notif-mark {
          font-size: 12px; font-weight: 600; color: var(--blue-600);
          background: none; border: none; cursor: pointer; font-family: 'Nunito', sans-serif;
        }
        .notif-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 18px;
          border-bottom: 1px solid var(--slate-50);
          transition: background 0.15s;
          cursor: pointer;
        }
        .notif-item:hover { background: var(--slate-50); }
        .notif-item.unread { background: rgba(37,99,235,0.03); }
        .notif-dot {
          width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; margin-top: 5px;
        }
        .notif-dot.blue { background: var(--blue-500); }
        .notif-dot.teal { background: var(--teal-500); }
        .notif-dot.red  { background: #f87171; }
        .notif-txt { font-size: 13px; font-weight: 600; color: var(--slate-700); line-height: 1.4; }
        .notif-time { font-size: 11px; color: var(--slate-400); margin-top: 3px; }
        .notif-footer {
          padding: 12px 18px;
          text-align: center;
        }
        .notif-all {
          font-size: 13px; font-weight: 700; color: var(--blue-600);
          background: none; border: none; cursor: pointer; font-family: 'Nunito', sans-serif;
        }

        /* Avatar en topbar */
        .topbar-avatar-btn {
          display: flex; align-items: center; gap: 9px;
          background: none; border: none; cursor: pointer;
          padding: 5px 8px; border-radius: 12px; transition: background 0.2s;
        }
        .topbar-avatar-btn:hover { background: var(--slate-100); }
        .topbar-avatar {
          width: 34px; height: 34px; border-radius: 9px;
          background: linear-gradient(135deg, var(--blue-700), var(--teal-500));
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: white;
          font-family: 'Lexend', sans-serif;
        }
        .topbar-avatar.has-img {
          background-size: cover;
          background-position: center;
          color: transparent;
        }
        .topbar-name {
          font-size: 13px; font-weight: 700; color: var(--slate-700);
          display: none;
        }
        @media(min-width:640px){ .topbar-name { display: block; } }

        /* ════════════════════════════════════════
           CONTENT AREA
        ════════════════════════════════════════ */
        .content {
          flex: 1; padding: 28px 28px;
          overflow-y: auto;
        }
        @media(max-width:640px){ .content { padding: 20px 16px; } }

        /* ── Relative containers para dropdowns ── */
        .notif-wrap  { position: relative; }
        .profile-wrap-top { position: relative; }
      `}</style>

      <div className="admin-shell">

        {/* ── Overlay móvil ── */}
        <div
          className={`sidebar-overlay${mobileOpen ? " open" : ""}`}
          onClick={() => setMobileOpen(false)}
        />

        {/* ════════════════════════════════════════
            SIDEBAR
        ════════════════════════════════════════ */}
        <aside className={`sidebar${collapsed ? " collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}>

          {/* Header / Logo */}
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <LogoCatalogix size={32} />
            </div>
            <span className="sidebar-brand">Catalog<em>ix</em></span>
            <span className="admin-badge">Admin</span>

            {/* Botón colapsar (solo desktop) */}
            <button className="collapse-btn" onClick={() => setCollapsed(c => !c)}>
              <IcoCollapse />
            </button>
          </div>

          {/* Búsqueda */}
          <div className="sidebar-search">
            <div className="sidebar-search-inner">
              <span className="sidebar-search-ico"><IcoSearch /></span>
              <input
                className="sidebar-search-input"
                placeholder="Buscar..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
              />
            </div>
          </div>

          {/* Navegación */}
          <nav className="sidebar-nav">
            {NAV_SECTIONS.map(section => {
              const filtered = section.items.filter(item =>
                !searchVal || item.label.toLowerCase().includes(searchVal.toLowerCase())
              );
              if (!filtered.length) return null;
              return (
                <div key={section.label} className="nav-section">
                  <div className="nav-section-label">{section.label}</div>
                  {filtered.map(item => (
                    <div
                      key={item.path}
                      className={`nav-item${isActive(item.path) ? " active" : ""}`}
                      data-label={item.label}
                      onClick={() => navigate(item.path)}
                    >
                      <span className="nav-icon">
                        <item.icon />
                      </span>
                      <span className="nav-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </nav>

          {/* Perfil usuario */}
          <div className="sidebar-profile">
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-email">{adminUser.email}</div>
                <button className="dropdown-item" onClick={() => navigate("/admin/settings")}>
                  <IcoSettings /> Configuración
                </button>
                <button className="dropdown-item" onClick={() => navigate("/home")}>
                  <IcoStore /> Ver tienda
                </button>
                <button className="dropdown-item" onClick={() => navigate("/vendor/dashboard")}>
                  <IcoVendorPanel /> Panel vendedor
                </button>
                <div className="dropdown-sep" />
                <button className="dropdown-item danger" onClick={handleLogout}>
                  <IcoLogout /> Cerrar sesión
                </button>
              </div>
            )}
            <button
              className="profile-trigger"
              onClick={e => { e.stopPropagation(); setProfileOpen(p => !p); }}
            >
              <div
                className={`avatar${adminUser.avatarUrl ? " has-img" : ""}`}
                style={adminUser.avatarUrl ? { backgroundImage: `url(${adminUser.avatarUrl})` } : undefined}
              >
                {adminUser.avatarUrl ? "" : adminUser.avatar}
              </div>
              <div className="profile-info">
                <div className="profile-name">{adminUser.name}</div>
                <div className="profile-role">{adminUser.role}</div>
              </div>
            </button>
          </div>

        </aside>

        {/* ════════════════════════════════════════
            MAIN
        ════════════════════════════════════════ */}
        <div className={`main${collapsed ? " collapsed" : ""}`}>

          {/* ── Topbar ── */}
          <header className="topbar">

            {/* Botón menú móvil */}
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(o => !o)}>
              <IcoMenu />
            </button>

            {/* Título de la página */}
            <div className="topbar-title">
              <div>
                <div className="topbar-breadcrumb">
                  <span>Catalogix</span>
                  <span className="bc-sep">›</span>
                  <span>Admin</span>
                  <span className="bc-sep">›</span>
                  <span style={{ color: "var(--slate-600)", fontWeight: 600 }}>{currentPage}</span>
                </div>
                <div className="topbar-page">{currentPage}</div>
              </div>
            </div>

            {/* Búsqueda global */}
            <div className="topbar-search">
              <span className="topbar-search-ico"><IcoSearch /></span>
              <input className="topbar-search-input" placeholder="Buscar en el panel..." />
            </div>

            {/* Acciones */}
            <div className="topbar-actions">

              {/* Ir al panel vendedor */}
              <button className="vendor-btn" onClick={() => navigate("/vendor/dashboard")}>
                <IcoVendorPanel /> Panel vendedor
              </button>

              {/* Ir a la tienda */}
              <button className="store-btn" onClick={() => navigate("/home")}>
                <IcoStore /> Ver tienda
              </button>

              {/* Notificaciones */}
              <div className="notif-wrap">
                <button
                  className="notif-btn"
                  onClick={e => { e.stopPropagation(); setNotifOpen(n => !n); setProfileOpen(false); }}
                >
                  <IcoBell />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>

                {notifOpen && (
                  <div className="notif-dropdown" onClick={e => e.stopPropagation()}>
                    <div className="notif-header">
                      <span className="notif-title">Notificaciones</span>
                      <button className="notif-mark">Marcar todas</button>
                    </div>
                    {NOTIFS.map(n => (
                      <div key={n.id} className={`notif-item${n.unread ? " unread" : ""}`}>
                        <div className={`notif-dot ${n.dot}`} />
                        <div>
                          <div className="notif-txt">{n.txt}</div>
                          <div className="notif-time">{n.time}</div>
                        </div>
                      </div>
                    ))}
                    <div className="notif-footer">
                      <button className="notif-all">Ver todas las notificaciones →</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar / perfil */}
              <div className="profile-wrap-top">
                <button
                  className="topbar-avatar-btn"
                  onClick={e => { e.stopPropagation(); setProfileOpen(p => !p); setNotifOpen(false); }}
                >
                  <div
                    className={`topbar-avatar${adminUser.avatarUrl ? " has-img" : ""}`}
                    style={adminUser.avatarUrl ? { backgroundImage: `url(${adminUser.avatarUrl})` } : undefined}
                  >
                    {adminUser.avatarUrl ? "" : adminUser.avatar}
                  </div>
                  <span className="topbar-name">{adminUser.name}</span>
                </button>
              </div>

            </div>
          </header>

          {/* ── Contenido de las páginas hijas ── */}
          <main className="content">
            <Outlet />
          </main>

        </div>
      </div>
    </>
  );
}
