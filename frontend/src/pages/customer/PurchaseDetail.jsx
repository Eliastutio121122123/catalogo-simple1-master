import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import customerPortalService from "../../services/odoo/customerPortalService";

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(Number(n || 0));
const fmtDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("es-DO");

export default function PurchaseDetail() {
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
        setError(e.message || "No se pudo cargar el detalle de compra.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div style={{ color: "var(--c-slate-500)", fontSize: 13 }}>Cargando detalle...</div>;
  }

  if (!order) {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", color: "var(--c-slate-600)" }}>
        {error || (
          <>
            No encontramos el detalle para <strong>{id}</strong>.
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
        .pd{max-width:980px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
        .pd-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .pd-title{font-family:'Lexend',sans-serif;font-size:24px;font-weight:800;color:var(--c-slate-900)}
        .pd-sub{font-size:13px;color:var(--c-slate-500)}
        .pd-btn{padding:9px 12px;border:1.5px solid var(--c-slate-200);border-radius:10px;background:#fff;font-size:13px;font-weight:700;cursor:pointer;color:var(--c-slate-700)}
        .pd-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}
        @media(max-width:940px){.pd-grid{grid-template-columns:1fr}}
        .pd-card{background:#fff;border:1px solid var(--c-slate-200);border-radius:16px;padding:14px}
        .pd-items{display:flex;flex-direction:column;gap:10px}
        .pd-it{display:grid;grid-template-columns:56px 1fr auto auto;gap:10px;align-items:center;padding:10px;border:1px solid var(--c-slate-100);border-radius:10px}
        .pd-thumb{width:56px;height:56px;border-radius:10px;border:1px solid var(--c-slate-200);background:var(--c-slate-50);display:flex;align-items:center;justify-content:center;overflow:hidden}
        .pd-thumb img{width:100%;height:100%;object-fit:contain;display:block;padding:6px}
        .pd-name{font-size:13.5px;font-weight:800;color:var(--c-slate-900)}
        .pd-sku{font-size:11px;color:var(--c-slate-400)}
        .pd-qty{font-size:12px;color:var(--c-slate-600);font-weight:700}
        .pd-price{font-size:13px;color:var(--c-slate-800);font-weight:800}
        .pd-k{display:flex;justify-content:space-between;gap:8px;padding:7px 0;font-size:13px;color:var(--c-slate-700)}
        .pd-k.total{border-top:1px dashed var(--c-slate-200);margin-top:6px;padding-top:10px;font-weight:900;color:var(--c-slate-900)}
        .pd-mini{font-size:12px;color:var(--c-slate-500);line-height:1.5}
        .pd-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      `}</style>

      <div className="pd">
        <div className="pd-h">
          <div>
            <h1 className="pd-title">Detalle de compra {order.code}</h1>
            <p className="pd-sub">Fecha: {fmtDate(order.date)} · Estado: {order.status}</p>
          </div>
          <button className="pd-btn" onClick={() => navigate("/customer/orders")}>Volver</button>
        </div>

        <div className="pd-grid">
          <section className="pd-card">
            <h3 style={{ fontSize: 14, marginBottom: 10, color: "var(--c-slate-900)" }}>Productos</h3>
            <div className="pd-items">
              {order.items.map((it) => (
                <article className="pd-it" key={`${it.id}-${it.sku}`}>
                  <div className="pd-thumb">
                    {it.imageUrl ? <img src={it.imageUrl} alt={it.name} loading="lazy" /> : <span>🛍️</span>}
                  </div>
                  <div>
                    <div className="pd-name">{it.name}</div>
                    <div className="pd-sku">{it.sku}</div>
                  </div>
                  <div className="pd-qty">x{it.qty}</div>
                  <div className="pd-price">{fmtMoney(it.subtotal)}</div>
                </article>
              ))}
            </div>
          </section>

          <aside className="pd-card">
            <h3 style={{ fontSize: 14, marginBottom: 10, color: "var(--c-slate-900)" }}>Resumen</h3>
            <div className="pd-k"><span>Metodo de pago</span><strong>{order.payment}</strong></div>
            <div className="pd-k"><span>Subtotal</span><strong>{fmtMoney(order.subtotal)}</strong></div>
            <div className="pd-k"><span>Envio</span><strong>{fmtMoney(order.shipping)}</strong></div>
            <div className="pd-k"><span>Impuestos</span><strong>{fmtMoney(order.taxes)}</strong></div>
            <div className="pd-k total"><span>Total</span><span>{fmtMoney(order.total)}</span></div>
            <p className="pd-mini" style={{ marginTop: 10 }}>
              Direccion de entrega: <strong>{order.shippingAddress}</strong>
            </p>
            <div className="pd-actions">
              <button className="pd-btn" onClick={() => navigate(`/customer/orders/${order.id}/tracking`)}>Ver tracking</button>
              <button className="pd-btn" onClick={() => navigate("/customer/invoices")}>Ver factura</button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
