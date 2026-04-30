from datetime import date

from odoo import http
from odoo.http import request

from .api_base import error, get_json, ok, require_jwt


INVOICE_FIELDS = [
    "id",
    "name",
    "move_type",
    "state",
    "payment_state",
    "invoice_origin",
    "invoice_date",
    "invoice_date_due",
    "amount_untaxed",
    "amount_tax",
    "amount_total",
    "amount_residual",
    "partner_id",
    "invoice_user_id",
    "payment_reference",
    "ref",
    "narration",
    "currency_id",
    "invoice_line_ids",
]

LINE_FIELDS = [
    "id",
    "name",
    "product_id",
    "quantity",
    "price_unit",
    "price_subtotal",
    "display_type",
]


def _status_from_move(rec: dict) -> tuple[str, str]:
    state = rec.get("state")
    payment_state = (rec.get("payment_state") or "").lower()

    if state == "draft":
        return "draft", "pending"
    if state == "cancel":
        return "cancelled", "pending"
    if payment_state in {"paid", "in_payment"}:
        return "paid", "paid"
    return "sent", "pending"


def _partner_map(partner_ids: list[int]) -> dict[int, dict]:
    ids = sorted({int(pid) for pid in partner_ids if pid})
    if not ids:
        return {}
    rows = request.env["res.partner"].sudo().read(ids, ["id", "name", "email", "phone", "street", "city"])
    out = {}
    for row in rows:
        street = row.get("street") or ""
        city = row.get("city") or ""
        address = ", ".join([part for part in [street, city] if part]).strip() or None
        out[int(row["id"])] = {
            "name": row.get("name") or "",
            "email": row.get("email") or "",
            "phone": row.get("phone") or "",
            "address": address or "",
        }
    return out


def _move_to_api(rec: dict, partner_data: dict | None = None, lines: list[dict] | None = None) -> dict:
    partner = rec.get("partner_id")
    partner_id = partner[0] if isinstance(partner, list) else None
    fallback_name = partner[1] if isinstance(partner, list) and len(partner) > 1 else ""
    customer = partner_data or {
        "name": fallback_name,
        "email": "",
        "phone": "",
        "address": "",
    }

    status, payment_status = _status_from_move(rec)
    number = rec.get("name")
    number = None if number in (None, "/", False) else number

    return {
        "id": rec.get("id"),
        "number": number,
        "orderId": rec.get("invoice_origin") or None,
        "customer": customer,
        "status": status,
        "paymentStatus": payment_status,
        "paymentMethod": rec.get("payment_reference") or rec.get("ref") or "manual",
        "issuedAt": rec.get("invoice_date"),
        "dueAt": rec.get("invoice_date_due"),
        "currency": (rec.get("currency_id") or [None, "DOP"])[1] if isinstance(rec.get("currency_id"), list) else "DOP",
        "subtotal": rec.get("amount_untaxed") or 0,
        "tax": rec.get("amount_tax") or 0,
        "total": rec.get("amount_total") or 0,
        "paidAmount": (rec.get("amount_total") or 0) - (rec.get("amount_residual") or 0),
        "notes": rec.get("narration") or "",
        "lines": lines or [],
        "partnerId": partner_id,
    }


def _owned_invoice(uid: int, invoice_id: int) -> dict:
    rows = (
        request.env["account.move"]
        .sudo()
        .search_read(
            [("id", "=", int(invoice_id)), ("move_type", "=", "out_invoice"), ("invoice_user_id", "=", int(uid))],
            INVOICE_FIELDS,
            limit=1,
        )
    )
    if not rows:
        raise LookupError(f"Invoice {invoice_id} not found")
    return rows[0]


