import io

from flask import Blueprint, send_file, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.customer_invoices import customer_invoice_service
from ..utils.response import error, success

bp = Blueprint("customer_invoices", __name__)


def _is_invoice_model_missing(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "account.move" in msg and "does not exist" in msg


class CustomerInvoicesAPI(MethodView):
    decorators = [jwt_required]

    def get(self):
        payload = getattr(request, "jwt_payload", {}) or {}
        uid = payload.get("uid")
        if not uid:
            return error("Invalid token", 401)

        try:
            return success(customer_invoice_service.list_invoices(int(uid)))
        except Exception as exc:
            if _is_invoice_model_missing(exc):
                return success([])
            return error(str(exc), 500)


class CustomerInvoiceDetailAPI(MethodView):
    decorators = [jwt_required]

    def get(self, invoice_id: int):
        payload = getattr(request, "jwt_payload", {}) or {}
        uid = payload.get("uid")
        if not uid:
            return error("Invalid token", 401)

        try:
            return success(customer_invoice_service.get_invoice(int(uid), invoice_id))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            if _is_invoice_model_missing(exc):
                return error("Invoice model not available", 503)
            return error(str(exc), 500)


class CustomerInvoicePdfAPI(MethodView):
    decorators = [jwt_required]

    def get(self, invoice_id: int):
        payload = getattr(request, "jwt_payload", {}) or {}
        uid = payload.get("uid")
        if not uid:
            return error("Invalid token", 401)

        try:
            pdf_bytes = customer_invoice_service.get_invoice_pdf(int(uid), invoice_id)
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            if _is_invoice_model_missing(exc):
                return error("Invoice model not available", 503)
            return error(str(exc), 500)

        filename = f"invoice-{invoice_id}.pdf"
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=False,
            download_name=filename,
        )


bp.add_url_rule("", view_func=CustomerInvoicesAPI.as_view("customer_invoices"))
bp.add_url_rule("/<int:invoice_id>", view_func=CustomerInvoiceDetailAPI.as_view("customer_invoice_detail"))
bp.add_url_rule("/<int:invoice_id>/pdf", view_func=CustomerInvoicePdfAPI.as_view("customer_invoice_pdf"))
