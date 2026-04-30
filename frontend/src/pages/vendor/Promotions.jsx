import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import promotionService from "../../services/odoo/promotionService";

const fmtDate = (date) => (date ? new Date(`${date}T00:00:00`).toLocaleDateString("es-DO") : "-");

export default function Promotions() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const load = async () => {
    const data = await promotionService.list();
    setRows(data);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const query = q.trim().toLowerCase();
      if (query && !r.name.toLowerCase().includes(query) && !String(r.code).toLowerCase().includes(query)) return false;
      if (status !== "all" && r.status !== status) return false;
      return true;
    });
  }, [rows, q, status]);

  const toggle = async (id) => {
    await promotionService.toggleStatus(id);
    await load();
  };

  const remove = async (id) => {
    await promotionService.delete(id);
    await load();
  };

  return (
    <>
      <style>{`
        .pm{display:flex;flex-direction:column;gap:14px}
        .pm-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .pm-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .pm-sub{font-size:12.5px;color:var(--vs-500)}
        .pm-btn{padding:9px 14px;border-radius:10px;border:1.5px solid var(--vs-200);background:#fff;cursor:pointer;font-size:13px;font-weight:700;color:var(--vs-700)}
        .pm-btn.pri{border:none;background:linear-gradient(135deg,var(--vt-700),var(--vt-500));color:#fff}
        .pm-bar{display:flex;gap:8px;flex-wrap:wrap}
        .pm-in{padding:9px 12px;border-radius:10px;border:1.5px solid var(--vs-200);background:#fff;font-size:13px}
        .pm-card{background:#fff;border:1px solid var(--vs-200);border-radius:16px;overflow:hidden}
        .pm-th,.pm-tr{display:grid;grid-template-columns:1.2fr .8fr .8fr .8fr .8fr 1fr;gap:10px;align-items:center;padding:11px 14px}
        .pm-th{background:var(--vs-50);font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase;letter-spacing:.5px}
        .pm-tr{border-top:1px solid var(--vs-100);font-size:13px;color:var(--vs-700)}
        .pm-name{font-weight:700;color:var(--vs-900)}
        .pill{display:inline-flex;padding:4px 8px;border-radius:100px;font-size:11px;font-weight:700}
        .active{background:#f0fdf4;color:#15803d}.inactive{background:#f1f5f9;color:#475569}
        .pm-ac{display:flex;gap:6px;flex-wrap:wrap}
        .pm-a{padding:5px 8px;border:1px solid var(--vs-200);border-radius:8px;background:#fff;font-size:11px;cursor:pointer}
        .pm-empty{padding:24px;text-align:center;color:var(--vs-400)}
      `}</style>

      <div className="pm">
        <div className="pm-h">
          <div>
            <h1 className="pm-title">Promotions</h1>
            <p className="pm-sub">Crea y administra promociones para tus clientes.</p>
          </div>
          <button className="pm-btn pri" onClick={() => navigate("/vendor/promotions/new")}>Nueva promocion</button>
        </div>

        <div className="pm-bar">
          <input className="pm-in" style={{ minWidth: 240 }} placeholder="Buscar por nombre o codigo..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="pm-in" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Estado: Todos</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>

        <div className="pm-card">
          <div className="pm-th">
            <span>Promocion</span><span>Tipo</span><span>Valor</span><span>Vigencia</span><span>Estado</span><span>Acciones</span>
          </div>
          {filtered.length === 0 && <div className="pm-empty">No hay promociones con ese filtro.</div>}
          {filtered.map((r) => (
            <div className="pm-tr" key={r.id}>
              <div>
                <div className="pm-name">{r.name}</div>
                <div style={{ fontSize: 11, color: "var(--vs-400)" }}>{r.code || "Sin codigo"}</div>
              </div>
              <span>{r.type === "percent" ? "Porcentaje" : r.type === "fixed" ? "Monto" : "Envio"}</span>
              <span>{r.type === "percent" ? `${r.value}%` : r.type === "fixed" ? `RD$ ${r.value}` : "Gratis"}</span>
              <span>{fmtDate(r.startDate)} - {fmtDate(r.endDate)}</span>
              <span><span className={`pill ${r.status}`}>{r.status === "active" ? "Activa" : "Inactiva"}</span></span>
              <div className="pm-ac">
                <button className="pm-a" onClick={() => navigate(`/vendor/promotions/${r.id}`)}>Editar</button>
                <button className="pm-a" onClick={() => toggle(r.id)}>{r.status === "active" ? "Desactivar" : "Activar"}</button>
                <button className="pm-a" onClick={() => remove(r.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
