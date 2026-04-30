import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import customerPortalService from "../../services/odoo/customerPortalService";

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(Number(n || 0));

const fmtDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("es-DO");

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const rows = await customerPortalService.listOrders();
        setOrders(rows);
      } catch (e) {
        setError(e.message || "No se pudo cargar tus pedidos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const query = q.trim().toLowerCase();
      if (query && !String(o.code || "").toLowerCase().includes(query)) return false;
      if (status !== "all" && o.status !== status) return false;
      return true;
    });
  }, [orders, q, status]);

  return (
    <>
      <style>{`
        .oh{display:flex;flex-direction:column;gap:14px}
        .oh-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .oh-title{font-family:'Lexend',sans-serif;font-size:24px;font-weight:800;color:var(--c-slate-900)}
        .oh-sub{font-size:13px;color:var(--c-slate-500)}
        .oh-bar{display:flex;gap:8px;flex-wrap:wrap}
        .oh-in{padding:9px 12px;border:1.5px solid var(--c-slate-200);border-radius:10px;background:#fff;font-size:13px}
        .oh-card{background:#fff;border:1px solid var(--c-slate-200);border-radius:16px;overflow:hidden}
        .oh-th,.oh-tr{display:grid;grid-template-columns:1fr .8fr .8fr .8fr .9fr 1fr;gap:10px;align-items:center;padding:11px 14px}
        .oh-th{background:var(--c-slate-50);font-size:11px;font-weight:800;color:var(--c-slate-500);text-transform:uppercase}
        .oh-tr{border-top:1px solid var(--c-slate-100);font-size:13px;color:var(--c-slate-700)}
        .oh-id{font-weight:800;color:var(--c-slate-900)}
        .oh-pill{display:inline-flex;padding:4px 8px;border-radius:100px;font-size:11px;font-weight:800}
        .oh-pill.processing{background:#eff6ff;color:#1d4ed8}
        .oh-pill.shipped{background:#ecfeff;color:#0e7490}
        .oh-pill.delivered{background:#ecfdf3;color:#15803d}
        .oh-pill.cancelled{background:#fef2f2;color:#dc2626}
        .oh-actions{display:flex;gap:6px;flex-wrap:wrap}
        .oh-a{padding:5px 8px;border:1px solid var(--c-slate-200);border-radius:8px;background:#fff;font-size:11px;cursor:pointer}
        .oh-empty{padding:24px;text-align:center;color:var(--c-slate-400)}
      `}</style>

      <div className="oh">
        <div className="oh-h">
          <div>
            <h1 className="oh-title">Mis pedidos</h1>
            <p className="oh-sub">Historial de compras y estado de entrega.</p>
            {error && <p style={{ color: "#dc2626", fontSize: 12, fontWeight: 700, marginTop: 4 }}>{error}</p>}
          </div>
          <div className="oh-bar">
            <input className="oh-in" placeholder="Buscar por codigo..." value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="oh-in" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Estado: Todos</option>
              <option value="processing">Procesando</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="oh-card">
          <div className="oh-th">
            <span>Pedido</span>
            <span>Fecha</span>
            <span>Items</span>
            <span>Total</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {filtered.length === 0 && <div className="oh-empty">No hay pedidos con ese filtro.</div>}
          {filtered.map((o) => (
            <div className="oh-tr" key={o.id}>
              <div>
                <div className="oh-id">{o.code}</div>
                <div style={{ fontSize: 11, color: "var(--c-slate-400)" }}>{o.payment.toUpperCase()}</div>
              </div>
              <span>{fmtDate(o.date)}</span>
              <span>{o.items}</span>
              <span>{fmtMoney(o.total)}</span>
              <span>
                <span className={`oh-pill ${o.status}`}>
                  {o.status === "processing" ? "Procesando" : o.status === "shipped" ? "Enviado" : o.status === "delivered" ? "Entregado" : "Cancelado"}
                </span>
              </span>
              <div className="oh-actions">
                <button className="oh-a" onClick={() => navigate(`/customer/purchases/${o.id}`)}>Detalle</button>
                <button className="oh-a" onClick={() => navigate(`/customer/orders/${o.id}/tracking`)}>Tracking</button>
                <button className="oh-a" onClick={() => navigate("/customer/invoices")}>Factura</button>
              </div>
            </div>
          ))}
        </div>
        {loading && <div style={{ color: "var(--c-slate-500)", fontSize: 13 }}>Cargando pedidos...</div>}
      </div>
    </>
  );
}
