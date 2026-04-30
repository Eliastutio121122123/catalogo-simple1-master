import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import invoiceService from "../../services/odoo/invoiceService";

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
};

const STATUS_LABEL = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
  cancelled: "Cancelada",
};

export default function Invoices() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");

  const load = async () => {
    setLoading(true);
    const data = await invoiceService.list();
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.trim().toLowerCase();
      if (q) {
        const hit =
          r.id.toLowerCase().includes(q) ||
          (r.number || "").toLowerCase().includes(q) ||
          r.customer?.name?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (status !== "all" && r.status !== status) return false;
      if (payment !== "all" && r.paymentStatus !== payment) return false;
      return true;
    });
  }, [rows, query, status, payment]);

  const stats = useMemo(() => {
    const total = rows.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
    const pending = rows.filter((r) => r.paymentStatus !== "paid").reduce((acc, r) => acc + (Number(r.total) || 0), 0);
    const paid = rows.filter((r) => r.paymentStatus === "paid").length;
    return { invoices: rows.length, total, pending, paid };
  }, [rows]);

  return (
    <>
      <style>{`
        .iv{display:flex;flex-direction:column;gap:14px}
        .iv-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .iv-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .iv-sub{font-size:12.5px;color:var(--vs-500)}
        .iv-btn{padding:9px 14px;border-radius:10px;border:1.5px solid var(--vs-200);background:var(--vw);cursor:pointer;font-size:13px;font-weight:700;color:var(--vs-700)}
        .iv-btn.pri{background:linear-gradient(135deg,var(--vt-700),var(--vt-500));border:none;color:#fff}
        .iv-k{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        @media(max-width:900px){.iv-k{grid-template-columns:repeat(2,1fr)}}
        .iv-ki{background:#fff;border:1px solid var(--vs-200);border-radius:13px;padding:12px}
        .iv-kn{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--vs-900)}
        .iv-kl{font-size:12px;color:var(--vs-500)}
        .iv-bar{display:flex;gap:8px;flex-wrap:wrap}
        .iv-in{padding:9px 12px;border-radius:10px;border:1.5px solid var(--vs-200);background:#fff;font-size:13px}
        .iv-card{background:#fff;border:1px solid var(--vs-200);border-radius:16px;overflow:hidden}
        .iv-th,.iv-tr{display:grid;grid-template-columns:1fr 1fr .7fr .7fr .8fr 1fr;gap:10px;align-items:center;padding:11px 14px}
        .iv-th{background:var(--vs-50);font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase;letter-spacing:.5px}
        .iv-tr{border-top:1px solid var(--vs-100);font-size:13px;color:var(--vs-700)}
        .iv-id{font-weight:700;color:var(--vs-900)}
        .iv-muted{font-size:11px;color:var(--vs-400)}
        .iv-pill{display:inline-flex;padding:4px 8px;border-radius:100px;font-size:11px;font-weight:700}
        .draft{background:#f8fafc;color:#475569}.sent{background:#eff6ff;color:#1d4ed8}.paid{background:#f0fdf4;color:#15803d}.cancelled{background:#fef2f2;color:#dc2626}
        .pending{background:#fffbeb;color:#b45309}
        .iv-a{padding:6px 9px;border:1px solid var(--vs-200);border-radius:8px;background:#fff;font-size:11px;cursor:pointer}
        .iv-empty{padding:24px;text-align:center;color:var(--vs-400)}
      `}</style>

      <div className="iv">
        <div className="iv-h">
          <div>
            <h1 className="iv-title">Facturas</h1>
            <p className="iv-sub">Gestion de facturas emitidas del vendedor.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="iv-btn" onClick={load}>Actualizar</button>
          </div>
        </div>

        <div className="iv-k">
          <div className="iv-ki"><div className="iv-kn">{stats.invoices}</div><div className="iv-kl">Facturas</div></div>
          <div className="iv-ki"><div className="iv-kn">{fmtMoney(stats.total)}</div><div className="iv-kl">Facturado</div></div>
          <div className="iv-ki"><div className="iv-kn">{fmtMoney(stats.pending)}</div><div className="iv-kl">Pendiente cobro</div></div>
          <div className="iv-ki"><div className="iv-kn">{stats.paid}</div><div className="iv-kl">Pagadas</div></div>
        </div>

        <div className="iv-bar">
          <input className="iv-in" style={{ minWidth: 260 }} placeholder="Buscar por ID, numero o cliente..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="iv-in" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Estado: Todos</option>
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="paid">Pagada</option>
            <option value="cancelled">Cancelada</option>
          </select>
          <select className="iv-in" value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option value="all">Pago: Todos</option>
            <option value="paid">Pagado</option>
            <option value="pending">Pendiente</option>
          </select>
        </div>

        <div className="iv-card">
          <div className="iv-th">
            <span>Factura</span><span>Cliente</span><span>Fecha</span><span>Total</span><span>Estado</span><span>Acciones</span>
          </div>

          {loading && <div className="iv-empty">Cargando facturas...</div>}
          {!loading && filtered.length === 0 && <div className="iv-empty">No hay facturas con ese filtro.</div>}

          {!loading && filtered.map((r) => (
            <div key={r.id} className="iv-tr">
              <div>
                <div className="iv-id">{r.id}</div>
                <div className="iv-muted">{r.number || "-"}</div>
              </div>
              <div>
                <div>{r.customer?.name || "-"}</div>
                <div className="iv-muted">{r.customer?.email || "-"}</div>
              </div>
              <span>{fmtDate(r.issuedAt)}</span>
              <span style={{ fontWeight: 800 }}>{fmtMoney(r.total)}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className={`iv-pill ${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span>
                <span className={`iv-pill ${r.paymentStatus === "paid" ? "paid" : "pending"}`}>{r.paymentStatus === "paid" ? "Pagado" : "Pendiente"}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button className="iv-a" onClick={() => navigate(`/vendor/invoices/${r.id}`)}>Ver detalle</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
