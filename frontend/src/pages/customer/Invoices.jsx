import { useEffect, useMemo, useState } from "react";
import { customerInvoiceService } from "../../services/odoo/customerInvoiceService";

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(Number(n || 0));

const fmtDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("es-DO");

export default function Invoices() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const data = await customerInvoiceService.list();
        setRows(data);
      } catch (e) {
        setError(e.message || "No se pudieron cargar las facturas.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((i) => {
      const query = q.trim().toLowerCase();
      const idText = String(i.id || "").toLowerCase();
      const orderText = String(i.orderRef || "").toLowerCase();
      if (query && !idText.includes(query) && !orderText.includes(query)) return false;
      if (status !== "all" && i.status !== status) return false;
      return true;
    });
  }, [rows, q, status]);

  const stats = useMemo(() => {
    const total = filtered.reduce((acc, i) => acc + i.total, 0);
    const pending = filtered.filter((i) => i.status === "pending" || i.status === "overdue").length;
    return { total, pending, count: filtered.length };
  }, [filtered]);

  return (
    <>
      <style>{`
        .ci{display:flex;flex-direction:column;gap:14px}
        .ci-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .ci-title{font-family:'Lexend',sans-serif;font-size:24px;font-weight:800;color:var(--c-slate-900)}
        .ci-sub{font-size:13px;color:var(--c-slate-500)}
        .ci-bar{display:flex;gap:8px;flex-wrap:wrap}
        .ci-in{padding:9px 12px;border-radius:10px;border:1.5px solid var(--c-slate-200);background:#fff;font-size:13px}
        .ci-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        @media(max-width:880px){.ci-grid{grid-template-columns:1fr}}
        .ci-k{background:#fff;border:1px solid var(--c-slate-200);border-radius:14px;padding:12px}
        .ci-k-l{font-size:11px;font-weight:800;color:var(--c-slate-500);text-transform:uppercase}
        .ci-k-v{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--c-slate-900);margin-top:6px}
        .ci-table{background:#fff;border:1px solid var(--c-slate-200);border-radius:16px;overflow:hidden}
        .ci-th,.ci-tr{display:grid;grid-template-columns:1fr .8fr .8fr .8fr .8fr 1fr;gap:10px;align-items:center;padding:11px 14px}
        .ci-th{background:var(--c-slate-50);font-size:11px;font-weight:800;color:var(--c-slate-500);text-transform:uppercase}
        .ci-tr{border-top:1px solid var(--c-slate-100);font-size:13px;color:var(--c-slate-700)}
        .ci-id{font-weight:800;color:var(--c-slate-900)}
        .ci-pill{display:inline-flex;padding:4px 8px;border-radius:100px;font-size:11px;font-weight:800}
        .ci-pill.paid{background:#ecfdf3;color:#15803d}
        .ci-pill.pending{background:#eff6ff;color:#1d4ed8}
        .ci-pill.overdue{background:#fef2f2;color:#dc2626}
        .ci-actions{display:flex;gap:6px;flex-wrap:wrap}
        .ci-a{padding:5px 8px;border:1px solid var(--c-slate-200);border-radius:8px;background:#fff;font-size:11px;cursor:pointer}
        .ci-empty{padding:24px;text-align:center;color:var(--c-slate-400)}
      `}</style>

      <div className="ci">
        <div className="ci-h">
          <div>
            <h1 className="ci-title">Facturas</h1>
            <p className="ci-sub">Consulta tus facturas y estado de pago.</p>
            {error && <p style={{ color: "#dc2626", fontSize: 12, fontWeight: 700, marginTop: 4 }}>{error}</p>}
          </div>
          <div className="ci-bar">
            <input className="ci-in" placeholder="Buscar por factura o pedido..." value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="ci-in" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Estado: Todos</option>
              <option value="paid">Pagadas</option>
              <option value="pending">Pendientes</option>
              <option value="overdue">Vencidas</option>
            </select>
          </div>
        </div>

        <div className="ci-grid">
          <article className="ci-k">
            <div className="ci-k-l">Total facturado</div>
            <div className="ci-k-v">{fmtMoney(stats.total)}</div>
          </article>
          <article className="ci-k">
            <div className="ci-k-l">Facturas pendientes</div>
            <div className="ci-k-v">{stats.pending}</div>
          </article>
          <article className="ci-k">
            <div className="ci-k-l">Facturas visibles</div>
            <div className="ci-k-v">{stats.count}</div>
          </article>
        </div>

        <div className="ci-table">
          <div className="ci-th">
            <span>Factura</span>
            <span>Pedido</span>
            <span>Fecha</span>
            <span>Vencimiento</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {filtered.length === 0 && <div className="ci-empty">{loading ? "Cargando..." : "No hay facturas con ese filtro."}</div>}
          {filtered.map((i) => (
            <div className="ci-tr" key={i.id}>
              <div>
                <div className="ci-id">{i.id}</div>
                <div style={{ fontSize: 11, color: "var(--c-slate-400)" }}>{fmtMoney(i.total)}</div>
              </div>
              <span>{i.orderRef}</span>
              <span>{fmtDate(i.date)}</span>
              <span>{fmtDate(i.dueDate)}</span>
              <span>
                <span className={`ci-pill ${i.status}`}>
                  {i.status === "paid" ? "Pagada" : i.status === "pending" ? "Pendiente" : "Vencida"}
                </span>
              </span>
              <div className="ci-actions">
                <button className="ci-a" onClick={() => customerInvoiceService.viewPdf(i.invoiceId)}>Ver</button>
                <button className="ci-a" onClick={() => customerInvoiceService.downloadPdf(i.invoiceId, `${i.id}.pdf`)}>Descargar PDF</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

