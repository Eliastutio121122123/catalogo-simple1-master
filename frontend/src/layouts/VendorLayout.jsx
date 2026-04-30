import { useState, useEffect, useRef, Component } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import vendorProfileService from "../services/odoo/vendorProfileService";
import notificationService from "../services/odoo/notificationService";
import authService from "../services/odoo/authService";

// ─── Iconos ───────────────────────────────────────────────────────────────────
const IcoDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
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
const IcoPricing = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v10"/>
    <path d="M8 9c0-1.2 1.2-2 4-2s4 .8 4 2-1.2 2-4 2-4 .8-4 2 1.2 2 4 2 4-.8 4-2"/>
  </svg>
);
const IcoRules = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
    <line x1="4" y1="18" x2="20" y2="18"/>
    <circle cx="9" cy="6" r="2"/>
    <circle cx="15" cy="12" r="2"/>
    <circle cx="11" cy="18" r="2"/>
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
const IcoCustomers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoInventory = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 8h14M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm14 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/>
    <path d="M10 12h4"/>
  </svg>
);
const IcoInvoices = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IcoPromotions = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
class IcoCoupons extends Component {
  render() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/>
        <path d="M3 14v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/>
        <path d="M12 5v14"/>
        <path d="M9 8h.01"/>
        <path d="M15 16h.01"/>
      </svg>
    );
  }
}
const IcoReports = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
  </svg>
);
const IcoSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IcoBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IcoSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IcoCollapse = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
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
const IcoChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5"  y1="12" x2="19" y2="12"/>
  </svg>
);
const IcoTrendUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

// ─── Logo Catalogix ───────────────────────────────────────────────────────────
const LogoCatalogix = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="vlg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e40af"/>
        <stop offset="100%" stopColor="#06b6d4"/>
      </linearGradient>
    </defs>
    <path d="M18 26 L30 26 L44 76 L88 76 L98 42 L34 42"
      stroke="url(#vlg1)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="50" cy="88" r="6" fill="url(#vlg1)"/>
    <circle cx="80" cy="88" r="6" fill="url(#vlg1)"/>
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

// ─── Secciones del menú ───────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { label: "Dashboard",   path: "/vendor/dashboard",   icon: IcoDashboard  },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { label: "Productos",   path: "/vendor/products",    icon: IcoProducts   },
      { label: "Catálogos",   path: "/vendor/catalogs",    icon: IcoCatalogs   },


      { label: "Inventario",  path: "/vendor/inventory",   icon: IcoInventory  },
      { label: "Movimientos", path: "/vendor/inventory-movements", icon: IcoInventory },
    ],
  },
  {
    label: "Ventas",
    items: [
      { label: "Pedidos",     path: "/vendor/orders",      icon: IcoOrders     },
      { label: "Clientes",    path: "/vendor/customers",   icon: IcoCustomers  },
      { label: "Facturas",    path: "/vendor/invoices",    icon: IcoInvoices   },
      { label: "Cupones",     path: "/vendor/coupons",     icon: IcoCoupons    },
      { label: "Promociones", path: "/vendor/promotions",  icon: IcoPromotions },
    ],
  },
  {
    label: "Análisis",
    items: [
      { label: "Reportes",    path: "/vendor/reports",     icon: IcoReports    },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { label: "Notificaciones", path: "/vendor/notifications", icon: IcoBell },
      { label: "Configuración", path: "/vendor/settings", icon: IcoSettings   },
    ],
  },
];

// ─── Datos del vendedor (reemplazar con authStore) ────────────────────────────
const EMPTY_VENDOR = {
  name: "Vendedor",
  email: "",
  avatar: "VD",
  avatarUrl: "",
  plan: "Vendedor",
};

const initialsFromName = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "VD";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

// ─── Notificaciones de ejemplo ────────────────────────────────────────────────
class NotificationAdapter {
  toItems(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => this.toItem(row));
  }

  toItem(row) {
    const title = row?.title || row?.body || "Notificacion";
    return {
      id: row?.id,
      txt: title,
      dot: this.dotClass(row?.type),
      unread: !row?.read,
      createdAt: row?.createdAt,
    };
  }

  dotClass(type) {
    if (type === "order") return "teal";
    if (type === "inventory") return "amber";
    if (type === "invoice") return "green";
    return "blue";
  }
}

