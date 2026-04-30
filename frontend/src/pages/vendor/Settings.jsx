import { useEffect, useMemo, useState } from "react";
import vendorProfileService from "../../services/odoo/vendorProfileService";

const STORAGE_KEY = "catalogix_vendor_settings_v1";

const DEFAULTS = {
  storeName: "Mi Tienda",
  contactEmail: "vendedor@catalogix.com",
  contactPhone: "",
  currency: "DOP",
  timezone: "America/Santo_Domingo",
  language: "es",
  lowStockThreshold: 10,
  emailOrders: true,
  emailInvoices: true,
  emailPromotions: false,
  twoFactor: false,
};

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...(parsed || {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export default function Settings() {
  const [form, setForm] = useState(DEFAULTS);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setForm(readStore());
    (async () => {
      try {
        const profile = await vendorProfileService.getProfile();
        if (cancelled) return;
        setForm((prev) => ({
          ...prev,
          storeName: profile.storeName || prev.storeName,
          contactEmail: profile.email || prev.contactEmail,
          contactPhone: profile.phone || prev.contactPhone,
        }));
      } catch {
        // no-op
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = useMemo(() => {
    const current = JSON.stringify(form);
    const base = JSON.stringify(readStore());
    return current !== base;
  }, [form]);

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setError("");
    if (!String(form.storeName || "").trim()) {
      setError("El nombre de tienda es obligatorio.");
      return;
    }
    if (!String(form.contactEmail || "").includes("@")) {
      setError("El correo de contacto no es valido.");
      return;
    }
    try {
      await vendorProfileService.updateProfile({
        store_name: form.storeName,
        email: form.contactEmail,
        phone: form.contactPhone,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      setSavedAt(new Date());
    } catch (err) {
      setError(err?.message || "No se pudo guardar la configuracion.");
    }
  };

  const reset = () => {
    const values = readStore();
    setForm(values);
    setError("");
  };

  return (
    <>
      <style>{`
        .vs{display:flex;flex-direction:column;gap:14px}
        .vs-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .vs-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .vs-sub{font-size:12.5px;color:var(--vs-500)}
        .vs-btn{padding:9px 14px;border-radius:10px;border:1.5px solid var(--vs-200);background:#fff;cursor:pointer;font-size:13px;font-weight:700;color:var(--vs-700)}
        .vs-btn.pri{border:none;background:linear-gradient(135deg,var(--vt-700),var(--vt-500));color:#fff}
        .vs-card{background:#fff;border:1px solid var(--vs-200);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:12px}
        .vs-sec{display:flex;flex-direction:column;gap:10px}
        .vs-sec + .vs-sec{padding-top:8px;border-top:1px solid var(--vs-100)}
        .vs-sec-t{font-size:13px;font-weight:800;color:var(--vs-800);text-transform:uppercase;letter-spacing:.4px}
        .vs-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .vs-full{grid-column:1 / -1}
        @media(max-width:840px){.vs-grid{grid-template-columns:1fr}}
        .vs-f{display:flex;flex-direction:column;gap:5px}
        .vs-l{font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase}
        .vs-i{padding:10px 12px;border:1.5px solid var(--vs-200);border-radius:10px;font-size:13px;background:#fff}
        .vs-row{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid var(--vs-100);padding:10px 12px;border-radius:10px}
        .vs-chk{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--vs-700);font-weight:700}
        .vs-note{font-size:12px;color:var(--vs-500)}
        .vs-msg{font-size:12px;font-weight:700}
        .vs-ok{color:#15803d}
        .vs-err{color:#dc2626}
      `}</style>

      <div className="vs">
        <div className="vs-h">
          <div>
            <h1 className="vs-title">Settings</h1>
            <p className="vs-sub">Configuracion general de la cuenta de vendedor.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="vs-btn" onClick={reset}>Descartar</button>
            <button className="vs-btn pri" onClick={save}>Guardar cambios</button>
          </div>
        </div>

        <div className="vs-card">
          <section className="vs-sec">
            <h2 className="vs-sec-t">Perfil de tienda</h2>
            <div className="vs-grid">
              <div className="vs-f">
                <label className="vs-l">Nombre de tienda</label>
                <input className="vs-i" value={form.storeName} onChange={(e) => setField("storeName", e.target.value)} />
              </div>
              <div className="vs-f">
                <label className="vs-l">Correo de contacto</label>
                <input className="vs-i" value={form.contactEmail} onChange={(e) => setField("contactEmail", e.target.value)} />
              </div>
              <div className="vs-f">
                <label className="vs-l">Telefono</label>
                <input className="vs-i" value={form.contactPhone} onChange={(e) => setField("contactPhone", e.target.value)} />
              </div>
            </div>
          </section>

          <section className="vs-sec">
            <h2 className="vs-sec-t">Preferencias</h2>
            <div className="vs-grid">
              <div className="vs-f">
                <label className="vs-l">Moneda</label>
                <select className="vs-i" value={form.currency} onChange={(e) => setField("currency", e.target.value)}>
                  <option value="DOP">DOP (RD$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div className="vs-f">
                <label className="vs-l">Zona horaria</label>
                <select className="vs-i" value={form.timezone} onChange={(e) => setField("timezone", e.target.value)}>
                  <option value="America/Santo_Domingo">America/Santo_Domingo</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div className="vs-f">
                <label className="vs-l">Idioma</label>
                <select className="vs-i" value={form.language} onChange={(e) => setField("language", e.target.value)}>
                  <option value="es">Espanol</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="vs-f">
                <label className="vs-l">Alerta de stock bajo</label>
                <input className="vs-i" type="number" min={1} value={form.lowStockThreshold} onChange={(e) => setField("lowStockThreshold", Number(e.target.value || 1))} />
              </div>
            </div>
          </section>

          <section className="vs-sec">
            <h2 className="vs-sec-t">Notificaciones y seguridad</h2>
            <div className="vs-grid">
              <div className="vs-row">
                <label className="vs-chk"><input type="checkbox" checked={form.emailOrders} onChange={(e) => setField("emailOrders", e.target.checked)} /> Emails de nuevos pedidos</label>
              </div>
              <div className="vs-row">
                <label className="vs-chk"><input type="checkbox" checked={form.emailInvoices} onChange={(e) => setField("emailInvoices", e.target.checked)} /> Emails de facturas</label>
              </div>
              <div className="vs-row">
                <label className="vs-chk"><input type="checkbox" checked={form.emailPromotions} onChange={(e) => setField("emailPromotions", e.target.checked)} /> Emails de promociones</label>
              </div>
              <div className="vs-row">
                <label className="vs-chk"><input type="checkbox" checked={form.twoFactor} onChange={(e) => setField("twoFactor", e.target.checked)} /> Activar 2FA</label>
              </div>
            </div>
          </section>

          <div className="vs-note">
            {dirty ? "Tienes cambios sin guardar." : "Sin cambios pendientes."}
          </div>
          {savedAt && <div className="vs-msg vs-ok">Guardado: {savedAt.toLocaleString("es-DO")}</div>}
          {error && <div className="vs-msg vs-err">{error}</div>}
        </div>
      </div>
    </>
  );
}
