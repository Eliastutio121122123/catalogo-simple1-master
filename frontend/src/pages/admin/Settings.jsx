import { useState, useEffect } from "react";
import authService from "../../services/odoo/authService";

export default function Settings() {
  const [brand, setBrand] = useState("Catalogix");
  const [supportEmail, setSupportEmail] = useState("support@catalogix.com");
  const [timezone, setTimezone] = useState("America/Santo_Domingo");
  const [currency, setCurrency] = useState("DOP");
  const [twoFA, setTwoFA] = useState(true);
  const [ipRestrict, setIpRestrict] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [auditRetention, setAuditRetention] = useState("90");
  const [adminName, setAdminName] = useState("Administrador");
  const [adminEmail, setAdminEmail] = useState("admin@catalogix.com");
  const [adminRole, setAdminRole] = useState("Super Admin");

  useEffect(() => {
    const current = authService.getCurrentUser?.();
    if (!current) return;
    const name = String(current.name || current.login || current.email || "Administrador");
    const email = String(current.email || current.login || "admin@catalogix.com");
    const role = String(current.role || "admin").toLowerCase();
    const roleLabel = role === "admin" ? "Super Admin" : role === "vendor" ? "Vendedor" : role === "customer" ? "Cliente" : role;
    setAdminName(name);
    setAdminEmail(email);
    setAdminRole(roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1));
    if (current.email && supportEmail === "support@catalogix.com") {
      setSupportEmail(current.email);
    }
  }, []);

  return (
    <>
      <style>{`
        .set-wrap{display:flex;flex-direction:column;gap:16px}
        .set-head{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .set-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--slate-900)}
        .set-sub{color:var(--slate-500);font-size:13px}
        .set-actions{display:flex;gap:8px;flex-wrap:wrap}
        .btn{border:1px solid var(--slate-200);background:#fff;color:var(--slate-700);padding:9px 12px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer}
        .btn.primary{border:none;background:linear-gradient(135deg,var(--blue-600),var(--teal-500));color:#fff}

        .set-grid{display:grid;grid-template-columns:1.1fr 0.9fr;gap:12px}
        @media(max-width:1000px){.set-grid{grid-template-columns:1fr}}
        .card{background:#fff;border:1px solid var(--slate-200);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:12px}
        .card-title{font-size:14px;font-weight:800;color:var(--slate-900)}
        .card-sub{font-size:12px;color:var(--slate-500)}

        .field{display:flex;flex-direction:column;gap:6px}
        .field label{font-size:11px;font-weight:800;color:var(--slate-500);text-transform:uppercase}
        .field input,.field select{border:1px solid var(--slate-200);border-radius:10px;padding:9px 10px;font-size:13px;color:var(--slate-700);background:#fff}
        .field input[readonly]{background:var(--slate-50);color:var(--slate-600)}

        .tog{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--slate-100);border-radius:12px}
        .tog-title{font-size:13px;font-weight:800;color:var(--slate-800)}
        .tog-sub{font-size:12px;color:var(--slate-500)}
        .switch{position:relative;width:42px;height:22px;border-radius:999px;background:var(--slate-200);cursor:pointer;transition:all .2s}
        .switch::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:all .2s}
        .switch.on{background:linear-gradient(135deg,var(--blue-600),var(--teal-500))}
        .switch.on::after{left:23px}

        .note{font-size:12px;color:var(--slate-500);background:var(--slate-50);border:1px dashed var(--slate-200);border-radius:12px;padding:10px}
      `}</style>

      <div className="set-wrap">
        <div className="set-head">
          <div>
            <h1 className="set-title">Configuracion</h1>
            <p className="set-sub">Preferencias y ajustes del panel admin.</p>
          </div>
          <div className="set-actions">
            <button className="btn">Restaurar</button>
            <button className="btn primary">Guardar cambios</button>
          </div>
        </div>

        <div className="set-grid">
          <div className="card">
            <div>
              <div className="card-title">Administrador</div>
              <div className="card-sub">Datos del super admin en sesion</div>
            </div>
            <div className="field">
              <label>Nombre</label>
              <input value={adminName} readOnly />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={adminEmail} readOnly />
            </div>
            <div className="field">
              <label>Rol</label>
              <input value={adminRole} readOnly />
            </div>
          </div>

          <div className="card">
            <div>
              <div className="card-title">General</div>
              <div className="card-sub">Informacion basica del negocio</div>
            </div>
            <div className="field">
              <label>Nombre de marca</label>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Nombre" />
            </div>
            <div className="field">
              <label>Email soporte</label>
              <input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="Email" />
            </div>
            <div className="field">
              <label>Zona horaria</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option>America/Santo_Domingo</option>
                <option>America/New_York</option>
                <option>America/Mexico_City</option>
              </select>
            </div>
            <div className="field">
              <label>Moneda base</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option>DOP</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </div>
          </div>

          <div className="card">
            <div>
              <div className="card-title">Seguridad</div>
              <div className="card-sub">Control de acceso y retencion</div>
            </div>
            <div className="tog" onClick={() => setTwoFA((s) => !s)}>
              <div>
                <div className="tog-title">Autenticacion 2FA</div>
                <div className="tog-sub">Requerir segundo factor</div>
              </div>
              <div className={`switch${twoFA ? " on" : ""}`} />
            </div>
            <div className="tog" onClick={() => setIpRestrict((s) => !s)}>
              <div>
                <div className="tog-title">Restriccion por IP</div>
                <div className="tog-sub">Permitir solo IPs conocidas</div>
              </div>
              <div className={`switch${ipRestrict ? " on" : ""}`} />
            </div>
            <div className="field">
              <label>Retencion auditoria (dias)</label>
              <input value={auditRetention} onChange={(e) => setAuditRetention(e.target.value)} />
            </div>
            <div className="note">Los cambios de seguridad aplican a nuevos inicios de sesion.</div>
          </div>
        </div>

        <div className="card">
          <div>
            <div className="card-title">Notificaciones</div>
            <div className="card-sub">Canales de alertas internas</div>
          </div>
          <div className="tog" onClick={() => setEmailNotif((s) => !s)}>
            <div>
              <div className="tog-title">Alertas por email</div>
              <div className="tog-sub">Enviar reportes y alertas criticas</div>
            </div>
            <div className={`switch${emailNotif ? " on" : ""}`} />
          </div>
        </div>
      </div>
    </>
  );
}
