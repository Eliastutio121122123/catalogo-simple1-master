import { api } from "./odooClient";
import authStore from "../../store/authStore";

// ─── Auth Service ─────────────────────────────────────────────────────────────
const authService = {

  /**
   * Inicia sesión contra Flask → Odoo.
   * Retorna el usuario y guarda el token en localStorage.
   */
  login: async (email, password) => {
    const data = await api.post("/api/auth/login", { email, password });
    authStore.setSession(data.token, data.user, data.refresh_token);
    return data.user;
  },

  /**
   * Google Sign-In (ID token exchange)
   */
  googleSignIn: async ({ credential, role = "customer" }) => {
    const data = await api.post("/api/auth/google", { credential, role });
    authStore.setSession(data.token, data.user, data.refresh_token);
    return data.user;
  },

  /**
   * Registra un nuevo usuario.
   */
  register: async ({ name, email, password, role = "customer", phone = "", company = "" }) => {
    const data = await api.post("/api/auth/register", {
      name,
      email,
      password,
      role,
      phone,
      company,
    });
    return data;
  },

  /**
   * Cierra sesión — borra el token local y notifica al backend.
   */
  logout: async () => {
    try { await api.post("/api/auth/logout"); } catch { /* silencioso */ }
    authStore.clearSession();
  },

  /**
   * Retorna el usuario guardado en localStorage (sin llamar al backend).
   */
  getCurrentUser: () => {
    return authStore.getUser();
  },

  /**
   * Retorna true si hay un token activo en localStorage.
   */
  isAuthenticated: () => authStore.isAuthenticated(),

  /**
   * Solicita recuperación de contraseña.
   */
  forgotPassword: async (email) => {
    return await api.post("/api/auth/forgot-password", { email });
  },

  /**
   * Restablece la contraseña con el token del email.
   */
  resetPassword: async (token, newPassword) => {
    return await api.post("/api/auth/reset-password", { token, password: newPassword });
  },

  /**
   * Valida si el token de recuperacion sigue siendo valido.
   */
  validateResetToken: async (token) => {
    return await api.post("/api/auth/validate-reset-token", { token });
  },

  /**
   * Verifica el email con el código recibido.
   */
  verifyEmail: async (code) => {
    return await api.post("/api/auth/verify-email", { code });
  },
};

export default authService;
