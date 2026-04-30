from __future__ import annotations

from datetime import date, datetime
import requests

from .client import odoo
from .users import UserService


class CustomerInvoiceMapper:
    def _status(self, invoice: dict) -> str:
        payment_state = (invoice.get("payment_state") or "").lower()
        if payment_state in {"paid", "in_payment"}:
            return "paid"

        due = invoice.get("invoice_date_due") or invoice.get("invoice_date")
        if due:
            try:
                due_date = date.fromisoformat(str(due)[:10])
                if due_date < date.today():
                    return "overdue"
            except ValueError:
                pass
        return "pending"

    def to_row(self, invoice: dict) -> dict:
        number = invoice.get("name")
        number = None if number in (None, "/", False) else str(number)
        return {
            "invoiceId": int(invoice.get("id") or 0),
            "id": number or f"INV-{int(invoice.get('id') or 0):06d}",
            "orderId": invoice.get("invoice_origin") or None,
            "orderRef": invoice.get("invoice_origin") or "",
            "date": (invoice.get("invoice_date") or "")[:10] if invoice.get("invoice_date") else None,
            "dueDate": (invoice.get("invoice_date_due") or "")[:10] if invoice.get("invoice_date_due") else None,
            "total": float(invoice.get("amount_total") or 0),
            "status": self._status(invoice),
        }


class InvoiceReportService:
    REPORTS = [
        "account.report_invoice",
        "account.report_invoice_with_payments",
        "account.report_invoice_document",
    ]

    def __init__(self, client):
        self._client = client

    def fetch_pdf(self, invoice_id: int) -> bytes:
        cfg = self._client._cfg()
        session = requests.Session()
        self._client.authenticate(session=session, persist=False)

        last_exc = None
        for report_name in self.REPORTS:
            url = f"{cfg['url']}/report/pdf/{report_name}/{invoice_id}"
            try:
                resp = session.get(url, timeout=20)
            except requests.RequestException as exc:
                last_exc = exc
                continue
            if resp.status_code < 400 and resp.content:
                return resp.content
            last_exc = RuntimeError(f"Report {report_name} failed ({resp.status_code})")
        raise RuntimeError("No se pudo generar el PDF de la factura") from last_exc


class CustomerInvoiceService:
    FIELDS = [
        "id",
        "name",
        "state",
        "payment_state",
        "invoice_origin",
        "invoice_date",
        "invoice_date_due",
        "amount_total",
        "partner_id",
    ]

    def __init__(self, client):
        self._client = client
        self._mapper = CustomerInvoiceMapper()
        self._reporter = InvoiceReportService(client)

    def list_invoices(self, uid: int) -> list[dict]:
        partner_id = UserService.resolve_partner_id(uid)
        if not partner_id:
            raise RuntimeError("No partner linked to this user")

        rows = self._client.search_read(
            "account.move",
            [["move_type", "=", "out_invoice"], ["partner_id", "=", int(partner_id)]],
            self.FIELDS,
            limit=500,
            order="id desc",
        )
        return [self._mapper.to_row(row) for row in rows]

    def get_invoice(self, uid: int, invoice_id: int) -> dict:
        invoice = self._owned_invoice(uid, invoice_id)
        return self._mapper.to_row(invoice)

    def get_invoice_pdf(self, uid: int, invoice_id: int) -> bytes:
        self._owned_invoice(uid, invoice_id)
        return self._reporter.fetch_pdf(invoice_id)

    def _owned_invoice(self, uid: int, invoice_id: int) -> dict:
        partner_id = UserService.resolve_partner_id(uid)
        if not partner_id:
            raise RuntimeError("No partner linked to this user")

        rows = self._client.search_read(
            "account.move",
            [["id", "=", int(invoice_id)], ["move_type", "=", "out_invoice"], ["partner_id", "=", int(partner_id)]],
            self.FIELDS,
            limit=1,
        )
        if not rows:
            raise LookupError(f"Invoice {invoice_id} not found")
        return rows[0]


customer_invoice_service = CustomerInvoiceService(odoo)
