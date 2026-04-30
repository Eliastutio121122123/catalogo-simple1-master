import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { vendorOrderService } from "../../services/odoo/vendorOrderService";
import { downloadBrandedExcel } from "../../utils/brandedExcel";
import { printTablePdf } from "../../utils/tablePdf";

const IcoSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

class OrderStatusCatalog {
  constructor() {
    this.map = {
      pending:    { label: "Pendiente",  bg: "#fffbeb", clr: "#d97706" },
      processing: { label: "Procesando", bg: "#eff6ff", clr: "#2563eb" },
      shipped:    { label: "Enviado",    bg: "#f0fdf4", clr: "#16a34a" },
      delivered:  { label: "Entregado",  bg: "#f0fdf4", clr: "#15803d" },
      cancelled:  { label: "Cancelado",  bg: "#fef2f2", clr: "#ef4444" },
    };
  }

  get(status) {
    return this.map[status] || this.map.pending;
  }
}

class VendorOrderListAdapter {
  constructor() {
    this.statusCatalog = new OrderStatusCatalog();
  }

  toRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => this.toRow(row));
  }

  toRow(row) {
    return {
      id: row.id,
      code: row.name || `SO${row.id}`,
      customer: row.customer || "Cliente",
      product: row.product || "Producto",
      amount: Number(row.amount || 0),
      items: Number(row.items || 0),
      status: row.status || "pending",
      date: row.date || "",
      statusCfg: this.statusCatalog.get(row.status),
    };
  }
}

class SearchDebouncer {
  constructor(delay = 350) {
    this.delay = delay;
    this.timer = null;
  }

  run(fn) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(fn, this.delay);
  }
}

const adapter = new VendorOrderListAdapter();

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(Number(n || 0));

