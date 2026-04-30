import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import pricingService from "../../services/odoo/pricingService";

const EMPTY = {
  id: null,
  name: "",
  scope: "global",
  target: "Todos los productos",
  type: "percent",
  value: 0,
  minQty: 1,
  priority: 10,
  status: "active",
};

export default function PriceRules() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [scope, setScope] = useState("all");
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const data = await pricingService.listRules();
    setRows(data);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.trim().toLowerCase();
      if (q && !r.name.toLowerCase().includes(q) && !String(r.target || "").toLowerCase().includes(q)) return false;
      if (status !== "all" && r.status !== status) return false;
      if (scope !== "all" && r.scope !== scope) return false;
      return true;
    });
  }, [rows, query, status, scope]);

  const openNew = () => setEditing({ ...EMPTY });
  const openEdit = (rule) => setEditing({ ...rule });
  const close = () => setEditing(null);

  const save = async () => {
    if (!editing?.name?.trim()) return;
    await pricingService.saveRule(editing);
    close();
    await load();
  };

  const remove = async (id) => {
    await pricingService.deleteRule(id);
    await load();
  };

  const toggle = async (id) => {
    await pricingService.toggleRuleStatus(id);
    await load();
  };

  return (
    <>
      <style>{`
        .rr{display:flex;flex-direction:column;gap:14px}
        .rr-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .rr-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .rr-sub{font-size:12.5px;color:var(--vs-500)}
        .rr-btn{padding:9px 14px;border-radius:10px;border:1.5px solid var(--vs-200);background:#fff;cursor:pointer;font-size:13px;font-weight:700;color:var(--vs-700)}
        .rr-btn.pri{border:none;background:linear-gradient(135deg,var(--vt-700),var(--vt-500));color:#fff}
        .rr-bar{display:flex;gap:8px;flex-wrap:wrap}
        .rr-in{padding:9px 12px;border-radius:10px;border:1.5px solid var(--vs-200);background:#fff;font-size:13px}
        .rr-card{background:#fff;border:1px solid var(--vs-200);border-radius:16px;overflow:hidden}
        .rr-th,.rr-tr{display:grid;grid-template-columns:1.1fr .7fr .6fr .5fr .5fr .8fr 1fr;gap:10px;align-items:center;padding:11px 14px}
        .rr-th{background:var(--vs-50);font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase;letter-spacing:.5px}
        .rr-tr{border-top:1px solid var(--vs-100);font-size:13px;color:var(--vs-700)}
        .rr-name{font-weight:700;color:var(--vs-900)}
        .rr-pill{display:inline-flex;padding:4px 8px;border-radius:100px;font-size:11px;font-weight:700}
        .active{background:#f0fdf4;color:#15803d}.inactive{background:#f1f5f9;color:#475569}
        .rr-ac{display:flex;gap:6px;flex-wrap:wrap}
        .rr-a{padding:5px 8px;border:1px solid var(--vs-200);border-radius:8px;background:#fff;font-size:11px;cursor:pointer}
        .rr-empty{padding:24px;text-align:center;color:var(--vs-400)}
        .rr-ov{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:260;display:flex;align-items:center;justify-content:center;padding:16px}
        .rr-md{width:100%;max-width:500px;background:#fff;border:1px solid var(--vs-200);border-radius:16px;padding:16px}
        .rr-mt{font-family:'Lexend',sans-serif;font-size:16px;font-weight:800;color:var(--vs-900);margin-bottom:10px}
        .rr-f{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .rr-g{display:flex;flex-direction:column;gap:5px}
        .rr-l{font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase}
        .rr-i{padding:10px 12px;border:1.5px solid var(--vs-200);border-radius:10px;font-size:13px}
      `}</style>

      <div className="rr">
        <div className="rr-h">
          <div>
            <h1 className="rr-title">Price Rules</h1>
            <p className="rr-sub">Reglas de descuento y sobreprecio por prioridad.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="rr-btn" onClick={() => navigate("/vendor/pricing")}>Ir a pricing</button>
            <button className="rr-btn pri" onClick={openNew}>Nueva regla</button>
          </div>
        </div>

        <div className="rr-bar">
          <input className="rr-in" style={{ minWidth: 240 }} placeholder="Buscar por nombre o target..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="rr-in" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Estado: Todos</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
          <select className="rr-in" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="all">Alcance: Todos</option>
            <option value="global">Global</option>
            <option value="catalog">Catalogo</option>
            <option value="category">Categoria</option>
            <option value="product">Producto</option>
          </select>
        </div>

        <div className="rr-card">
          <div className="rr-th">
            <span>Nombre</span><span>Alcance</span><span>Tipo</span><span>Valor</span><span>Min Qty</span><span>Estado</span><span>Acciones</span>
          </div>
          {filtered.length === 0 && <div className="rr-empty">No hay reglas con ese filtro.</div>}
          {filtered.map((r) => (
            <div key={r.id} className="rr-tr">
              <div>
                <div className="rr-name">{r.name}</div>
                <div style={{ fontSize: 11, color: "var(--vs-400)" }}>{r.target}</div>
              </div>
              <span>{r.scope}</span>
              <span>{r.type === "percent" ? "Porcentaje" : "Monto fijo"}</span>
              <span>{r.type === "percent" ? `${r.value}%` : `RD$ ${r.value}`}</span>
              <span>{r.minQty}</span>
              <span><span className={`rr-pill ${r.status}`}>{r.status === "active" ? "Activa" : "Inactiva"}</span></span>
              <div className="rr-ac">
                <button className="rr-a" onClick={() => openEdit(r)}>Editar</button>
                <button className="rr-a" onClick={() => toggle(r.id)}>{r.status === "active" ? "Desactivar" : "Activar"}</button>
                <button className="rr-a" onClick={() => remove(r.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <div className="rr-ov" onClick={close}>
          <div className="rr-md" onClick={(e) => e.stopPropagation()}>
            <div className="rr-mt">{editing.id ? "Editar regla" : "Nueva regla"}</div>
            <div className="rr-f">
              <div className="rr-g" style={{ gridColumn: "1 / -1" }}>
                <label className="rr-l">Nombre</label>
                <input className="rr-i" value={editing.name} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="rr-g">
                <label className="rr-l">Alcance</label>
                <select className="rr-i" value={editing.scope} onChange={(e) => setEditing((p) => ({ ...p, scope: e.target.value }))}>
                  <option value="global">Global</option>
                  <option value="catalog">Catalogo</option>
                  <option value="category">Categoria</option>
                  <option value="product">Producto</option>
                </select>
              </div>
              <div className="rr-g">
                <label className="rr-l">Target</label>
                <input className="rr-i" value={editing.target} onChange={(e) => setEditing((p) => ({ ...p, target: e.target.value }))} />
              </div>
              <div className="rr-g">
                <label className="rr-l">Tipo</label>
                <select className="rr-i" value={editing.type} onChange={(e) => setEditing((p) => ({ ...p, type: e.target.value }))}>
                  <option value="percent">Porcentaje</option>
                  <option value="fixed">Monto fijo</option>
                </select>
              </div>
              <div className="rr-g">
                <label className="rr-l">Valor</label>
                <input className="rr-i" type="number" value={editing.value} onChange={(e) => setEditing((p) => ({ ...p, value: e.target.value }))} />
              </div>
              <div className="rr-g">
                <label className="rr-l">Cantidad minima</label>
                <input className="rr-i" type="number" value={editing.minQty} onChange={(e) => setEditing((p) => ({ ...p, minQty: e.target.value }))} />
              </div>
              <div className="rr-g">
                <label className="rr-l">Prioridad</label>
                <input className="rr-i" type="number" value={editing.priority} onChange={(e) => setEditing((p) => ({ ...p, priority: e.target.value }))} />
              </div>
              <div className="rr-g">
                <label className="rr-l">Estado</label>
                <select className="rr-i" value={editing.status} onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))}>
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
              <button className="rr-btn" onClick={close}>Cancelar</button>
              <button className="rr-btn pri" onClick={save}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
