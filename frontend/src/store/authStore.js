// ─── authStore.js ────────────────────────────────────────────────────────────
// Estado global de autenticación (sin dependencias externas, solo localStorage).
// Cualquier componente puede suscribirse para re-renderizar al cambiar la sesión.

const TOKEN_KEY   = "catalogix_token";
const REFRESH_KEY = "catalogix_refresh_token";
const USER_KEY    = "catalogix_user";

// ── Estado interno ────────────────────────────────────────────────────────────
let _listeners = new Set();

function _notify() {
  _listeners.forEach((fn) => fn());
}

// ── Lectura directa desde localStorage ───────────────────────────────────────
function _readUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── API pública ───────────────────────────────────────────────────────────────
const authStore = {
  /** Suscribe un callback que se llama cuando cambia la sesión. */
  subscribe(fn) {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },

  /** ¿Hay un token guardado? */
  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /** Usuario actual del localStorage. */
  getUser() {
    return _readUser();
  },

  /** Rol del usuario en minúsculas. */
  getRole() {
    const user = _readUser();
    return String(user?.role || "").toLowerCase();
  },

  /**
   * Guarda sesión completa y notifica suscriptores.
   * Lo llama authService.login / googleSignIn internamente,
   * pero lo exponemos aquí para que guards/hooks sean reactivos.
   */
  setSession(token, user, refreshToken = "") {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    _notify();
  },

  /** Borra la sesión y notifica suscriptores. */
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    _notify();
  },
};

export default authStore;