class NotificationTime {
  format(iso, _tick = 0) {
    if (!iso) return "";
    const raw = String(iso);
    const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
    const created = new Date(normalized);
    if (Number.isNaN(created.getTime())) return "";
    const diffMs = Date.now() - created.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "hace 1 min";
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH}h`;
    if (diffH < 48) return "ayer";
    return created.toLocaleDateString("es-DO", { day: "2-digit", month: "short" });
  }
}

const notifAdapter = new NotificationAdapter();
const notifTime = new NotificationTime();
class NotificationLoader {
  constructor(service, adapter) {
    this.service = service;
    this.adapter = adapter;
  }

  async load() {
    const rows = await this.service.list();
    return this.adapter.toItems(rows);
  }
}

const notifLoader = new NotificationLoader(notificationService, notifAdapter);

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function VendorLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [searchVal,   setSearchVal]   = useState("");
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [vendorUser,  setVendorUser]  = useState(EMPTY_VENDOR);
  const [notifs,      setNotifs]      = useState([]);
  const [timeTick,    setTimeTick]    = useState(0);

  const notifRef   = useRef(null);
  const profileRef = useRef(null);
  const aliveRef   = useRef(true);

  const loadVendorProfile = async () => {
    try {
      const profile = await vendorProfileService.getProfile();
      if (!aliveRef.current) return;
      const displayName = profile.storeName || profile.name || "Vendedor";
      setVendorUser({
        name: displayName,
        email: profile.email || "",
        avatar: initialsFromName(displayName),
        avatarUrl: profile.avatarUrl || "",
        plan: profile.plan || "Vendedor",
      });
    } catch {
      // no-op
    }
  };

  const loadNotifs = async () => {
    try {
      const items = await notifLoader.load();
      if (aliveRef.current) setNotifs(items);
    } catch {
      if (aliveRef.current) setNotifs([]);
    }
  };

  // Cerrar dropdowns al cambiar ruta
  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Bloquear scroll del body con menú móvil abierto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Cargar perfil del vendedor desde backend
  useEffect(() => {
    loadVendorProfile();
  }, []);

  useEffect(() => {
    const handler = () => loadVendorProfile();
    if (typeof window !== "undefined") {
      window.addEventListener("catalogix:profile-updated", handler);
      return () => window.removeEventListener("catalogix:profile-updated", handler);
    }
    return undefined;
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    loadNotifs();
    const poll = setInterval(loadNotifs, 60000);
    const tick = setInterval(() => {
      if (aliveRef.current) setTimeTick((t) => t + 1);
    }, 60000);
    return () => {
      aliveRef.current = false;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  const unreadCount = notifs.filter(n => n.unread).length;
  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
    } catch {
      // no-op
    }
    setNotifs((items) => items.map((x) => ({ ...x, unread: false })));
  };

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/vendor/dashboard" && location.pathname.startsWith(path));

  const handleLogout = async () => {
    setProfileOpen(false);
    try {
      await authService.logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const currentPage = NAV_SECTIONS
    .flatMap(s => s.items)
    .find(i => isActive(i.path))?.label ?? "Panel";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Lexend:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body, #root { height:100%; }
        body { font-family:'Nunito',sans-serif; background:#f1f5f9; }

        :root {
          --vt-950:#022c36; --vt-900:#04434f; --vt-800:#065f6e;
          --vt-700:#0e7490; --vt-600:#0891b2; --vt-500:#06b6d4;
          --vt-400:#22d3ee; --vt-300:#67e8f9; --vt-100:#cffafe; --vt-50:#ecfeff;
          --vb-700:#1d4ed8; --vb-600:#2563eb; --vb-400:#60a5fa;
          --vw:#ffffff;
          --vs-50:#f8fafc; --vs-100:#f1f5f9; --vs-200:#e2e8f0; --vs-300:#cbd5e1;
          --vs-400:#94a3b8; --vs-500:#64748b; --vs-600:#475569; --vs-700:#334155;
          --vs-800:#1e293b; --vs-900:#0f172a;
          --vred:#f87171; --vred-bg:rgba(248,113,113,0.07); --vred-bdr:rgba(248,113,113,0.22);
          --vamber:#fbbf24; --vgreen:#34d399;
          --sidebar-w:260px; --sidebar-w-coll:72px; --header-h:64px; --vtrans:0.25s ease;
        }

        /* ── Shell ── */
        .vs-shell { display:flex; min-height:100vh; background:var(--vs-100); }

        /* ── Overlay móvil ── */
        .vs-overlay {
          display:none; position:fixed; inset:0; z-index:40;
          background:rgba(2,44,54,0.65); backdrop-filter:blur(4px);
          animation:vsfade .2s ease;
        }
        @keyframes vsfade{from{opacity:0}to{opacity:1}}
        .vs-overlay.open{display:block;}
        @media(min-width:1024px){.vs-overlay{display:none!important;}}

        /* ════ SIDEBAR ════ */
        .vs-sidebar {
          position:fixed; top:0; left:0; bottom:0; z-index:50;
          width:var(--sidebar-w);
          background:var(--vt-950);
          display:flex; flex-direction:column;
          transition:width var(--vtrans),transform var(--vtrans);
          overflow:hidden;
          box-shadow:4px 0 28px rgba(0,0,0,0.3);
        }
        .vs-sidebar.collapsed{width:var(--sidebar-w-coll);}
        @media(max-width:1023px){
          .vs-sidebar{transform:translateX(-100%);width:var(--sidebar-w)!important;}
          .vs-sidebar.mob{transform:translateX(0);}
        }
        /* Patrón de puntos */
        .vs-sidebar::before{
          content:''; position:absolute; inset:0;
          background-image:radial-gradient(circle,rgba(6,182,212,.07) 1px,transparent 1px);
          background-size:22px 22px; pointer-events:none;
        }
        /* Orbe teal */
        .vs-sidebar::after{
          content:''; position:absolute;
          width:320px; height:320px; border-radius:50%;
          background:radial-gradient(circle,rgba(6,182,212,.22),transparent 68%);
          top:-100px; left:-100px; pointer-events:none; filter:blur(55px);
        }

        /* Header sidebar */
        .vs-sh {
          position:relative; z-index:1;
          display:flex; align-items:center;
          height:var(--header-h); padding:0 18px;
          border-bottom:1px solid rgba(255,255,255,.07);
          flex-shrink:0; gap:12px;
        }
        .vs-sh-brand {
          font-family:'Lexend',sans-serif; font-size:18px; font-weight:800;
          color:white; letter-spacing:-.4px; white-space:nowrap; overflow:hidden;
          transition:opacity var(--vtrans),width var(--vtrans);
        }
        .vs-sh-brand em{
          font-style:normal;
          background:linear-gradient(90deg,#22d3ee,#67e8f9);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .vs-sidebar.collapsed .vs-sh-brand{opacity:0;width:0;}

        .vs-vendor-badge{
          margin-left:auto; display:flex; align-items:center;
          font-size:9.5px; font-weight:800; color:var(--vt-400);
          background:rgba(6,182,212,.12); border:1px solid rgba(6,182,212,.25);
          border-radius:6px; padding:3px 8px;
          letter-spacing:.6px; text-transform:uppercase;
          white-space:nowrap; flex-shrink:0;
          transition:opacity var(--vtrans);
        }
        .vs-sidebar.collapsed .vs-vendor-badge{opacity:0;pointer-events:none;}

        .vs-collapse-btn{
          position:absolute; right:-12px; top:50%; transform:translateY(-50%);
          width:24px; height:24px; border-radius:50%;
          background:var(--vt-700); border:2px solid var(--vt-950);
          display:none; align-items:center; justify-content:center;
          cursor:pointer; color:white; transition:background .2s,transform .25s; z-index:10;
        }
        @media(min-width:1024px){.vs-collapse-btn{display:flex;}}
        .vs-collapse-btn:hover{background:var(--vt-600);}
        .vs-sidebar.collapsed .vs-collapse-btn{transform:translateY(-50%) rotate(180deg);}

        /* Búsqueda sidebar */
        .vs-sb-search{position:relative;z-index:1;padding:14px 14px 10px;flex-shrink:0;}
        .vs-sb-search-inner{
          display:flex;align-items:center;gap:9px;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);
          border-radius:10px;padding:9px 12px;transition:background .2s,border-color .2s;
        }
        .vs-sb-search-inner:focus-within{background:rgba(255,255,255,.1);border-color:rgba(6,182,212,.4);}
        .vs-sb-search-ico{color:rgba(255,255,255,.35);flex-shrink:0;display:flex;}
        .vs-sb-search-input{
          flex:1;background:none;border:none;outline:none;
          font-size:13px;font-weight:500;color:white;font-family:'Nunito',sans-serif;min-width:0;
        }
        .vs-sb-search-input::placeholder{color:rgba(255,255,255,.3);}
        .vs-sidebar.collapsed .vs-sb-search{display:none;}

        /* Nav */
        .vs-nav{
          flex:1;overflow-y:auto;padding:4px 10px 10px;
          scrollbar-width:thin;scrollbar-color:rgba(6,182,212,.2) transparent;
        }
        .vs-nav::-webkit-scrollbar{width:3px;}
        .vs-nav::-webkit-scrollbar-thumb{background:rgba(6,182,212,.2);border-radius:100px;}
        .vs-nav-sec{margin-bottom:4px;}
        .vs-nav-sec-lbl{
          font-size:9.5px;font-weight:800;color:rgba(255,255,255,.28);
          text-transform:uppercase;letter-spacing:1.2px;
          padding:12px 10px 5px;white-space:nowrap;overflow:hidden;
          transition:opacity var(--vtrans);
        }
        .vs-sidebar.collapsed .vs-nav-sec-lbl{opacity:0;}
        .vs-nav-item{
          display:flex;align-items:center;gap:11px;
          padding:10px 10px;border-radius:11px;
          cursor:pointer;margin-bottom:2px;
          color:rgba(255,255,255,.52);
          transition:background .18s,color .18s;
          position:relative;
        }
        .vs-nav-item:hover{background:rgba(255,255,255,.07);color:rgba(255,255,255,.88);}
        .vs-nav-item.active{
          background:linear-gradient(135deg,rgba(6,182,212,.2),rgba(14,116,144,.15));
          color:var(--vt-300);
          box-shadow:inset 0 0 0 1px rgba(6,182,212,.2);
        }
        .vs-nav-item.active::before{
          content:'';position:absolute;left:0;top:20%;bottom:20%;
          width:3px;border-radius:0 3px 3px 0;
          background:linear-gradient(180deg,var(--vt-400),var(--vt-600));
        }
        .vs-nav-ico{flex-shrink:0;display:flex;align-items:center;justify-content:center;width:22px;}
        .vs-nav-lbl{
          font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;
          transition:opacity var(--vtrans),width var(--vtrans);
        }
        .vs-sidebar.collapsed .vs-nav-lbl{opacity:0;width:0;}
        /* Tooltip colapsado */
        .vs-nav-item[data-tip]::after{
          content:attr(data-tip);
          position:absolute;left:calc(100% + 12px);top:50%;transform:translateY(-50%);
          background:var(--vs-800);color:white;
          font-size:12px;font-weight:600;padding:5px 10px;border-radius:8px;
          white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s;
          font-family:'Nunito',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.3);z-index:100;
        }
        .vs-sidebar.collapsed .vs-nav-item:hover::after{opacity:1;}

        /* Stats card */
        .vs-stats-card{
          position:relative;z-index:1;margin:8px 12px;
          padding:14px 16px;
          background:linear-gradient(135deg,rgba(6,182,212,.12),rgba(14,116,144,.1));
          border:1px solid rgba(6,182,212,.2);border-radius:14px;
          flex-shrink:0;overflow:hidden;
          transition:opacity var(--vtrans),height var(--vtrans);
        }
        .vs-sidebar.collapsed .vs-stats-card{opacity:0;pointer-events:none;height:0;margin:0;padding:0;border:none;}
        .vs-stats-lbl{font-size:10px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;}
        .vs-stats-row{display:flex;gap:12px;}
        .vs-stat{flex:1;}
        .vs-stat-val{font-family:'Lexend',sans-serif;font-size:18px;font-weight:800;color:white;line-height:1;}
        .vs-stat-sub{font-size:10px;font-weight:500;color:rgba(255,255,255,.35);margin-top:3px;}
        .vs-stat-trend{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;color:var(--vt-400);margin-top:2px;}

        /* Perfil sidebar */
        .vs-sp{position:relative;z-index:1;padding:12px;border-top:1px solid rgba(255,255,255,.07);flex-shrink:0;}
        .vs-sp-trigger{
          display:flex;align-items:center;gap:10px;
          padding:10px;border-radius:12px;cursor:pointer;
          width:100%;background:none;border:none;transition:background .2s;font-family:'Nunito',sans-serif;
        }
        .vs-sp-trigger:hover{background:rgba(255,255,255,.07);}
        .vs-sp-avatar{
          width:34px;height:34px;border-radius:10px;flex-shrink:0;
          background:linear-gradient(135deg,var(--vt-700),var(--vt-500));
          display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:800;color:white;font-family:'Lexend',sans-serif;
          box-shadow:0 3px 10px rgba(6,182,212,.3);
        }
        .vs-sp-avatar.has-img{
          background-size:cover;
          background-position:center;
          color:transparent;
        }
        .vs-sp-info{flex:1;min-width:0;text-align:left;transition:opacity var(--vtrans);}
        .vs-sidebar.collapsed .vs-sp-info{opacity:0;width:0;overflow:hidden;}
        .vs-sp-name{font-size:13px;font-weight:700;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .vs-sp-role{font-size:11px;font-weight:500;color:rgba(255,255,255,.38);white-space:nowrap;}
        .vs-sp-chev{color:rgba(255,255,255,.3);flex-shrink:0;transition:transform .2s,opacity var(--vtrans);}
        .vs-sp-chev.open{transform:rotate(180deg);}
        .vs-sidebar.collapsed .vs-sp-chev{opacity:0;}

        /* Dropdown perfil sidebar */
        .vs-sp-dd{
          position:absolute;bottom:calc(100% + 4px);left:12px;right:12px;
          background:var(--vs-800);border:1px solid rgba(255,255,255,.1);
          border-radius:14px;overflow:hidden;
          box-shadow:0 -8px 32px rgba(0,0,0,.4);
          animation:vsup .18s ease;z-index:200;
        }
        @keyframes vsup{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .vs-sp-dd-email{padding:12px 16px 10px;font-size:12px;color:rgba(255,255,255,.4);font-weight:500;border-bottom:1px solid rgba(255,255,255,.06);}
        .vs-sp-dd-menu{padding:6px;}
        .vs-sp-dd-item{
          display:flex;align-items:center;gap:10px;
          padding:10px 12px;border-radius:9px;
          font-size:13.5px;font-weight:600;color:rgba(255,255,255,.7);
          cursor:pointer;border:none;background:none;
          width:100%;font-family:'Nunito',sans-serif;text-align:left;
          transition:background .15s,color .15s;
        }
        .vs-sp-dd-item:hover{background:rgba(255,255,255,.08);color:white;}
        .vs-sp-dd-sep{height:1px;background:rgba(255,255,255,.07);margin:4px 12px;}
        .vs-sp-dd-item.danger{color:var(--vred);}
        .vs-sp-dd-item.danger:hover{background:rgba(248,113,113,.1);}

        /* ════ MAIN ════ */
        .vs-main{
          flex:1;margin-left:var(--sidebar-w);
          transition:margin-left var(--vtrans);
          display:flex;flex-direction:column;min-height:100vh;min-width:0;
        }
        .vs-main.collapsed{margin-left:var(--sidebar-w-coll);}
        @media(max-width:1023px){.vs-main,.vs-main.collapsed{margin-left:0;}}

        /* ════ TOPBAR ════ */
        .vs-topbar{
          position:sticky;top:0;z-index:30;height:var(--header-h);
          background:rgba(255,255,255,.93);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
          border-bottom:1px solid var(--vs-200);box-shadow:0 1px 16px rgba(15,23,42,.05);
          display:flex;align-items:center;padding:0 24px;gap:16px;flex-shrink:0;
        }

        .vs-mob-btn{
          display:none;align-items:center;justify-content:center;
          width:38px;height:38px;border-radius:10px;
          border:1.5px solid var(--vs-200);background:var(--vw);
          cursor:pointer;color:var(--vs-600);flex-shrink:0;transition:all .2s;
        }
        @media(max-width:1023px){.vs-mob-btn{display:flex;}}
        .vs-mob-btn:hover{border-color:var(--vt-500);color:var(--vt-600);background:var(--vt-50);}

        .vs-tb-title{flex:1;min-width:0;}
        .vs-tb-bc{font-size:11.5px;color:var(--vs-400);font-weight:500;display:flex;align-items:center;gap:5px;margin-bottom:2px;}
        .vs-tb-sep{color:var(--vs-300);font-size:11px;}
        .vs-tb-page{font-family:'Lexend',sans-serif;font-size:17px;font-weight:800;color:var(--vs-900);letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

        .vs-tb-search{
          display:none;align-items:center;gap:9px;
          background:var(--vs-50);border:1.5px solid var(--vs-200);
          border-radius:11px;padding:9px 14px;width:220px;flex-shrink:0;transition:all .2s;
        }
        @media(min-width:768px){.vs-tb-search{display:flex;}}
        .vs-tb-search:focus-within{border-color:var(--vt-500);background:var(--vw);box-shadow:0 0 0 3px rgba(6,182,212,.1);width:260px;}
        .vs-tb-search-ico{color:var(--vs-400);display:flex;flex-shrink:0;}
        .vs-tb-search-input{flex:1;background:none;border:none;outline:none;font-size:13px;font-weight:500;color:var(--vs-700);font-family:'Nunito',sans-serif;min-width:0;}
        .vs-tb-search-input::placeholder{color:var(--vs-400);font-weight:400;}

        .vs-tb-actions{display:flex;align-items:center;gap:8px;flex-shrink:0;}

        .vs-btn-new{
          display:none;align-items:center;gap:7px;
          padding:8px 14px;border-radius:10px;
          background:linear-gradient(135deg,var(--vt-700),var(--vt-500));
          border:none;cursor:pointer;color:white;
          font-size:13px;font-weight:700;font-family:'Nunito',sans-serif;
          box-shadow:0 3px 12px rgba(6,182,212,.3);
          transition:all .2s;white-space:nowrap;
        }
        @media(min-width:640px){.vs-btn-new{display:flex;}}
        .vs-btn-new:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(6,182,212,.4);}

        .vs-btn-store{
          display:none;align-items:center;gap:7px;
          padding:8px 14px;border-radius:10px;
          border:1.5px solid var(--vs-200);background:var(--vw);
          font-size:13px;font-weight:700;color:var(--vs-600);font-family:'Nunito',sans-serif;
          cursor:pointer;transition:all .2s;white-space:nowrap;
        }
        @media(min-width:1024px){.vs-btn-store{display:flex;}}
        .vs-btn-store:hover{border-color:var(--vt-500);color:var(--vt-600);background:var(--vt-50);}

        /* Notif */
        .vs-nw{position:relative;}
        .vs-nb{
          position:relative;width:40px;height:40px;border-radius:10px;
          border:1.5px solid var(--vs-200);background:var(--vw);
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;color:var(--vs-500);transition:all .2s;
        }
        .vs-nb:hover,.vs-nb.open{border-color:var(--vt-500);color:var(--vt-600);background:var(--vt-50);}
        .vs-nb-badge{
          position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;padding:0 4px;
          border-radius:100px;background:linear-gradient(135deg,var(--vt-700),var(--vt-500));
          color:white;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;
          font-family:'Nunito',sans-serif;border:2px solid white;
        }

        .vs-nd{
          position:absolute;top:calc(100% + 10px);right:0;width:330px;
          background:white;border:1px solid var(--vs-200);border-radius:16px;
          box-shadow:0 16px 48px rgba(15,23,42,.12);overflow:hidden;
          animation:vsdd .18s ease;z-index:200;
        }
        @keyframes vsdd{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        .vs-nd-hd{display:flex;align-items:center;justify-content:space-between;padding:14px 18px 10px;border-bottom:1px solid var(--vs-100);}
        .vs-nd-ttl{font-size:13.5px;font-weight:800;color:var(--vs-900);}
        .vs-nd-cnt{
          margin-left:8px;background:linear-gradient(135deg,var(--vt-700),var(--vt-500));
          color:white;font-size:10px;font-weight:800;padding:2px 7px;border-radius:100px;
        }
        .vs-nd-mk{font-size:11.5px;font-weight:700;color:var(--vt-600);background:none;border:none;cursor:pointer;font-family:'Nunito',sans-serif;padding:0;transition:color .2s;}
        .vs-nd-mk:hover{color:var(--vt-400);}
        .vs-nd-list{max-height:300px;overflow-y:auto;}
        .vs-nd-list::-webkit-scrollbar{width:3px;}
        .vs-nd-list::-webkit-scrollbar-thumb{background:var(--vs-200);border-radius:100px;}
        .vs-nd-item{
          display:flex;align-items:flex-start;gap:11px;padding:12px 18px;
          border-bottom:1px solid var(--vs-50);cursor:pointer;transition:background .15s;position:relative;
        }
        .vs-nd-item:hover{background:var(--vs-50);}
        .vs-nd-item.unread::before{
          content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
          width:3px;height:60%;border-radius:0 3px 3px 0;
          background:linear-gradient(180deg,var(--vt-500),var(--vt-700));
        }
        .vs-nd-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px;}
        .vs-nd-dot.teal{background:var(--vt-500);}
        .vs-nd-dot.amber{background:var(--vamber);}
        .vs-nd-dot.green{background:var(--vgreen);}
        .vs-nd-dot.blue{background:#2563eb;}
        .vs-nd-body{flex:1;min-width:0;}
        .vs-nd-txt{font-size:13px;font-weight:600;color:var(--vs-800);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .vs-nd-item.unread .vs-nd-txt{font-weight:800;}
        .vs-nd-time{font-size:11px;color:var(--vs-400);font-weight:500;}
        .vs-nd-ft{padding:10px 18px;text-align:center;border-top:1px solid var(--vs-100);background:var(--vs-50);}
        .vs-nd-all{font-size:12.5px;font-weight:700;color:var(--vt-600);background:none;border:none;cursor:pointer;font-family:'Nunito',sans-serif;transition:color .2s;}
        .vs-nd-all:hover{color:var(--vt-400);}

        /* Avatar topbar */
        .vs-pw{position:relative;}
        .vs-tb-av-btn{
          display:flex;align-items:center;gap:9px;padding:5px 10px 5px 5px;
          border-radius:11px;border:1.5px solid var(--vs-200);background:var(--vw);
          cursor:pointer;transition:all .2s;
        }
        .vs-tb-av-btn:hover,.vs-tb-av-btn.open{border-color:var(--vt-400);background:var(--vt-50);}
        .vs-tb-av{
          width:30px;height:30px;border-radius:8px;
          background:linear-gradient(135deg,var(--vt-700),var(--vt-500));
          display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:800;color:white;font-family:'Lexend',sans-serif;flex-shrink:0;
        }
        .vs-tb-av.has-img{
          background-size:cover;
          background-position:center;
          color:transparent;
        }
        .vs-tb-info{display:none;}
        @media(min-width:640px){.vs-tb-info{display:block;}}
        .vs-tb-name{font-size:13px;font-weight:700;color:var(--vs-800);white-space:nowrap;line-height:1.2;}
        .vs-tb-role{font-size:10.5px;color:var(--vs-400);font-weight:500;}
        .vs-tb-chev{color:var(--vs-400);transition:transform .2s;flex-shrink:0;}
        .vs-tb-chev.open{transform:rotate(180deg);}

        .vs-tb-dd{
          position:absolute;top:calc(100% + 10px);right:0;width:230px;
          background:white;border:1px solid var(--vs-200);border-radius:14px;
          box-shadow:0 12px 40px rgba(15,23,42,.12);overflow:hidden;
          animation:vsdd .18s ease;z-index:200;
        }
        .vs-tb-dd-hd{
          padding:14px 16px 12px;border-bottom:1px solid var(--vs-100);
          background:linear-gradient(135deg,rgba(6,182,212,.04),rgba(14,116,144,.03));
        }
        .vs-tb-dd-name{font-size:13.5px;font-weight:800;color:var(--vs-900);margin-bottom:2px;}
        .vs-tb-dd-email{font-size:12px;color:var(--vs-400);font-weight:400;}
        .vs-tb-dd-plan{
          display:inline-flex;align-items:center;gap:5px;margin-top:8px;
          font-size:10.5px;font-weight:700;color:var(--vt-600);
          background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.18);
          border-radius:100px;padding:3px 9px;
        }
        .vs-tb-dd-menu{padding:6px;}
        .vs-tb-dd-item{
          display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:9px;
          font-size:13.5px;font-weight:600;color:var(--vs-600);
          cursor:pointer;border:none;background:none;
          width:100%;font-family:'Nunito',sans-serif;text-align:left;transition:all .15s;
        }
        .vs-tb-dd-item:hover{background:var(--vs-50);color:var(--vs-800);}
        .vs-tb-dd-sep{height:1px;background:var(--vs-100);margin:4px 12px;}
        .vs-tb-dd-item.logout{color:var(--vred);}
        .vs-tb-dd-item.logout:hover{background:var(--vred-bg);}

        /* ════ CONTENT ════ */
        .vs-content{flex:1;padding:28px;overflow-y:auto;}
        @media(max-width:640px){.vs-content{padding:20px 16px;}}
      `}</style>

      <div className="vs-shell">

        {/* Overlay móvil */}
        <div className={`vs-overlay${mobileOpen ? " open" : ""}`}
          onClick={() => setMobileOpen(false)} />

        {/* ════ SIDEBAR ════ */}
        <aside className={`vs-sidebar${collapsed ? " collapsed" : ""}${mobileOpen ? " mob" : ""}`}>

          {/* Header */}
          <div className="vs-sh">
            <LogoCatalogix size={32} />
            <span className="vs-sh-brand">Catalog<em>ix</em></span>
            <span className="vs-vendor-badge">Vendedor</span>
            <button className="vs-collapse-btn" onClick={() => setCollapsed(c => !c)}>
              <IcoCollapse />
            </button>
          </div>

          {/* Búsqueda */}
          <div className="vs-sb-search">
            <div className="vs-sb-search-inner">
              <span className="vs-sb-search-ico"><IcoSearch /></span>
              <input
                className="vs-sb-search-input"
                placeholder="Buscar..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
              />
            </div>
          </div>

          {/* Nav */}
          <nav className="vs-nav">
            {NAV_SECTIONS.map(section => {
              const filtered = section.items.filter(item =>
                !searchVal || item.label.toLowerCase().includes(searchVal.toLowerCase())
              );
              if (!filtered.length) return null;
              return (
                <div key={section.label} className="vs-nav-sec">
                  <div className="vs-nav-sec-lbl">{section.label}</div>
                  {filtered.map(item => (
                    <div
                      key={item.path}
                      className={`vs-nav-item${isActive(item.path) ? " active" : ""}`}
                      data-tip={item.label}
                      onClick={() => navigate(item.path)}
                    >
                      <span className="vs-nav-ico"><item.icon /></span>
                      <span className="vs-nav-lbl">{item.label}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </nav>

          {/* Stats */}
          <div className="vs-stats-card">
            <div className="vs-stats-lbl">Este mes</div>
            <div className="vs-stats-row">
              <div className="vs-stat">
                <div className="vs-stat-val">$8.4k</div>
                <div className="vs-stat-sub">Ventas</div>
                <div className="vs-stat-trend"><IcoTrendUp />+12%</div>
              </div>
              <div className="vs-stat">
                <div className="vs-stat-val">34</div>
                <div className="vs-stat-sub">Pedidos</div>
                <div className="vs-stat-trend"><IcoTrendUp />+5</div>
              </div>
            </div>
          </div>

          {/* Perfil */}
          <div className="vs-sp">
            {profileOpen && (
              <div className="vs-sp-dd">
                <div className="vs-sp-dd-email">{vendorUser.email}</div>
                <div className="vs-sp-dd-menu">
                  <button className="vs-sp-dd-item" onClick={() => navigate("/vendor/settings")}>
                    <IcoSettings />Configuración
                  </button>
                  <button className="vs-sp-dd-item" onClick={() => navigate("/home")}>
                    <IcoStore />Ver tienda
                  </button>
                  <div className="vs-sp-dd-sep" />
                  <button className="vs-sp-dd-item danger" onClick={handleLogout}>
                    <IcoLogout />Cerrar sesión
                  </button>
                </div>
              </div>
            )}
            <button className="vs-sp-trigger"
              onClick={e => { e.stopPropagation(); setProfileOpen(p => !p); setNotifOpen(false); }}>
              <div
                className={`vs-sp-avatar${vendorUser.avatarUrl ? " has-img" : ""}`}
                style={vendorUser.avatarUrl ? { backgroundImage: `url(${vendorUser.avatarUrl})` } : undefined}
              >
                {vendorUser.avatarUrl ? "" : vendorUser.avatar}
              </div>
              <div className="vs-sp-info">
                <div className="vs-sp-name">{vendorUser.name}</div>
                <div className="vs-sp-role">{vendorUser.plan}</div>
              </div>
              <div className={`vs-sp-chev${profileOpen ? " open" : ""}`}>
                <IcoChevronDown />
              </div>
            </button>
          </div>

        </aside>

        {/* ════ MAIN ════ */}
        <div className={`vs-main${collapsed ? " collapsed" : ""}`}>

          {/* Topbar */}
          <header className="vs-topbar">

            <button className="vs-mob-btn" onClick={() => setMobileOpen(o => !o)}>
              <IcoMenu />
            </button>

            <div className="vs-tb-title">
              <div className="vs-tb-bc">
                <span>Catalogix</span>
                <span className="vs-tb-sep">›</span>
                <span>Vendedor</span>
                <span className="vs-tb-sep">›</span>
                <span style={{ color:"var(--vs-600)", fontWeight:600 }}>{currentPage}</span>
              </div>
              <div className="vs-tb-page">{currentPage}</div>
            </div>

            <div className="vs-tb-search">
              <span className="vs-tb-search-ico"><IcoSearch /></span>
              <input className="vs-tb-search-input" placeholder="Buscar pedidos, productos..." />
            </div>

            <div className="vs-tb-actions">

              <button className="vs-btn-new" onClick={() => navigate("/vendor/products/new")}>
                <IcoPlus />Nuevo producto
              </button>

              <button className="vs-btn-store" onClick={() => navigate("/home")}>
                <IcoStore />Ver tienda
              </button>

              {/* Notificaciones */}
              <div className="vs-nw" ref={notifRef}>
                <button
                  className={`vs-nb${notifOpen ? " open" : ""}`}
                  onClick={() => {
                    setNotifOpen(n => {
                      const next = !n;
                      if (next) loadNotifs();
                      return next;
                    });
                    setProfileOpen(false);
                  }}
                >
                  <IcoBell />
                  {unreadCount > 0 && <span className="vs-nb-badge">{unreadCount}</span>}
                </button>

                {notifOpen && (
                  <div className="vs-nd">
                    <div className="vs-nd-hd">
                      <span className="vs-nd-ttl">
                        Notificaciones
                        {unreadCount > 0 && <span className="vs-nd-cnt">{unreadCount}</span>}
                      </span>
                      {unreadCount > 0 && (
                        <button className="vs-nd-mk" onClick={markAllRead}>Marcar todas</button>
                      )}
                    </div>
                    <div className="vs-nd-list">
                      {notifs.map(n => (
                        <div key={n.id} className={`vs-nd-item${n.unread ? " unread" : ""}`}>
                          <div className={`vs-nd-dot ${n.dot}`} />
                          <div className="vs-nd-body">
                            <div className="vs-nd-txt">{n.txt}</div>
                            <div className="vs-nd-time">{notifTime.format(n.createdAt, timeTick)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="vs-nd-ft">
                      <button className="vs-nd-all"
                        onClick={() => { setNotifOpen(false); navigate("/vendor/orders"); }}>
                        Ver todos los pedidos →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div className="vs-pw" ref={profileRef}>
                <button
                  className={`vs-tb-av-btn${profileOpen ? " open" : ""}`}
                  onClick={() => { setProfileOpen(p => !p); setNotifOpen(false); }}
                >
                  <div
                    className={`vs-tb-av${vendorUser.avatarUrl ? " has-img" : ""}`}
                    style={vendorUser.avatarUrl ? { backgroundImage: `url(${vendorUser.avatarUrl})` } : undefined}
                  >
                    {vendorUser.avatarUrl ? "" : vendorUser.avatar}
                  </div>
                  <div className="vs-tb-info">
                    <div className="vs-tb-name">{vendorUser.name}</div>
                    <div className="vs-tb-role">Vendedor</div>
                  </div>
                  <div className={`vs-tb-chev${profileOpen ? " open" : ""}`}>
                    <IcoChevronDown />
                  </div>
                </button>

                {profileOpen && (
                  <div className="vs-tb-dd">
                    <div className="vs-tb-dd-hd">
                      <div className="vs-tb-dd-name">{vendorUser.name}</div>
                      <div className="vs-tb-dd-email">{vendorUser.email}</div>
                      <div className="vs-tb-dd-plan">✦ {vendorUser.plan}</div>
                    </div>
                    <div className="vs-tb-dd-menu">
                      {NAV_SECTIONS.flatMap(s => s.items).slice(0, 4).map(item => (
                        <button key={item.path} className="vs-tb-dd-item"
                          onClick={() => { setProfileOpen(false); navigate(item.path); }}>
                          <item.icon />{item.label}
                        </button>
                      ))}
                      <div className="vs-tb-dd-sep" />
                      <button className="vs-tb-dd-item"
                        onClick={() => { setProfileOpen(false); navigate("/vendor/settings"); }}>
                        <IcoSettings />Configuración
                      </button>
                      <button className="vs-tb-dd-item logout" onClick={handleLogout}>
                        <IcoLogout />Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </header>

          {/* Contenido páginas hijas */}
          <main className="vs-content">
            <Outlet />
          </main>

        </div>
      </div>
    </>
  );
}

