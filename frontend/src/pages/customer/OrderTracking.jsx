import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import customerPortalService from "../../services/odoo/customerPortalService";

const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const fmtDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("es-DO");

export default function OrderTracking() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const row = await customerPortalService.getOrder(id);
        setOrder(row);
      } catch (e) {
        setError(e.message || "No se pudo cargar el tracking.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div style={{ color: "var(--c-slate-500)", fontSize: 13 }}>Cargando tracking...</div>;
  }

  if (!order) {
    return (
      <div style={{ maxWidth: 840, margin: "0 auto", color: "var(--c-slate-600)" }}>
        {error || (
          <>
            No encontramos tracking para <strong>{id}</strong>.
          </>
        )}{" "}
        <button
          onClick={() => navigate("/customer/orders")}
          style={{ border: "none", background: "none", color: "var(--c-blue-600)", cursor: "pointer", fontWeight: 700 }}
        >
          Volver a pedidos
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .ot{max-width:920px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
        .ot-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .ot-title{font-family:'Lexend',sans-serif;font-size:24px;font-weight:800;color:var(--c-slate-900)}
        .ot-sub{font-size:13px;color:var(--c-slate-500)}
        .ot-btn{padding:9px 12px;border:1.5px solid var(--c-slate-200);border-radius:10px;background:#fff;font-size:13px;font-weight:700;cursor:pointer;color:var(--c-slate-700)}
        .ot-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        @media(max-width:900px){.ot-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:540px){.ot-grid{grid-template-columns:1fr}}
        .ot-k{background:#fff;border:1px solid var(--c-slate-200);border-radius:14px;padding:12px}
        .ot-k-l{font-size:11px;font-weight:800;color:var(--c-slate-500);text-transform:uppercase}
        .ot-k-v{font-size:14px;font-weight:800;color:var(--c-slate-900);margin-top:6px}
        .ot-card{background:#fff;border:1px solid var(--c-slate-200);border-radius:16px;padding:14px}
        .ot-line{position:relative;padding-left:22px;display:flex;flex-direction:column;gap:12px}
        .ot-line::before{content:'';position:absolute;left:7px;top:4px;bottom:4px;width:2px;background:var(--c-slate-200)}
        .ot-ev{position:relative}
        .ot-ev::before{content:'';position:absolute;left:-19px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--c-blue-600)}
        .ot-ev-title{font-size:14px;font-weight:800;color:var(--c-slate-900)}
        .ot-ev-detail{font-size:13px;color:var(--c-slate-600);margin-top:2px}
        .ot-ev-time{font-size:11px;color:var(--c-slate-400);margin-top:3px}
      `}</style>

      <div className="ot">
        <div className="ot-h">
          <div>
            <h1 className="ot-title">Tracking del pedido {order.code}</h1>
            <p className="ot-sub">Sigue el estado de tu envio en tiempo real.</p>
          </div>
          <button className="ot-btn" onClick={() => navigate("/customer/orders")}>Volver a pedidos</button>
        </div>

        <div className="ot-grid">
          <article className="ot-k">
            <div className="ot-k-l">Estado actual</div>
            <div className="ot-k-v">{order.status}</div>
          </article>
          <article className="ot-k">
            <div className="ot-k-l">Transportista</div>
            <div className="ot-k-v">{order.tracking.carrier}</div>
          </article>
          <article className="ot-k">
            <div className="ot-k-l">Codigo tracking</div>
            <div className="ot-k-v">{order.tracking.trackingCode}</div>
          </article>
          <article className="ot-k">
            <div className="ot-k-l">Entrega estimada</div>
            <div className="ot-k-v">{fmtDate(order.tracking.eta)}</div>
          </article>
        </div>

        <div className="ot-card">
          <div style={{ marginBottom: 10, fontSize: 13, color: "var(--c-slate-600)" }}>
            Direccion de entrega: <strong>{order.shippingAddress}</strong>
          </div>
          <div className="ot-line">
            {order.tracking.events.map((ev, idx) => (
              <div className="ot-ev" key={`${ev.at}-${idx}`}>
                <div className="ot-ev-title">{ev.title}</div>
                <div className="ot-ev-detail">{ev.detail}</div>
                <div className="ot-ev-time">{fmtDateTime(ev.at)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
