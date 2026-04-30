import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import promotionService from "../../services/odoo/promotionService";

const EMPTY = {
  name: "",
  code: "",
  type: "percent",
  value: 0,
  minOrder: "",
  maxDiscount: "",
  appliesTo: "all",
  startDate: "",
  endDate: "",
  usageLimit: "",
  status: "active",
  description: "",
};

export default function PromotionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const row = await promotionService.getById(id);
      if (!row) {
        setError("Promocion no encontrada");
        setLoading(false);
        return;
      }
      setForm({
        ...row,
        minOrder: row.minOrder ?? "",
        maxDiscount: row.maxDiscount ?? "",
        usageLimit: row.usageLimit ?? "",
      });
      setLoading(false);
    })();
  }, [id, isEdit]);

  const onChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const save = async () => {
    setError("");
    if (!form.name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (form.type !== "shipping" && Number(form.value) <= 0) {
      setError("El valor debe ser mayor que 0");
      return;
    }

    setSaving(true);
    try {
      await promotionService.save({ ...form, id: isEdit ? id : null });
      navigate("/vendor/promotions");
    } catch (e) {
      setError(e.message || "No se pudo guardar la promocion");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: "var(--vs-500)", fontSize: 13 }}>Cargando promocion...</div>;

  return (
    <>
      <style>{`
        .pf{display:flex;flex-direction:column;gap:14px}
        .pf-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .pf-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .pf-sub{font-size:12.5px;color:var(--vs-500)}
        .pf-btn{padding:9px 14px;border-radius:10px;border:1.5px solid var(--vs-200);background:#fff;cursor:pointer;font-size:13px;font-weight:700;color:var(--vs-700)}
        .pf-btn.pri{border:none;background:linear-gradient(135deg,var(--vt-700),var(--vt-500));color:#fff}
        .pf-card{background:#fff;border:1px solid var(--vs-200);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px}
        .pf-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(max-width:800px){.pf-grid{grid-template-columns:1fr}}
        .pf-f{display:flex;flex-direction:column;gap:5px}
        .pf-l{font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase}
        .pf-i{padding:10px 12px;border:1.5px solid var(--vs-200);border-radius:10px;font-size:13px}
        .pf-e{font-size:12px;color:#dc2626;font-weight:700}
      `}</style>

      <div className="pf">
        <div className="pf-h">
          <div>
            <h1 className="pf-title">{isEdit ? "Editar promocion" : "Nueva promocion"}</h1>
            <p className="pf-sub">Configura descuento, vigencia y alcance.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="pf-btn" onClick={() => navigate("/vendor/promotions")}>Cancelar</button>
            <button className="pf-btn pri" onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </div>

        <div className="pf-card">
          <div className="pf-grid">
            <div className="pf-f" style={{ gridColumn: "1 / -1" }}>
              <label className="pf-l">Nombre</label>
              <input className="pf-i" value={form.name} onChange={(e) => onChange("name", e.target.value)} />
            </div>
            <div className="pf-f">
              <label className="pf-l">Codigo</label>
              <input className="pf-i" value={form.code} onChange={(e) => onChange("code", e.target.value)} placeholder="EJ: VERANO20" />
            </div>
            <div className="pf-f">
              <label className="pf-l">Tipo</label>
              <select className="pf-i" value={form.type} onChange={(e) => onChange("type", e.target.value)}>
                <option value="percent">Porcentaje</option>
                <option value="fixed">Monto fijo</option>
                <option value="shipping">Envio gratis</option>
              </select>
            </div>
            <div className="pf-f">
              <label className="pf-l">Valor</label>
              <input className="pf-i" type="number" value={form.value} onChange={(e) => onChange("value", e.target.value)} disabled={form.type === "shipping"} />
            </div>
            <div className="pf-f">
              <label className="pf-l">Monto minimo de orden</label>
              <input className="pf-i" type="number" value={form.minOrder} onChange={(e) => onChange("minOrder", e.target.value)} />
            </div>
            <div className="pf-f">
              <label className="pf-l">Descuento maximo</label>
              <input className="pf-i" type="number" value={form.maxDiscount} onChange={(e) => onChange("maxDiscount", e.target.value)} />
            </div>
            <div className="pf-f">
              <label className="pf-l">Aplica a</label>
              <select className="pf-i" value={form.appliesTo} onChange={(e) => onChange("appliesTo", e.target.value)}>
                <option value="all">Todo</option>
                <option value="catalog">Catalogo</option>
                <option value="category">Categoria</option>
                <option value="product">Producto</option>
              </select>
            </div>
            <div className="pf-f">
              <label className="pf-l">Limite de uso</label>
              <input className="pf-i" type="number" value={form.usageLimit} onChange={(e) => onChange("usageLimit", e.target.value)} />
            </div>
            <div className="pf-f">
              <label className="pf-l">Inicio</label>
              <input className="pf-i" type="date" value={form.startDate || ""} onChange={(e) => onChange("startDate", e.target.value)} />
            </div>
            <div className="pf-f">
              <label className="pf-l">Fin</label>
              <input className="pf-i" type="date" value={form.endDate || ""} onChange={(e) => onChange("endDate", e.target.value)} />
            </div>
            <div className="pf-f" style={{ gridColumn: "1 / -1" }}>
              <label className="pf-l">Descripcion</label>
              <textarea className="pf-i" rows={4} value={form.description} onChange={(e) => onChange("description", e.target.value)} />
            </div>
            <div className="pf-f">
              <label className="pf-l">Estado</label>
              <select className="pf-i" value={form.status} onChange={(e) => onChange("status", e.target.value)}>
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
            </div>
          </div>
          {error && <div className="pf-e">{error}</div>}
        </div>
      </div>
    </>
  );
}
