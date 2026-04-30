import { useEffect, useMemo, useRef, useState } from "react";
import authService from "../../services/odoo/authService";

/**
 * Renders a Google Identity Services button and exchanges the ID token with the backend.
 *
 * Requirements:
 * - frontend/index.html loads https://accounts.google.com/gsi/client
 * - VITE_GOOGLE_CLIENT_ID is set at build time
 * - backend has GOOGLE_LOGIN_ENABLED=true and GOOGLE_CLIENT_ID set
 */
export default function GoogleSignInButton({ role = "customer", onAuthed, onError, text = "continue_with" }) {
  const elRef = useRef(null);
  const [ready, setReady] = useState(false);

  const clientId = useMemo(() => import.meta.env.VITE_GOOGLE_CLIENT_ID || "", []);

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;
    let tries = 0;
    const tick = async () => {
      if (cancelled) return;
      // Wait for the GIS script to load.
      const google = window.google;
      if (!google?.accounts?.id) {
        tries += 1;
        if (tries > 150) return; // ~15s
        setTimeout(tick, 100);
        return;
      }

      if (!elRef.current) return;

      // Render button
      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp) => {
            try {
              const credential = resp?.credential;
              if (!credential) throw new Error("No se recibió credential de Google.");
              const user = await authService.googleSignIn({ credential, role });
              onAuthed && onAuthed(user);
            } catch (e) {
              const msg = e?.message || "No se pudo iniciar sesión con Google.";
              onError && onError(msg);
            }
          },
        });

        // Clear previous render if any
        elRef.current.innerHTML = "";
        google.accounts.id.renderButton(elRef.current, {
          theme: "outline",
          size: "large",
          width: "100%",
          text, // "continue_with" | "signin_with" | ...
          shape: "pill",
        });

        setReady(true);
      } catch {
        // ignore
      }
    };

    tick();
    return () => {
      cancelled = true;
    };
  }, [clientId, role, onAuthed, onError, text]);

  if (!clientId) return null;

  return (
    <div style={{ width: "100%" }}>
      <div ref={elRef} />
      {!ready && (
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--c-slate-400)" }}>
          Cargando Google...
        </div>
      )}
    </div>
  );
}

