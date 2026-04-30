import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import customerPortalService from "../../services/odoo/customerPortalService";

function getStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return { label: "Baja", cls: "low", value: 35 };
  if (score <= 4) return { label: "Media", cls: "mid", value: 68 };
  return { label: "Alta", cls: "high", value: 100 };
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const strength = useMemo(() => getStrength(newPassword), [newPassword]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Completa todos los campos.");
      return;
    }
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("La nueva contraseña debe ser diferente a la actual.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    setSaving(true);
    try {
      await customerPortalService.changePassword({ currentPassword, newPassword });
      setSuccess("Contraseña actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e2) {
      setError(e2.message || "No se pudo actualizar la contraseña.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .cp{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
        .cp-h{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap}
        .cp-title{font-family:'Lexend',sans-serif;font-size:24px;font-weight:800;color:var(--c-slate-900)}
        .cp-sub{font-size:13px;color:var(--c-slate-500)}
        .cp-card{background:#fff;border:1px solid var(--c-slate-200);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px}
        .cp-f{display:flex;flex-direction:column;gap:6px}
        .cp-l{font-size:11px;font-weight:800;color:var(--c-slate-500);text-transform:uppercase;letter-spacing:.4px}
        .cp-i{padding:11px 12px;border:1.5px solid var(--c-slate-200);border-radius:10px;font-size:14px}
        .cp-i:focus{outline:none;border-color:var(--c-blue-400);box-shadow:0 0 0 3px rgba(59,130,246,.12)}
        .cp-meter{display:flex;align-items:center;gap:10px}
        .cp-bar{flex:1;height:8px;background:#e2e8f0;border-radius:100px;overflow:hidden}
        .cp-fill{height:100%;transition:width .2s}
        .cp-fill.low{background:#ef4444}.cp-fill.mid{background:#f59e0b}.cp-fill.high{background:#10b981}
        .cp-level{font-size:12px;font-weight:800}
        .cp-level.low{color:#dc2626}.cp-level.mid{color:#d97706}.cp-level.high{color:#059669}
        .cp-msg{font-size:12.5px;font-weight:700}
        .cp-msg.err{color:#dc2626}.cp-msg.ok{color:#15803d}
        .cp-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;padding-top:4px}
        .cp-btn{padding:10px 14px;border-radius:10px;border:1.5px solid var(--c-slate-200);background:#fff;color:var(--c-slate-700);font-size:13px;font-weight:700;cursor:pointer}
        .cp-btn.pri{border:none;background:linear-gradient(135deg,var(--c-blue-600),var(--c-teal-500));color:#fff}
        .cp-note{font-size:11.5px;color:var(--c-slate-400)}
      `}</style>

      <div className="cp">
        <div className="cp-h">
          <div>
            <h1 className="cp-title">Cambiar contraseña</h1>
            <p className="cp-sub">Actualiza tu contraseña para proteger tu cuenta.</p>
          </div>
        </div>

        <form className="cp-card" onSubmit={onSubmit}>
          <div className="cp-f">
            <label className="cp-l">Contraseña actual</label>
            <input className="cp-i" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>

          <div className="cp-f">
            <label className="cp-l">Nueva contraseña</label>
            <input className="cp-i" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <div className="cp-meter">
              <div className="cp-bar">
                <div className={`cp-fill ${strength.cls}`} style={{ width: `${strength.value}%` }} />
              </div>
              <span className={`cp-level ${strength.cls}`}>{strength.label}</span>
            </div>
          </div>

          <div className="cp-f">
            <label className="cp-l">Confirmar nueva contraseña</label>
            <input className="cp-i" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          <p className="cp-note">Tip: combina mayúsculas, minúsculas, números y símbolos.</p>
          {error && <p className="cp-msg err">{error}</p>}
          {success && <p className="cp-msg ok">{success}</p>}

          <div className="cp-actions">
            <button type="button" className="cp-btn" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className="cp-btn pri" disabled={saving}>{saving ? "Guardando..." : "Actualizar contraseña"}</button>
          </div>
        </form>
      </div>
    </>
  );
}

