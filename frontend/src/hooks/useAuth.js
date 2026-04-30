import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import authStore    from "../store/authStore";
import authService  from "../services/odoo/authService";

/**
 * useAuth — hook reactivo de autenticación.
 *
 * Re-renderiza el componente cada vez que cambia la sesión
 * (login, logout, refresh de token).
 *
 * Uso:
 *   const { isAuthenticated, user, role, logout } = useAuth();
 */
export default function useAuth() {
  const navigate = useNavigate();

  const [state, setState] = useState(() => ({
    isAuthenticated: authStore.isAuthenticated(),
    user: authStore.getUser(),
    role: authStore.getRole(),
  }));

  useEffect(() => {
    // Re-lee el estado cuando el store notifica un cambio.
    const unsub = authStore.subscribe(() => {
      setState({
        isAuthenticated: authStore.isAuthenticated(),
        user: authStore.getUser(),
        role: authStore.getRole(),
      });
    });
    return unsub;
  }, []);

  /** Cierra sesión: limpia localStorage y redirige a /login. */
  const logout = useCallback(async () => {
    await authService.logout();   // notifica al backend + llama clearSession → _notify
    navigate("/login", { replace: true });
  }, [navigate]);

  return {
    isAuthenticated: state.isAuthenticated,
    user:            state.user,
    role:            state.role,
    logout,
  };
}
