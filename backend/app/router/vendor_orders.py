from flask import Blueprint, request
from flask.views import MethodView

from ..middleware.auth_guard import jwt_required
from ..odoo.vendor_orders import vendor_order_service
from ..utils.response import error, success
from ..whatsapp.service import WhatsAppError, whatsapp_service


class VendorOrdersAPI(MethodView):
    decorators = [jwt_required]

    def get(self):
        try:
            uid = int(request.jwt_payload.get("uid"))
            status = (request.args.get("status") or "").strip().lower() or None
            query = (request.args.get("q") or "").strip() or None
            limit = int(request.args.get("limit", 50))
            offset = int(request.args.get("offset", 0))
            rows = vendor_order_service.list_orders(uid, status=status, query=query, limit=limit, offset=offset)
            return success(rows)
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)


class VendorOrderDetailAPI(MethodView):
    decorators = [jwt_required]

    def get(self, order_id: int):
        try:
            uid = int(request.jwt_payload.get("uid"))
            row = vendor_order_service.get_order(uid, order_id)
            return success(row)
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            return error(str(exc), 500)

    def put(self, order_id: int):
        try:
            uid = int(request.jwt_payload.get("uid"))
            data = request.get_json(silent=True) or {}
            new_status = (data.get("status") or "").strip().lower()
            if not new_status:
                return error("Missing status", 400)
            vendor_order_service.update_order_status(uid, order_id, new_status)
            return success({"message": "Order updated successfully"})
        except LookupError as exc:
            return error(str(exc), 404)
        except ValueError as exc:
            return error(str(exc), 400)
        except Exception as exc:
            return error(str(exc), 500)


class VendorOrderNotifyAPI(MethodView):
    decorators = [jwt_required]

    STATUS_LABELS = {
        "pending": "Pendiente",
        "shipped": "Enviado",
        "delivered": "Entregado",
        "cancelled": "Cancelado",
    }

    def post(self, order_id: int):
        data = request.get_json(silent=True) or {}
        channel = str(data.get("channel") or "whatsapp").strip().lower() or "whatsapp"
        if channel not in ("whatsapp", "email", "both"):
            return error("Unsupported channel. Use 'whatsapp', 'email', or 'both'.", 400)

        try:
            uid = int(request.jwt_payload.get("uid"))
            order = vendor_order_service.get_order(uid, int(order_id))
            customer = order.get("customer") or {}
            to_phone = str(customer.get("phone") or "").strip()
            to_email = str(customer.get("email") or "").strip()

            body = str(data.get("body") or "").strip()
            if not body:
                body = self._default_message(order)

            results = {}

            if channel in ("whatsapp", "both"):
                if not to_phone:
                    if channel == "whatsapp": return error("Customer phone is missing.", 400)
                else:
                    try:
                        res = whatsapp_service.send_text(
                            to=to_phone,
                            body=body,
                            preview_url=bool(data.get("preview_url") or data.get("previewUrl") or False),
                        )
                        results["whatsapp"] = {"status": "success", "to": to_phone, "result": res}
                    except Exception as exc:
                        if channel == "whatsapp": raise exc
                        results["whatsapp"] = {"status": "error", "message": str(exc)}

            if channel in ("email", "both"):
                if not to_email:
                    if channel == "email": return error("Customer email is missing.", 400)
                else:
                    try:
                        from flask import current_app
                        from ..utils.emailer import send_email_smtp

                        host = current_app.config.get("SMTP_HOST")
                        if not host:
                            raise RuntimeError("SMTP_HOST not configured")

                        # BCC: envía copia silenciosa al vendedor/admin
                        vendor_bcc = current_app.config.get("VENDOR_NOTIFY_BCC") or None

                        send_email_smtp(
                            host=host,
                            port=int(current_app.config.get("SMTP_PORT", 587)),
                            username=current_app.config.get("SMTP_USER"),
                            password=current_app.config.get("SMTP_PASSWORD"),
                            use_tls=str(current_app.config.get("SMTP_USE_TLS")).lower() == "true",
                            use_ssl=str(current_app.config.get("SMTP_USE_SSL")).lower() == "true",
                            timeout_seconds=int(current_app.config.get("SMTP_TIMEOUT_SECONDS", 20)),
                            email_from=current_app.config.get("RESET_EMAIL_FROM") or current_app.config.get("SMTP_USER"),
                            email_to=to_email,
                            subject=f"Actualización de tu pedido: {order.get('id')}",
                            text_body=body,
                            from_name="Sistema de Ventas",
                            bcc=vendor_bcc,
                        )
                        results["email"] = {"status": "success", "to": to_email}
                    except Exception as exc:
                        if channel == "email": raise exc
                        results["email"] = {"status": "error", "message": str(exc)}

            if channel == "both" and not results:
                 return error("Customer has neither phone nor email.", 400)

            return success(results)
        except LookupError as exc:
            return error(str(exc), 404)
        except ValueError as exc:
            return error(str(exc), 400)
        except WhatsAppError as exc:
            return error(str(exc), 502)
        except Exception as exc:
            return error(str(exc), 500)

    def _default_message(self, order: dict) -> str:
        customer = order.get("customer") or {}
        name = str(customer.get("name") or "").strip() or "Hola"
        order_name = str(order.get("name") or order.get("id") or "").strip() or "tu pedido"
        status_key = str(order.get("status") or "").strip().lower() or "pending"
        status_label = self.STATUS_LABELS.get(status_key, status_key)
        total = order.get("total")
        try:
            total_fmt = f"RD${float(total or 0):,.2f}"
        except Exception:
            total_fmt = "RD$0.00"
        total_fmt = total_fmt.replace(",", "X").replace(".", ",").replace("X", ".")
        return f"Hola {name}, tu pedido {order_name} est\u00e1 {status_label}. Total: {total_fmt}. Gracias."


bp = Blueprint("vendor_orders", __name__)
bp.add_url_rule("", view_func=VendorOrdersAPI.as_view("vendor_orders"))
bp.add_url_rule("/<int:order_id>", view_func=VendorOrderDetailAPI.as_view("vendor_order_detail"))
bp.add_url_rule("/<int:order_id>/notify", view_func=VendorOrderNotifyAPI.as_view("vendor_order_notify"))


