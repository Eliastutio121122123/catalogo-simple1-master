import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import invoiceService from "../../services/odoo/invoiceService";

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-DO", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const STATUS_LABEL = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
  cancelled: "Cancelada",
};

export default function InvoiceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [invoice, setInvoice]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [pdfBusy, setPdfBusy]   = useState(false);   // print or download in progress
  const [toast, setToast]       = useState(null);     // { msg, type }

  const showToast = (msg, type = "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getById(id);
      setInvoice(data);
    } catch (e) {
      showToast(e.message || "Error al cargar la factura.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const balance = useMemo(() => {
    if (!invoice) return 0;
    return Math.max(0, Number(invoice.total || 0) - Number(invoice.paidAmount || 0));
  }, [invoice]);

  const handleStatus = async (nextStatus) => {
    if (!invoice || nextStatus === invoice.status) return;
    setSaving(true);
    try {
      await invoiceService.updateStatus(invoice.id, nextStatus);
      await load();
    } catch (e) {
      showToast(e.message || "Error al cambiar estado.");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!invoice || invoice.paymentStatus === "paid") return;
    setSaving(true);
    try {
      await invoiceService.markAsPaid(invoice.id, "manual");
      await load();
    } catch (e) {
      showToast(e.message || "Error al marcar como pagada.");
    } finally {
      setSaving(false);
    }
  };

  /** Open the Odoo PDF in a new tab and trigger the browser print dialog */
  const handlePrint = async () => {
    if (!invoice || pdfBusy) return;
    setPdfBusy(true);
    try {
      await invoiceService.printPdf(invoice.id);
    } catch (e) {
      showToast(e.message || "No se pudo abrir la factura para imprimir.");
    } finally {
      setPdfBusy(false);
    }
  };

  /** Download the Odoo PDF directly to the user's device */
  const handleDownloadPdf = async () => {
    if (!invoice || pdfBusy) return;
    setPdfBusy(true);
    try {
      const filename = invoice.number
        ? `factura-${invoice.number.replace(/\//g, "-")}.pdf`
        : `factura-${invoice.id}.pdf`;
      await invoiceService.downloadPdf(invoice.id, filename);
    } catch (e) {
      showToast(e.message || "No se pudo descargar la factura PDF.");
    } finally {
      setPdfBusy(false);
    }
  };

  if (loading) {
    return <div style={{ fontSize: 13, color: "var(--vs-500)" }}>Cargando detalle de factura...</div>;
  }

  if (!invoice) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "Lexend, sans-serif", fontSize: 20, fontWeight: 800, color: "var(--vs-900)" }}>Factura no encontrada</div>
        <button style={{ width: "fit-content", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--vs-200)", background: "#fff", cursor: "pointer" }} onClick={() => navigate("/vendor/invoices")}>Volver a facturas</button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .idv{display:flex;flex-direction:column;gap:14px}
        .idv-h{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start}
        .idv-t{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .idv-s{font-size:12.5px;color:var(--vs-500)}
        .idv-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
        .idv-btn{padding:9px 14px;border-radius:10px;border:1.5px solid var(--vs-200);background:#fff;cursor:pointer;font-size:13px;font-weight:700;color:var(--vs-700);display:inline-flex;align-items:center;gap:6px;transition:border-color .15s,background .15s}
        .idv-btn:hover:not(:disabled){border-color:var(--vt-500);color:var(--vt-700)}
        .idv-btn.pri{border:none;background:linear-gradient(135deg,var(--vt-700,#0e7490),var(--vt-500,#06b6d4));color:#fff}
        .idv-btn.pri:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}
        .idv-btn.warn{border:1.5px solid #fcd34d;background:#fffbeb;color:#b45309}
        .idv-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}
        .idv-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:12px}
        @media(max-width:980px){.idv-grid{grid-template-columns:1fr}}
        .idv-card{background:#fff;border:1px solid var(--vs-200);border-radius:16px;overflow:hidden}
        .idv-ch{padding:12px 14px;border-bottom:1px solid var(--vs-100);display:flex;justify-content:space-between;gap:8px;align-items:center}
        .idv-ct{font-family:'Lexend',sans-serif;font-size:14px;font-weight:800;color:var(--vs-900)}
        .idv-b{padding:14px;display:flex;flex-direction:column;gap:10px}
        .idv-th,.idv-tr{display:grid;grid-template-columns:1.3fr .5fr .6fr .6fr;gap:10px;align-items:center;padding:10px 14px}
        .idv-th{font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase;letter-spacing:.5px;background:var(--vs-50)}
        .idv-tr{border-top:1px solid var(--vs-100);font-size:13px;color:var(--vs-700)}
        .idv-muted{font-size:11px;color:var(--vs-400)}
        .idv-p{display:inline-flex;padding:4px 8px;border-radius:100px;font-size:11px;font-weight:700}
        .draft{background:#f8fafc;color:#475569}.sent{background:#eff6ff;color:#1d4ed8}.paid{background:#f0fdf4;color:#15803d}.cancelled{background:#fef2f2;color:#dc2626}
        .pending{background:#fffbeb;color:#b45309}
        .idv-kv{display:flex;justify-content:space-between;gap:10px;padding:6px 0;font-size:13px;color:var(--vs-700)}
        .idv-sep{height:1px;background:var(--vs-100);margin:4px 0}

        /* Spinner inside buttons */
        .spin-sm{width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:idv-spin .6s linear infinite;flex-shrink:0}
        .spin-sm.dark{border-color:rgba(0,0,0,.15);border-top-color:var(--vt-600,#0891b2)}
        @keyframes idv-spin{to{transform:rotate(360deg)}}

        /* Toast notification */
        .idv-toast{position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 18px;border-radius:12px;font-size:13px;font-weight:700;box-shadow:0 4px 20px rgba(0,0,0,.18);animation:idv-fadeIn .25s ease}
        .idv-toast.err{background:#fef2f2;color:#b91c1c;border:1px solid #fca5a5}
        .idv-toast.ok{background:#f0fdf4;color:#15803d;border:1px solid #86efac}
        @keyframes idv-fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {toast && <div className={`idv-toast ${toast.type}`}>{toast.msg}</div>}

      <div className="idv">
        <div className="idv-h">
          <div>
            <h1 className="idv-t">{invoice.number || invoice.id}</h1>
            <p className="idv-s">Detalle de factura y estado de cobro.</p>
          </div>
          <div className="idv-row">
            <button className="idv-btn" onClick={() => navigate("/vendor/invoices")}>
              ← Volver
            </button>

            {/* IMPRIMIR — abre el PDF de Odoo en nueva pestaña y dispara el diálogo de impresión */}
            <button
              className="idv-btn"
              disabled={pdfBusy}
              onClick={handlePrint}
              title="Abrir factura Odoo e imprimir"
            >
              {pdfBusy ? <span className="spin-sm dark" /> : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                </svg>
              )}
              Imprimir
            </button>

            {/* DESCARGAR PDF — descarga directamente el PDF de Odoo */}
            <button
              className="idv-btn pri"
              disabled={pdfBusy}
              onClick={handleDownloadPdf}
              title="Descargar factura como PDF"
            >
              {pdfBusy ? <span className="spin-sm" /> : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              Descargar PDF
            </button>
          </div>
        </div>

        <div className="idv-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="idv-card">
              <div className="idv-ch"><div className="idv-ct">Lineas de factura</div></div>
              <div className="idv-th"><span>Producto</span><span>Cant.</span><span>Precio</span><span>Total</span></div>
              {invoice.lines.length === 0 ? (
                <div style={{ padding: "16px", fontSize: 13, color: "var(--vs-400)", textAlign: "center" }}>Sin líneas de factura</div>
              ) : invoice.lines.map((line) => (
                <div key={line.id} className="idv-tr">
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--vs-900)" }}>{line.name}</div>
                    {line.sku && <div className="idv-muted">{line.sku}</div>}
                  </div>
                  <span>{line.qty}</span>
                  <span>{fmtMoney(line.unitPrice)}</span>
                  <span style={{ fontWeight: 800 }}>{fmtMoney(line.total)}</span>
                </div>
              ))}
            </div>

            <div className="idv-card">
              <div className="idv-ch"><div className="idv-ct">Notas</div></div>
              <div className="idv-b">
                <div style={{ fontSize: 13, color: "var(--vs-700)" }}
                  dangerouslySetInnerHTML={{ __html: invoice.notes || "<em style='color:var(--vs-400)'>Sin notas</em>" }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="idv-card">
              <div className="idv-ch"><div className="idv-ct">Estado</div></div>
              <div className="idv-b">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className={`idv-p ${invoice.status}`}>{STATUS_LABEL[invoice.status] || invoice.status}</span>
                  <span className={`idv-p ${invoice.paymentStatus === "paid" ? "paid" : "pending"}`}>{invoice.paymentStatus === "paid" ? "Pagado" : "Pendiente"}</span>
                </div>
                <div className="idv-row">
                  <button className="idv-btn" disabled={saving} onClick={() => handleStatus("draft")}>Borrador</button>
                  <button className="idv-btn" disabled={saving} onClick={() => handleStatus("sent")}>Enviar</button>
                  <button className="idv-btn warn" disabled={saving} onClick={() => handleStatus("cancelled")}>Cancelar</button>
                </div>
                <button className="idv-btn pri" disabled={saving || invoice.paymentStatus === "paid"} onClick={handleMarkPaid}>
                  {invoice.paymentStatus === "paid" ? "✓ Ya pagada" : "Marcar como pagada"}
                </button>
              </div>
            </div>

            <div className="idv-card">
              <div className="idv-ch"><div className="idv-ct">Resumen de cobro</div></div>
              <div className="idv-b">
                <div className="idv-kv"><span>Subtotal</span><strong>{fmtMoney(invoice.subtotal)}</strong></div>
                <div className="idv-kv"><span>Impuestos</span><strong>{fmtMoney(invoice.tax)}</strong></div>
                <div className="idv-kv"><span>Total</span><strong>{fmtMoney(invoice.total)}</strong></div>
                <div className="idv-sep" />
                <div className="idv-kv"><span>Pagado</span><strong>{fmtMoney(invoice.paidAmount)}</strong></div>
                <div className="idv-kv"><span>Balance</span><strong>{fmtMoney(balance)}</strong></div>
                <div className="idv-kv"><span>Metodo</span><strong style={{ textTransform: "capitalize" }}>{invoice.paymentMethod || "-"}</strong></div>
              </div>
            </div>

            <div className="idv-card">
              <div className="idv-ch"><div className="idv-ct">Cliente</div></div>
              <div className="idv-b">
                <div className="idv-kv"><span>Nombre</span><strong>{invoice.customer?.name || "-"}</strong></div>
                <div className="idv-kv"><span>Email</span><strong>{invoice.customer?.email || "-"}</strong></div>
                <div className="idv-kv"><span>Telefono</span><strong>{invoice.customer?.phone || "-"}</strong></div>
                <div className="idv-kv"><span>Direccion</span><strong>{invoice.customer?.address || "-"}</strong></div>
                <div className="idv-sep" />
                <div className="idv-kv"><span>Orden</span><strong>{invoice.orderId || "-"}</strong></div>
                <div className="idv-kv"><span>Emitida</span><strong>{fmtDate(invoice.issuedAt)}</strong></div>
                <div className="idv-kv"><span>Vence</span><strong>{fmtDate(invoice.dueAt)}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

