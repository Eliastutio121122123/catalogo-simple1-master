import { api } from "./odooClient";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const TOKEN_KEY = "catalogix_token";

function normalize(invoice) {
  if (!invoice) return null;
  return {
    ...invoice,
    id: String(invoice.id),
    number: invoice.number || null,
    orderId: invoice.orderId || null,
    customer: invoice.customer || { name: "", email: "", phone: "", address: "" },
    status: invoice.status || "draft",
    paymentStatus: invoice.paymentStatus || "pending",
    paymentMethod: invoice.paymentMethod || "manual",
    issuedAt: invoice.issuedAt || null,
    dueAt: invoice.dueAt || null,
    currency: invoice.currency || "DOP",
    subtotal: Number(invoice.subtotal) || 0,
    tax: Number(invoice.tax) || 0,
    total: Number(invoice.total) || 0,
    paidAmount: Number(invoice.paidAmount) || 0,
    notes: invoice.notes || "",
    lines: Array.isArray(invoice.lines) ? invoice.lines : [],
  };
}

async function fetchPdfBlob(invoiceId) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${BASE_URL}/api/vendor/invoices/${invoiceId}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "No se pudo descargar la factura.");
  }
  return res.blob();
}

const invoiceService = {
  list: async () => {
    const rows = await api.get("/api/vendor/invoices");
    return Array.isArray(rows) ? rows.map(normalize) : [];
  },

  getById: async (id) => {
    const row = await api.get(`/api/vendor/invoices/${id}`);
    return normalize(row);
  },

  updateStatus: async (id, status) => {
    const row = await api.patch(`/api/vendor/invoices/${id}/status`, { status });
    return normalize(row);
  },

  markAsPaid: async (id, method = "manual") => {
    const row = await api.post(`/api/vendor/invoices/${id}/mark-paid`, { method });
    return normalize(row);
  },

  /** Download the Odoo invoice PDF as a file */
  downloadPdf: async (id, filename) => {
    const blob = await fetchPdfBlob(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `factura-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  },

  /** Open the Odoo invoice PDF in a new tab for printing */
  printPdf: async (id) => {
    const blob = await fetchPdfBlob(id);
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    // Let the browser load the PDF, then trigger print dialog
    if (win) {
      win.addEventListener("load", () => {
        try { win.print(); } catch { /* user may close manually */ }
      });
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  },
};

export default invoiceService;

