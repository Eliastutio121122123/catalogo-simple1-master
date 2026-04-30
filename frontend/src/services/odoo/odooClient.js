import authStore from "../../store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const TOKEN_KEY = "catalogix_token";
const REFRESH_KEY = "catalogix_refresh_token";
const USER_KEY = "catalogix_user";

let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) throw new Error("No refresh token");

  refreshPromise = (async () => {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const raw = await res.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!res.ok || !data || !data.ok) {
      throw new Error((data && data.error) || res.statusText || "Error de red");
    }

    const nextToken = data.data && data.data.token;
    const nextRefresh = data.data && data.data.refresh_token;
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken);
    if (nextRefresh) localStorage.setItem(REFRESH_KEY, nextRefresh);
    return nextToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Cliente HTTP base.
 * Agrega automaticamente el token JWT si existe en localStorage.
 */
async function request(method, endpoint, body = null, allowRetry = true) {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const raw = await res.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  // Backend esperado: { ok: true, data } o { ok: false, error }.
  if (!res.ok) {
    const errMsg = (data && data.error) || res.statusText || "Error de red";
    if (res.status === 401 && token && !endpoint.startsWith("/api/auth/") && allowRetry) {
      try {
        await refreshAccessToken();
        return await request(method, endpoint, body, false);
      } catch {
        authStore.clearSession();
        if (typeof window !== "undefined") {
          window.location.assign("/login");
        }
        throw new Error("Sesion expirada. Inicia sesion de nuevo.");
      }
    }
    throw new Error(errMsg);
  }
  if (!data || !data.ok) {
    throw new Error((data && data.error) || "Respuesta invalida del servidor");
  }

  return data.data;
}

export const api = {
  get:    (endpoint)        => request("GET",    endpoint),
  post:   (endpoint, body)  => request("POST",   endpoint, body),
  put:    (endpoint, body)  => request("PUT",    endpoint, body),
  patch:  (endpoint, body)  => request("PATCH",  endpoint, body),
  delete: (endpoint)        => request("DELETE", endpoint),
};
