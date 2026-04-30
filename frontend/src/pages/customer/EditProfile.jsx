import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import customerPortalService from "../../services/odoo/customerPortalService";

const DEFAULT_PROFILE = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  documentId: "",
  birthDate: "",
  country: "DO",
  city: "",
  address: "",
  newsletter: true,
};

export default function EditProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_PROFILE);
  const [baseForm, setBaseForm] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const profile = await customerPortalService.getProfile();
        const next = { ...DEFAULT_PROFILE, ...profile };
        setForm(next);
        setBaseForm(next);
      } catch (e) {
        setError(e.message || "No se pudo cargar tu perfil.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseForm), [form, baseForm]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    setError("");
    setSuccess("");
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Nombre y apellido son obligatorios.");
      return;
    }
    if (!form.email.includes("@")) {
      setError("El correo no es valido.");
      return;
    }
    try {
      const updated = await customerPortalService.updateProfile(form);
      const next = { ...DEFAULT_PROFILE, ...updated };
      setForm(next);
      setBaseForm(next);
      setSavedAt(new Date());
      setSuccess("Perfil actualizado correctamente.");
    } catch (e) {
      setError(e.message || "No se pudo guardar tu perfil.");
    }
  };

  const reset = () => {
    setForm(baseForm);
    setError("");
    setSuccess("");
  };

  if (loading) {
    return <div style={{ color: "var(--c-slate-500)", fontSize: 13 }}>Cargando perfil...</div>;
  }

  return (
    <>
      <style>{`
        .ep{max-width:920px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
        .ep-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .ep-title{font-family:'Lexend',sans-serif;font-size:24px;font-weight:800;color:var(--c-slate-900)}
        .ep-sub{font-size:13px;color:var(--c-slate-500)}
        .ep-card{background:#fff;border:1px solid var(--c-slate-200);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px}
        .ep-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .ep-full{grid-column:1 / -1}
        @media(max-width:760px){.ep-grid{grid-template-columns:1fr}}
        .ep-f{display:flex;flex-direction:column;gap:5px}
        .ep-l{font-size:11px;font-weight:800;color:var(--c-slate-500);text-transform:uppercase}
        .ep-i{padding:10px 12px;border:1.5px solid var(--c-slate-200);border-radius:10px;font-size:14px;background:#fff}
        .ep-i:focus{outline:none;border-color:var(--c-blue-400);box-shadow:0 0 0 3px rgba(59,130,246,.12)}
        .ep-row{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid var(--c-slate-100);padding:10px 12px;border-radius:10px}
        .ep-chk{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--c-slate-700)}
        .ep-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
        .ep-btn{padding:10px 14px;border-radius:10px;border:1.5px solid var(--c-slate-200);background:#fff;color:var(--c-slate-700);font-size:13px;font-weight:700;cursor:pointer}
        .ep-btn.pri{border:none;background:linear-gradient(135deg,var(--c-blue-600),var(--c-teal-500));color:#fff}
        .ep-msg{font-size:12.5px;font-weight:700}
        .ep-msg.err{color:#dc2626}.ep-msg.ok{color:#15803d}
        .ep-note{font-size:11.5px;color:var(--c-slate-400)}
      `}</style>

      <div className="ep">
        <div className="ep-h">
          <div>
            <h1 className="ep-title">Editar perfil</h1>
            <p className="ep-sub">Actualiza tus datos de cuenta y facturacion.</p>
          </div>
        </div>

        <section className="ep-card">
          <div className="ep-grid">
            <div className="ep-f">
              <label className="ep-l">Nombre</label>
              <input className="ep-i" value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} />
            </div>
            <div className="ep-f">
              <label className="ep-l">Apellido</label>
              <input className="ep-i" value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
            </div>
            <div className="ep-f">
              <label className="ep-l">Correo</label>
              <input className="ep-i" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
            </div>
            <div className="ep-f">
              <label className="ep-l">Telefono</label>
              <input className="ep-i" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
            </div>
            <div className="ep-f">
              <label className="ep-l">Empresa</label>
              <input className="ep-i" value={form.company} onChange={(e) => setField("company", e.target.value)} />
            </div>
            <div className="ep-f">
              <label className="ep-l">Documento (RNC/Cedula)</label>
              <input className="ep-i" value={form.documentId} onChange={(e) => setField("documentId", e.target.value)} />
            </div>
            <div className="ep-f">
              <label className="ep-l">Fecha de nacimiento</label>
              <input className="ep-i" type="date" value={form.birthDate} onChange={(e) => setField("birthDate", e.target.value)} />
            </div>
            <div className="ep-f">
              <label className="ep-l">Pais</label>
              <select className="ep-i" value={form.country} onChange={(e) => setField("country", e.target.value)}>
                <option value="DO">Republica Dominicana</option>
                <option value="US">Estados Unidos</option>
                <option value="MX">Mexico</option>
              </select>
            </div>
            <div className="ep-f">
              <label className="ep-l">Ciudad</label>
              <input className="ep-i" value={form.city} onChange={(e) => setField("city", e.target.value)} />
            </div>
            <div className="ep-f ep-full">
              <label className="ep-l">Direccion</label>
              <input className="ep-i" value={form.address} onChange={(e) => setField("address", e.target.value)} />
            </div>
            <div className="ep-row ep-full">
              <label className="ep-chk">
                <input type="checkbox" checked={form.newsletter} onChange={(e) => setField("newsletter", e.target.checked)} />
                Recibir ofertas y novedades por correo
              </label>
            </div>
          </div>

          <div className="ep-note">{dirty ? "Tienes cambios sin guardar." : "Sin cambios pendientes."}</div>
          {error && <div className="ep-msg err">{error}</div>}
          {success && <div className="ep-msg ok">{success}</div>}
          {savedAt && <div className="ep-note">Ultimo guardado: {savedAt.toLocaleString("es-DO")}</div>}

          <div className="ep-actions">
            <button className="ep-btn" onClick={() => navigate(-1)}>Volver</button>
            <button className="ep-btn" onClick={reset}>Descartar</button>
            <button className="ep-btn pri" onClick={save}>Guardar cambios</button>
          </div>
        </section>
      </div>
    </>
  );
}
