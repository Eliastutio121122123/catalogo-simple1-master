import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import pricingService from "../../services/odoo/pricingService";

export default function Pricing() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [rules, setRules] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [cfg, list] = await Promise.all([pricingService.getSettings(), pricingService.listRules()]);
    setSettings(cfg);
    setRules(list);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const activeRules = rules.filter((r) => r.status === "active").length;
    const inactiveRules = rules.length - activeRules;
    return { total: rules.length, activeRules, inactiveRules };
  }, [rules]);

  const updateField = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const next = await pricingService.saveSettings(settings);
    setSettings(next);
    setSaving(false);
  };

  if (!settings) return <div style={{ color: "var(--vs-500)", fontSize: 13 }}>Cargando configuracion de precios...</div>;

  return (
    <>
      <style>{`
        .pr{display:flex;flex-direction:column;gap:14px}
        .pr-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .pr-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .pr-sub{font-size:12.5px;color:var(--vs-500)}
        .pr-btn{padding:9px 14px;border-radius:10px;border:1.5px solid var(--vs-200);background:#fff;cursor:pointer;font-size:13px;font-weight:700;color:var(--vs-700)}
        .pr-btn.pri{border:none;background:linear-gradient(135deg,var(--vt-700),var(--vt-500));color:#fff}
        .pr-k{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        @media(max-width:900px){.pr-k{grid-template-columns:1fr}}
        .pr-ki{background:#fff;border:1px solid var(--vs-200);border-radius:13px;padding:12px}
        .pr-kn{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .pr-kl{font-size:12px;color:var(--vs-500)}
        .pr-grid{display:grid;grid-template-columns:1.3fr .9fr;gap:12px}
        @media(max-width:980px){.pr-grid{grid-template-columns:1fr}}
        .pr-card{background:#fff;border:1px solid var(--vs-200);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:11px}
        .pr-ct{font-family:'Lexend',sans-serif;font-size:14px;font-weight:800;color:var(--vs-900)}
        .pr-r{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(max-width:640px){.pr-r{grid-template-columns:1fr}}
        .pr-f{display:flex;flex-direction:column;gap:5px}
        .pr-l{font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase;letter-spacing:.4px}
        .pr-i{padding:10px 12px;border:1.5px solid var(--vs-200);border-radius:10px;font-size:13px;background:#fff;color:var(--vs-800)}
        .pr-sw{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--vs-700)}
        .pr-list{display:flex;flex-direction:column;gap:8px}
        .pr-item{padding:10px;border:1px solid var(--vs-200);border-radius:10px;background:var(--vs-50)}
        .pr-item-t{display:flex;justify-content:space-between;gap:10px;align-items:center}
        .pr-name{font-size:13px;font-weight:800;color:var(--vs-900)}
        .pr-meta{font-size:11px;color:var(--vs-500)}
        .pill{display:inline-flex;padding:3px 8px;border-radius:100px;font-size:11px;font-weight:700}
        .active{background:#f0fdf4;color:#15803d}.inactive{background:#f1f5f9;color:#475569}
      `}</style>

      <div className="pr">
        <div className="pr-h">
          <div>
            <h1 className="pr-title">Pricing</h1>
            <p className="pr-sub">Politicas base y estrategia de precios del vendedor.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="pr-btn" onClick={() => navigate("/vendor/price-rules")}>Ver reglas</button>
            <button className="pr-btn pri" onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </div>

        <div className="pr-k">
          <div className="pr-ki"><div className="pr-kn">{stats.total}</div><div className="pr-kl">Reglas totales</div></div>
          <div className="pr-ki"><div className="pr-kn">{stats.activeRules}</div><div className="pr-kl">Reglas activas</div></div>
          <div className="pr-ki"><div className="pr-kn">{settings.defaultMarginPercent}%</div><div className="pr-kl">Margen base actual</div></div>
        </div>

        <div className="pr-grid">
          <div className="pr-card">
            <div className="pr-ct">Configuracion general</div>
            <div className="pr-r">
              <div className="pr-f">
                <label className="pr-l">Moneda</label>
                <select className="pr-i" value={settings.currency} onChange={(e) => updateField("currency", e.target.value)}>
                  <option value="DOP">DOP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="pr-f">
                <label className="pr-l">Margen por defecto (%)</label>
                <input className="pr-i" type="number" value={settings.defaultMarginPercent} onChange={(e) => updateField("defaultMarginPercent", e.target.value)} />
              </div>
              <div className="pr-f">
                <label className="pr-l">Impuesto (%)</label>
                <input className="pr-i" type="number" value={settings.taxPercent} onChange={(e) => updateField("taxPercent", e.target.value)} />
              </div>
              <div className="pr-f">
                <label className="pr-l">Redondeo</label>
                <select className="pr-i" value={settings.roundTo} onChange={(e) => updateField("roundTo", e.target.value)}>
                  <option value="integer">Entero</option>
                  <option value="0.99">Terminar en .99</option>
                  <option value="0.95">Terminar en .95</option>
                  <option value="none">Sin redondeo</option>
                </select>
              </div>
              <div className="pr-f">
                <label className="pr-l">Politica minima</label>
                <select className="pr-i" value={settings.minPricePolicy} onChange={(e) => updateField("minPricePolicy", e.target.value)}>
                  <option value="cost_plus_margin">Costo + margen minimo</option>
                  <option value="cost_only">Nunca debajo del costo</option>
                  <option value="free">Sin restriccion</option>
                </select>
              </div>
              <div className="pr-f" style={{ justifyContent: "end" }}>
                <label className="pr-sw">
                  <input type="checkbox" checked={settings.allowManualDiscounts} onChange={(e) => updateField("allowManualDiscounts", e.target.checked)} />
                  Permitir descuentos manuales
                </label>
              </div>
            </div>
          </div>

          <div className="pr-card">
            <div className="pr-ct">Reglas recientes</div>
            <div className="pr-list">
              {rules.slice(0, 5).map((r) => (
                <div key={r.id} className="pr-item">
                  <div className="pr-item-t">
                    <div className="pr-name">{r.name}</div>
                    <span className={`pill ${r.status}`}>{r.status === "active" ? "Activa" : "Inactiva"}</span>
                  </div>
                  <div className="pr-meta">{r.type === "percent" ? `${r.value}%` : `RD$ ${r.value}`} - {r.scope} - prioridad {r.priority}</div>
                </div>
              ))}
              {rules.length === 0 && <div style={{ color: "var(--vs-400)", fontSize: 12 }}>Aun no tienes reglas.</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
