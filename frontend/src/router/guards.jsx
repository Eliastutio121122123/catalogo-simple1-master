import { Navigate, useLocation } from "react-router-dom";
import authStore from "../store/authStore";

/**
 * PrivateRoute — protege rutas que requieren autenticación.
 *
 * Props:
 *   children     — el componente a renderizar si la condición se cumple.
 *   requiredRole — "admin" | "vendor" | "customer" | string[] (opcional).
 *                  Si se omite, solo comprueba que el usuario esté logueado.
 *
 * Comportamiento:
 *   • No autenticado          → /login  (recuerda la ruta de origen con state.from)
 *   • Autenticado, rol incorrecto → /home
 *   • OK                      → renderiza children
 */
export function PrivateRoute({ children, requiredRole }) {
  const location = useLocation();
  const isAuthenticated = authStore.isAuthenticated();
  const role = authStore.getRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowedRoles = Array.isArray(requiredRole)
    ? requiredRole.map((r) => String(r).toLowerCase())
    : requiredRole
      ? [String(requiredRole).toLowerCase()]
      : null;

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirige a la home de su propio rol
    if (role === "admin")  return <Navigate to="/admin/dashboard"  replace />;
    if (role === "vendor") return <Navigate to="/vendor/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  return children;
}

/**
 * PublicRoute — rutas de auth (login, register…).
 * Si el usuario ya está logueado lo manda a su panel correspondiente.
 */
export function PublicRoute({ children }) {
  const isAuthenticated = authStore.isAuthenticated();
  const role = authStore.getRole();

  if (isAuthenticated) {
    if (role === "admin")  return <Navigate to="/admin/dashboard"  replace />;
    if (role === "vendor") return <Navigate to="/vendor/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  return children;
}