const fmtDate = (d) => {
  if (!d) return "";
  const date = new Date(d.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("es-DO", { day: "2-digit", month: "short" });
};

export default function Orders() {
  const navigate = useNavigate();
  const debouncer = useRef(new SearchDebouncer(300));
  const inFlightRef = useRef(false);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const fetchOrders = async (q, st, { silent = false } = {}) => {
    if (inFlightRef.current && silent) return;
    inFlightRef.current = true;
    if (!silent) setLoading(true);
    if (!silent) setError("");
    try {
      const rows = await vendorOrderService.list({
        q: q || "",
        status: st === "all" ? "" : st,
        limit: 200,
      });
      setOrders(adapter.toRows(rows));
      setError("");
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los pedidos.");
    } finally {
      inFlightRef.current = false;
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(query, status);
  }, [status]);

  useEffect(() => {
    debouncer.current.run(() => fetchOrders(query, status));
  }, [query]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchOrders(query, status, { silent: true });
    }, 15000);
    return () => clearInterval(intervalId);
  }, [query, status]);

  const totalCount = orders.length;
  const totalAmount = useMemo(() => orders.reduce((acc, o) => acc + o.amount, 0), [orders]);

  const exportColumns = useMemo(() => {
    const statusLabel = (s) => adapter.statusCatalog.get(s)?.label || "Pendiente";
    return [
      { key: "code", label: "Pedido" },
      { key: "customer", label: "Cliente" },
      { key: "product", label: "Producto" },
      { key: "items", label: "Items", className: "td num" },
      { key: "amount", label: "Total", className: "td num", format: (_, row) => fmtMoney(row.amount) },
      { key: "status", label: "Estado", format: (_, row) => statusLabel(row.status) },
      { key: "date", label: "Fecha", format: (_, row) => fmtDate(row.date) },
    ];
  }, []);

  const exportExcel = () => {
    if (!orders.length) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadBrandedExcel({
      filename: `pedidos_${date}.xls`,
      sheetName: "Pedidos",
      reportTitle: "Reporte de Pedidos",
      columns: exportColumns,
      rows: orders,
    });
  };

  const exportPdf = () => {
    if (!orders.length) return;
    const date = new Date().toISOString().slice(0, 10);
    printTablePdf({
      filename: `pedidos_${date}.pdf`,
      title: "Pedidos",
      subtitle: `${totalCount} pedidos · ${fmtMoney(totalAmount)} total`,
      columns: exportColumns,
      rows: orders,
    });
  };

  return (
    <>
      <style>{`
        .vo { display:flex; flex-direction:column; gap:14px; }
        .vo-head { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
        .vo-title { font-family:'Lexend',sans-serif; font-size:20px; font-weight:800; color:var(--vs-900); }
        .vo-sub { font-size:12px; color:var(--vs-400); }
        .vo-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .vo-search { display:flex; align-items:center; gap:8px; padding:8px 12px; border:1.5px solid var(--vs-200); border-radius:10px; background:var(--vw); }
        .vo-search input { border:none; outline:none; font-size:13px; font-weight:600; color:var(--vs-800); min-width:180px; font-family:'Nunito',sans-serif; }
        .vo-filter { padding:8px 12px; border:1.5px solid var(--vs-200); border-radius:10px; background:var(--vw); font-size:13px; font-weight:700; color:var(--vs-700); font-family:'Nunito',sans-serif; }
        .vo-card { background:var(--vw); border:1px solid var(--vs-200); border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(15,23,42,.04); }
        .vo-row { display:grid; grid-template-columns:100px 1fr 1fr 90px 120px 110px 90px; gap:10px; padding:12px 16px; align-items:center; border-bottom:1px solid var(--vs-50); }
        .vo-row:last-child { border-bottom:none; }
        .vo-th { font-size:11px; font-weight:800; color:var(--vs-400); text-transform:uppercase; letter-spacing:.7px; background:var(--vs-50); }
        .vo-id { font-family:'Lexend',sans-serif; font-size:12.5px; font-weight:700; color:var(--vt-600); }
        .vo-name { font-size:13px; font-weight:700; color:var(--vs-800); }
        .vo-prod { font-size:12px; color:var(--vs-400); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .vo-money { font-family:'Lexend',sans-serif; font-size:13px; font-weight:800; color:var(--vs-900); }
        .vo-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:100px; font-size:11px; font-weight:700; white-space:nowrap; }
        .vo-btn { padding:7px 10px; border-radius:9px; border:1px solid var(--vs-200); background:var(--vw); font-size:12px; font-weight:700; color:var(--vs-700); cursor:pointer; }
        .vo-btn:hover { border-color:var(--vt-400); color:var(--vt-600); }
        .vo-xbtn { padding:8px 12px; border-radius:10px; border:1.5px solid var(--vs-200); background:var(--vw); font-size:13px; font-weight:800; color:var(--vs-700); cursor:pointer; }
        .vo-xbtn:hover { border-color:var(--vt-400); color:var(--vt-600); }
        .vo-xbtn:disabled { opacity:.55; cursor:not-allowed; }
        .vo-empty { padding:18px; font-size:12.5px; color:var(--vs-400); }
        .vo-error { padding:18px; font-size:12.5px; color:#dc2626; font-weight:700; }
        @media(max-width:980px){
          .vo-row { grid-template-columns:100px 1fr 90px 110px; }
          .vo-col-hide { display:none; }
        }
        @media(max-width:640px){
          .vo-row { grid-template-columns:1fr 90px 90px; }
          .vo-id { display:none; }
        }
      `}</style>

      <div className="vo">
        <div className="vo-head">
          <div>
            <div className="vo-title">Pedidos</div>
            <div className="vo-sub">{totalCount} pedidos · {fmtMoney(totalAmount)} total</div>
          </div>
          <div className="vo-actions">
            <button className="vo-xbtn" onClick={exportPdf} disabled={!orders.length}>Exportar PDF</button>
            <button className="vo-xbtn" onClick={exportExcel} disabled={!orders.length}>Exportar Excel</button>
            <div className="vo-search">
              <IcoSearch />
              <input
                placeholder="Buscar cliente o pedido"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select className="vo-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="shipped">Enviados</option>
              <option value="delivered">Entregados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>

        <div className="vo-card">
          <div className="vo-row vo-th">
            <div>ID</div>
            <div>Cliente</div>
            <div className="vo-col-hide">Producto</div>
            <div>Items</div>
            <div>Total</div>
            <div>Estado</div>
            <div>Acciones</div>
          </div>
          {loading && <div className="vo-empty">Cargando pedidos...</div>}
          {error && <div className="vo-error">{error}</div>}
          {!loading && !error && orders.length === 0 && (
            <div className="vo-empty">No hay pedidos para mostrar.</div>
          )}
          {!loading && !error && orders.map((o) => (
            <div className="vo-row" key={o.id}>
              <div className="vo-id">{o.code}</div>
              <div>
                <div className="vo-name">{o.customer}</div>
                <div className="vo-prod">{fmtDate(o.date)}</div>
              </div>
              <div className="vo-prod vo-col-hide">{o.product}</div>
              <div>{o.items}</div>
              <div className="vo-money">{fmtMoney(o.amount)}</div>
              <div>
                <span className="vo-badge" style={{ background: o.statusCfg.bg, color: o.statusCfg.clr }}>
                  {o.statusCfg.label}
                </span>
              </div>
              <div>
                <button className="vo-btn" onClick={() => navigate(`/vendor/orders/${o.id}`)}>Ver</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