def _mark_vendor_invoice_paid(uid: int, invoice_id: int, method: str = "manual") -> dict:
    invoice = _owned_invoice(uid, invoice_id)
    payment_state = (invoice.get("payment_state") or "").lower()
    if payment_state in {"paid", "in_payment"}:
        return _get_vendor_invoice(uid, invoice_id)

    move = request.env["account.move"].sudo().browse(int(invoice_id))
    if move.state == "draft":
        move.action_post()

    journals = request.env["account.journal"].sudo().search([("type", "in", ["bank", "cash"])], limit=1)
    if not journals:
        raise RuntimeError("No bank/cash journal available to register payment")

    amount = invoice.get("amount_residual") or invoice.get("amount_total") or 0
    ctx = {"active_model": "account.move", "active_ids": [invoice_id], "active_id": invoice_id}
    wizard_vals = {"journal_id": journals.id, "amount": amount, "payment_date": date.today().isoformat()}
    wizard = request.env["account.payment.register"].with_context(ctx).sudo().create(wizard_vals)
    wizard.with_context(ctx).action_create_payments()

    updated = _get_vendor_invoice(uid, invoice_id)
    updated["paymentMethod"] = method or updated.get("paymentMethod")
    return updated


def _get_vendor_invoice(uid: int, invoice_id: int) -> dict:
    row = _owned_invoice(uid, invoice_id)
    partner = row.get("partner_id")
    partner_id = partner[0] if isinstance(partner, list) else None
    partner_data = _partner_map([partner_id]).get(partner_id) if partner_id else None

    line_ids = row.get("invoice_line_ids") or []
    raw_lines = request.env["account.move.line"].sudo().read(line_ids, LINE_FIELDS) if line_ids else []
    lines = []
    for line in raw_lines:
        if line.get("display_type"):
            continue
        product = line.get("product_id")
        product_name = product[1] if isinstance(product, list) and len(product) > 1 else (line.get("name") or "Producto")
        lines.append({
            "id": line.get("id"),
            "name": product_name,
            "sku": "",
            "qty": line.get("quantity") or 0,
            "unitPrice": line.get("price_unit") or 0,
            "total": line.get("price_subtotal") or 0,
        })

    return _move_to_api(row, partner_data=partner_data, lines=lines)


class CatalogixVendorInvoicesController(http.Controller):
    @http.route("/api/vendor/invoices", type="http", auth="none", csrf=False, cors="*")
    def list_invoices(self, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        rows = (
            request.env["account.move"]
            .sudo()
            .search_read([("move_type", "=", "out_invoice"), ("invoice_user_id", "=", int(uid))], INVOICE_FIELDS, order="id desc", limit=500)
        )

        partner_ids = []
        for row in rows:
            partner = row.get("partner_id")
            if isinstance(partner, list):
                partner_ids.append(partner[0])
        partners = _partner_map(partner_ids)

        payload = [
            _move_to_api(
                row,
                partner_data=partners.get((row.get("partner_id") or [None])[0]) if isinstance(row.get("partner_id"), list) else None,
            )
            for row in rows
        ]
        return ok(payload)

    @http.route("/api/vendor/invoices/<int:invoice_id>", type="http", auth="none", csrf=False, cors="*")
    def get_invoice(self, invoice_id, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        try:
            return ok(_get_vendor_invoice(uid, invoice_id))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

    @http.route(
        "/api/vendor/invoices/<int:invoice_id>/status",
        type="http",
        auth="none",
        csrf=False,
        cors="*",
        methods=["PATCH"],
    )
    def update_status(self, invoice_id, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        data = get_json()
        status = (data.get("status") or "").strip().lower()
        if status not in {"draft", "sent", "paid", "cancelled"}:
            return error("Invalid invoice status", 400)

        try:
            invoice = _owned_invoice(uid, invoice_id)
            move = request.env["account.move"].sudo().browse(int(invoice_id))
            if status == "draft":
                move.button_draft()
            elif status == "sent":
                if move.state == "draft":
                    move.action_post()
            elif status == "cancelled":
                if move.state == "draft":
                    move.action_post()
                move.button_cancel()
            elif status == "paid":
                return ok(_mark_vendor_invoice_paid(uid, invoice_id))

            return ok(_get_vendor_invoice(uid, invoice_id))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

    @http.route(
        "/api/vendor/invoices/<int:invoice_id>/mark-paid",
        type="http",
        auth="none",
        csrf=False,
        cors="*",
        methods=["POST"],
    )
    def mark_paid(self, invoice_id, **kwargs):
        uid, err = require_jwt()
        if err:
            return err

        try:
            return ok(_mark_vendor_invoice_paid(uid, invoice_id))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

