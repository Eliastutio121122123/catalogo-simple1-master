import { useEffect, useMemo, useState } from "react";
import customerPortalService from "../../services/odoo/customerPortalService";

const formatDate = (iso) =>
  new Date(iso).toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Notifications() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const data = await customerPortalService.listNotifications();
        setRows(data);
      } catch (e) {
        setError(e.message || "No se pudieron cargar las notificaciones.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "unread") return rows.filter((n) => !n.read);
    return rows.filter((n) => n.type === filter);
  }, [rows, filter]);

  const unreadCount = useMemo(() => rows.filter((n) => !n.read).length, [rows]);

  const markRead = (id) => {
    setRows((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setRows((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeOne = (id) => {
    setRows((prev) => prev.filter((n) => String(n.id) !== String(id)));
  };

  return (
    <>
      <style>{`
        .cn{display:flex;flex-direction:column;gap:14px}
        .cn-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .cn-title{font-family:'Lexend',sans-serif;font-size:24px;font-weight:800;color:var(--c-slate-900)}
        .cn-sub{font-size:13px;color:var(--c-slate-500)}
        .cn-bar{display:flex;gap:8px;flex-wrap:wrap}
        .cn-in{padding:9px 12px;border:1.5px solid var(--c-slate-200);border-radius:10px;background:#fff;font-size:13px}
        .cn-btn{padding:9px 12px;border:1.5px solid var(--c-slate-200);border-radius:10px;background:#fff;font-size:13px;font-weight:700;cursor:pointer;color:var(--c-slate-700)}
        .cn-card{background:#fff;border:1px solid var(--c-slate-200);border-radius:16px;overflow:hidden}
        .cn-row{display:flex;justify-content:space-between;gap:12px;padding:12px 14px;border-top:1px solid var(--c-slate-100)}
        .cn-row:first-child{border-top:none}
        .cn-left{display:flex;gap:10px;flex:1;min-width:0}
        .cn-dot{width:10px;height:10px;border-radius:50%;margin-top:5px;flex-shrink:0}
        .cn-dot.order{background:#2563eb}.cn-dot.invoice{background:#06b6d4}.cn-dot.promo{background:#f59e0b}
        .cn-read .cn-dot{background:#cbd5e1}
        .cn-t{font-size:14px;font-weight:800;color:var(--c-slate-900)}
        .cn-b{font-size:13px;color:var(--c-slate-600);line-height:1.45}
        .cn-time{font-size:11px;color:var(--c-slate-400);margin-top:4px}
        .cn-actions{display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start}
        .cn-a{padding:5px 8px;border:1px solid var(--c-slate-200);border-radius:8px;background:#fff;font-size:11px;cursor:pointer}
        .cn-empty{padding:22px;text-align:center;color:var(--c-slate-400)}
      `}</style>

      <div className="cn">
        <div className="cn-h">
          <div>
            <h1 className="cn-title">Notificaciones</h1>
            <p className="cn-sub">Tienes {unreadCount} sin leer.</p>
            {error && <p style={{ color: "#dc2626", fontSize: 12, fontWeight: 700, marginTop: 4 }}>{error}</p>}
          </div>
          <div className="cn-bar">
            <select className="cn-in" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Todas</option>
              <option value="unread">No leidas</option>
              <option value="order">Pedidos</option>
              <option value="invoice">Facturas</option>
              <option value="promo">Promociones</option>
            </select>
            <button className="cn-btn" onClick={markAllRead}>Marcar todas leidas</button>
          </div>
        </div>

        <div className="cn-card">
          {filtered.length === 0 && <div className="cn-empty">{loading ? "Cargando..." : "No hay notificaciones con ese filtro."}</div>}
          {filtered.map((n) => (
            <div key={n.id} className={`cn-row ${n.read ? "cn-read" : ""}`}>
              <div className="cn-left">
                <span className={`cn-dot ${n.type}`} />
                <div>
                  <div className="cn-t">{n.title}</div>
                  <div className="cn-b">{n.body}</div>
                  <div className="cn-time">{formatDate(n.createdAt)}</div>
                </div>
              </div>
              <div className="cn-actions">
                {!n.read && <button className="cn-a" onClick={() => markRead(n.id)}>Marcar leida</button>}
                <button className="cn-a" onClick={() => removeOne(n.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

