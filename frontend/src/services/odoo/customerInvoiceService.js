import { api } from "./odooClient";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const TOKEN_KEY = "catalogix_token";

class PdfDownloader {
  async fetchPdf(invoiceId) {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${BASE_URL}/api/customer/invoices/${invoiceId}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "No se pudo descargar la factura.");
    }
    return await res.blob();
  }

  openBlob(blob) {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "factura.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }
}

class CustomerInvoiceService {
  constructor(client, pdfDownloader) {
    this.client = client;
    this.pdfDownloader = pdfDownloader;
  }

  async list() {
    const rows = await this.client.get("/api/customer/invoices");
    return Array.isArray(rows) ? rows : [];
  }

  async getById(invoiceId) {
    return await this.client.get(`/api/customer/invoices/${invoiceId}`);
  }

  async viewPdf(invoiceId) {
    const blob = await this.pdfDownloader.fetchPdf(invoiceId);
    this.pdfDownloader.openBlob(blob);
  }

  async downloadPdf(invoiceId, filename) {
    const blob = await this.pdfDownloader.fetchPdf(invoiceId);
    this.pdfDownloader.downloadBlob(blob, filename || `factura-${invoiceId}.pdf`);
  }
}

export const customerInvoiceService = new CustomerInvoiceService(api, new PdfDownloader());
