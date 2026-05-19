from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from flask import current_app

from .client import odoo
from .users import UserService
from .delivery import DeliveryRequest
from .delivery_service import build_delivery_service
from .store_promotions import store_promotion_service
from .store_coupons import store_coupon_service, CouponError
from ..stripe.service import StripeLineItem, stripe_service
from ..utils.money import to_minor_units


@dataclass
class PaymentLine:
    product_id: int
    qty: float
    price: float


class PaymentRequest:
    SUPPORTED_METHODS = {"card", "paypal", "stripe", "cash", "bank"}
    METHOD_ALIASES = {
        "cod": "cash",
        "cash_on_delivery": "cash",
        "contra_entrega": "cash",
        "contraentrega": "cash",
    }

    def __init__(self, payload: dict | None):
        self._payload = payload or {}

    def method(self) -> str:
        raw = str(self._payload.get("method") or "card").strip().lower()
        raw = self.METHOD_ALIASES.get(raw, raw)
        return raw if raw in self.SUPPORTED_METHODS else "card"

    def order_id(self) -> int | None:
        for key in ("order_id", "orderId"):
            val = self._payload.get(key)
            if val:
                try:
                    return int(val)
                except (TypeError, ValueError):
                    return None
        return None

    def cart_id(self) -> int | None:
        for key in ("cart_id", "cartId"):
            val = self._payload.get(key)
            if val:
                try:
                    return int(val)
                except (TypeError, ValueError):
                    return None
        return None

    def partner_id(self) -> int | None:
        val = self._payload.get("partner_id") or self._payload.get("partnerId")
        if not val:
            return None
        try:
            return int(val)
        except (TypeError, ValueError):
            return None

    def card_last4(self) -> str:
        raw = str(self._payload.get("card_last4") or self._payload.get("cardLast4") or "").strip()
        digits = "".join(ch for ch in raw if ch.isdigit())
        return digits[-4:] if digits else ""

    def delivery(self) -> dict:
        return self._payload.get("delivery") or {}

    def coupon_code(self) -> str:
        raw = self._payload.get("coupon_code") or self._payload.get("couponCode") or self._payload.get("coupon") or ""
        return str(raw).strip().upper()

    def lines(self) -> list[PaymentLine]:
        raw_lines = self._payload.get("lines") or []
        if not isinstance(raw_lines, list):
            return []
        parsed: list[PaymentLine] = []
        for line in raw_lines:
            if not isinstance(line, dict):
                continue
            product_id = int(line.get("product_id") or line.get("productId") or 0)
            qty = float(line.get("qty") or line.get("quantity") or 0)
            price = float(line.get("price") or 0)
            if product_id <= 0 or qty <= 0:
                continue
            parsed.append(PaymentLine(product_id=product_id, qty=qty, price=price))
        return parsed


class PaymentJournalSelector:
    def __init__(self, client):
        self._client = client

    def pick(self, method: str) -> int:
        method = (method or "").strip().lower()
        preferred = ["cash"] if method == "cash" else ["bank"]
        fallback = ["bank"] if method == "cash" else ["cash"]

        journal_id = self._find_journal(preferred)
        if journal_id:
            return journal_id
        journal_id = self._find_journal(fallback)
        if journal_id:
            return journal_id
        raise RuntimeError("No suitable journal available to register payment")

    def _find_journal(self, types: list[str]) -> int | None:
        rows = self._client.search_read(
            "account.journal",
            [["type", "in", types]],
            ["id", "type", "name"],
            limit=1,
            order="id asc",
        )
        if not rows:
            return None
        return int(rows[0]["id"])


class PaymentService:
    ORDER_FIELDS = ["id", "name", "state", "partner_id", "invoice_ids", "amount_total", "order_line", "picking_ids"]
    INVOICE_FIELDS = [
        "id",
        "name",
        "state",
        "payment_state",
        "amount_total",
        "amount_residual",
        "currency_id",
    ]
    STRIPE_METHODS = {"card", "stripe"}

    def __init__(self, client):
        self._client = client
        self._journal_selector = PaymentJournalSelector(client)

    def _is_stripe_method(self, method: str) -> bool:
        return (method or "").strip().lower() in self.STRIPE_METHODS

    def checkout(self, uid: int, payload: dict | None) -> dict:
        request = PaymentRequest(payload)
        partner_id = self._resolve_partner_id(uid, request.partner_id())
        req_lines = request.lines()
        raw_lines = [{"product_id": l.product_id, "qty": l.qty, "price": l.price} for l in req_lines]

        # Apply vendor promotions first (server-side, based on Odoo list_price + promo rules).
        try:
            raw_lines, _promo_quote = store_promotion_service.apply_to_lines(lines=raw_lines)
        except Exception:
            # Best-effort; keep client prices if Odoo promotion quote fails.
            pass

        # Then apply store coupon code (if provided) on top of promo-adjusted prices.
        coupon_code = request.coupon_code()
        if coupon_code:
            try:
                raw_lines, _coupon_quote = store_coupon_service.apply_to_lines(
                    partner_id=int(partner_id),
                    code=coupon_code,
                    lines=raw_lines,
                )
            except CouponError as exc:
                raise ValueError(str(exc)) from exc

        lines = [
            PaymentLine(
                product_id=int(l.get("product_id") or 0),
                qty=float(l.get("qty") or 0),
                price=float(l.get("price") or 0),
            )
            for l in (raw_lines or [])
            if int(l.get("product_id") or 0) > 0 and float(l.get("qty") or 0) > 0
        ]

        lines = self._resolve_product_variants(lines)

        order_id, order = self._resolve_order(partner_id, request, lines)
        self._apply_delivery(order_id, partner_id, request.delivery())
        order, was_confirmed = self._confirm_order(order_id, order)
        if was_confirmed:
            self._decrement_catalog_stock(order_id)
            self._try_validate_pickings(order_id, order)

        invoice_id = self._ensure_invoice(order_id, order)
        invoice = self._read_invoice(invoice_id)
        self._try_assign_invoice_to_vendor(order_id=order_id, invoice_id=invoice_id)

        method = request.method()
        if self._is_stripe_method(method):
            return self._checkout_stripe(
                order_id=order_id,
                order=order,
                invoice_id=invoice_id,
                invoice=invoice,
                partner_id=partner_id,
                request=request,
            )

        if method != "cash":
            self._register_payment(invoice_id, method)
            invoice = self._read_invoice(invoice_id)

        self._annotate_invoice_reference(invoice_id, request)

        payment_status = self._payment_status(invoice, method)
        return self._build_response(
            order_id=order_id,
            order=order,
            invoice_id=invoice_id,
            invoice=invoice,
            method=method,
            payment_status=payment_status,
            card_last4=request.card_last4() or None,
        )

    def _resolve_product_variants(self, lines: list[PaymentLine]) -> list[PaymentLine]:
        if not lines:
            return lines

        template_ids = list({l.product_id for l in lines})
        try:
            templates = self._client.read(
                "product.template",
                template_ids,
                ["id", "product_variant_id", "product_variant_ids"]
            )
        except Exception:
            return lines

        tmpl_map = {}
        for t in templates:
            vid = t.get("product_variant_id")
            if vid:
                tmpl_map[t["id"]] = int(vid[0]) if isinstance(vid, list) else int(vid)
            else:
                vids = t.get("product_variant_ids")
                if vids:
                    tmpl_map[t["id"]] = int(vids[0])

        for line in lines:
            variant_id = tmpl_map.get(line.product_id)
            if variant_id:
                line.product_id = variant_id
        return lines

    def _apply_delivery(self, order_id: int, partner_id: int, payload: dict | None) -> None:
        try:
            req = DeliveryRequest(payload)
            if req.is_empty():
                return
            delivery = req.parse()
            service = build_delivery_service(self._client)
            service.apply_to_order(order_id=order_id, partner_id=partner_id, delivery=delivery)
        except ValueError:
            # Invalid delivery payload should block checkout to avoid orphan orders without address.
            raise
        except Exception as exc:
            # Don't block checkout for transient address issues, but log for visibility.
            try:
                current_app.logger.warning("delivery: apply failed order_id=%s err=%s", order_id, exc)
            except Exception:
                pass

    def _build_response(
        self,
        *,
        order_id: int,
        order: dict,
        invoice_id: int,
        invoice: dict,
        method: str,
        payment_status: str,
        card_last4: str | None = None,
        checkout_url: str | None = None,
        session_id: str | None = None,
    ) -> dict:
        payload = {
            "order": {
                "id": order_id,
                "name": order.get("name") or f"SO{order_id}",
                "state": order.get("state"),
                "total": float(order.get("amount_total") or 0),
            },
            "invoice": {
                "id": invoice_id,
                "number": invoice.get("name"),
                "state": invoice.get("state"),
                "payment_state": invoice.get("payment_state"),
                "total": float(invoice.get("amount_total") or 0),
                "residual": float(invoice.get("amount_residual") or 0),
                "currency": (invoice.get("currency_id") or [None, "DOP"])[1]
                if isinstance(invoice.get("currency_id"), list)
                else "DOP",
            },
            "payment": {
                "method": method,
                "status": payment_status,
                "card_last4": card_last4 or None,
            },
        }
        if checkout_url:
            payload["checkout_url"] = checkout_url
            payload["stripe"] = {
                "checkout_url": checkout_url,
                "session_id": session_id,
            }
        return payload

    def _checkout_stripe(
        self,
        *,
        order_id: int,
        order: dict,
        invoice_id: int,
        invoice: dict,
        partner_id: int,
        request: PaymentRequest,
    ) -> dict:
        partner = self._read_partner(partner_id)
        order_ref = order.get("name") or f"SO{order_id}"
        currency = self._invoice_currency(invoice)
        line_items = self._stripe_line_items(order_id, currency=currency)
        if not line_items:
            line_items = self._stripe_line_items_from_request(request, currency=currency)

        success_url = current_app.config.get("STRIPE_SUCCESS_URL", "")
        cancel_url = current_app.config.get("STRIPE_CANCEL_URL", "")

        metadata = {
            "odoo_order_id": str(order_id),
            "odoo_invoice_id": str(invoice_id),
            "partner_id": str(partner_id),
        }

        session = stripe_service.create_checkout_session(
            order_id=order_id,
            order_ref=order_ref,
            invoice_id=invoice_id,
            currency=currency,
            line_items=line_items,
            customer_email=partner.get("email"),
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
        )

        self._annotate_invoice_reference(invoice_id, request, extra=f"session:{session.id}")

        return self._build_response(
            order_id=order_id,
            order=order,
            invoice_id=invoice_id,
            invoice=invoice,
            method="stripe",
            payment_status="pending",
            card_last4=None,
            checkout_url=session.url,
            session_id=session.id,
        )

    def _invoice_currency(self, invoice: dict) -> str:
        currency = invoice.get("currency_id") or [None, "DOP"]
        if isinstance(currency, list) and len(currency) > 1:
            return str(currency[1] or "DOP")
        return "DOP"

    def _stripe_line_items(self, order_id: int, *, currency: str) -> list[StripeLineItem]:
        rows = self._client.search_read(
            "sale.order.line",
            [["order_id", "=", order_id]],
            ["name", "product_uom_qty", "price_unit", "price_total"],
            limit=2000,
        )
        items: list[StripeLineItem] = []
        for row in rows or []:
            name = str(row.get("name") or "Producto").strip() or "Producto"
            qty = float(row.get("product_uom_qty") or 0)
            price_unit = float(row.get("price_unit") or 0)
            price_total = float(row.get("price_total") or 0)
            if qty <= 0 or price_unit < 0:
                continue
            total_minor = to_minor_units(price_total if price_total > 0 else price_unit * qty, currency)
            if total_minor <= 0:
                continue
            if qty.is_integer():
                quantity = max(1, int(qty))
                unit_amount = int(Decimal(total_minor) / quantity)
                if unit_amount * quantity != total_minor:
                    quantity = 1
                    unit_amount = total_minor
            else:
                quantity = 1
                unit_amount = total_minor
            if unit_amount <= 0:
                continue
            items.append(StripeLineItem(name=name, unit_amount=unit_amount, quantity=quantity))
        return items

    def _stripe_line_items_from_request(self, request: PaymentRequest, *, currency: str) -> list[StripeLineItem]:
        items: list[StripeLineItem] = []
        for line in request.lines():
            qty = float(line.qty or 0)
            price = float(line.price or 0)
            if qty <= 0 or price < 0:
                continue
            if qty.is_integer():
                quantity = max(1, int(qty))
                unit_amount = to_minor_units(price, currency)
            else:
                quantity = 1
                unit_amount = to_minor_units(price * qty, currency)
            if unit_amount <= 0:
                continue
            items.append(
                StripeLineItem(
                    name=f"Producto #{line.product_id}",
                    unit_amount=unit_amount,
                    quantity=quantity,
                )
            )
        return items

    def _read_partner(self, partner_id: int) -> dict:
        rows = self._client.read("res.partner", [partner_id], ["name", "email", "phone"])
        return rows[0] if rows else {}

    def _resolve_partner_id(self, uid: int, explicit_partner_id: int | None) -> int:
        if explicit_partner_id:
            return explicit_partner_id
        partner_id = UserService.resolve_partner_id(uid)
        if not partner_id:
            raise RuntimeError("No partner linked to this user")
        return int(partner_id)

    def _resolve_order(
        self,
        partner_id: int,
        request: PaymentRequest,
        lines: list[PaymentLine],
    ) -> tuple[int, dict]:
        existing_id = request.order_id() or request.cart_id()
        if existing_id:
            order = self._read_order(existing_id)
            partner = order.get("partner_id") or []
            if not partner or int(partner[0]) != int(partner_id):
                # If a stale/foreign order_id/cart_id is provided but the client supplied fresh lines,
                # create a new draft order for the current partner instead of failing checkout.
                # This avoids leaking/modifying the foreign order while keeping UX smooth.
                if lines:
                    order_id = self._create_order(int(partner_id), lines)
                    return order_id, self._read_order(order_id)
                raise PermissionError("Order does not belong to this partner")
            if lines and order.get("state") in {"draft", "sent"}:
                self._replace_lines(existing_id, lines)
                order = self._read_order(existing_id)
            return existing_id, order

        if not lines:
            raise ValueError("Checkout requires at least one order line")

        order_id = self._create_order(partner_id, lines)
        return order_id, self._read_order(order_id)

    def _create_order(self, partner_id: int, lines: list[PaymentLine]) -> int:
        order_id = self._client.create("sale.order", {"partner_id": partner_id})
        for line in lines:
            self._client.create(
                "sale.order.line",
                {
                    "order_id": order_id,
                    "product_id": line.product_id,
                    "product_uom_qty": line.qty,
                    "price_unit": line.price,
                },
            )
        return int(order_id)

    def _replace_lines(self, order_id: int, lines: list[PaymentLine]) -> None:
        order_rows = self._client.read("sale.order", [order_id], ["order_line"])
        if order_rows:
            line_ids = order_rows[0].get("order_line") or []
            if line_ids:
                self._client.unlink("sale.order.line", line_ids)
        for line in lines:
            self._client.create(
                "sale.order.line",
                {
                    "order_id": order_id,
                    "product_id": line.product_id,
                    "product_uom_qty": line.qty,
                    "price_unit": line.price,
                },
            )

    def _read_order(self, order_id: int) -> dict:
        rows = self._client.search_read(
            "sale.order",
            [["id", "=", order_id]],
            self.ORDER_FIELDS,
            limit=1,
        )
        if not rows:
            raise LookupError(f"Order {order_id} not found")
        return rows[0]

    def _confirm_order(self, order_id: int, order: dict | None = None) -> tuple[dict, bool]:
        order = order or self._read_order(order_id)
        if order.get("state") in {"draft", "sent"}:
            self._client.call("sale.order", "action_confirm", [[order_id]])
            order = self._read_order(order_id)
            return order, True
        return order, False

    def _ensure_invoice(self, order_id: int, order: dict | None = None) -> int:
        order = order or self._read_order(order_id)
        invoice_ids = order.get("invoice_ids") or []
        if invoice_ids:
            return int(invoice_ids[-1])

        self._call_invoice_create(order_id)
        order = self._read_order(order_id)
        invoice_ids = order.get("invoice_ids") or []
        if not invoice_ids:
            raise RuntimeError("Invoice was not created for this order")
        return int(invoice_ids[-1])

    def _call_invoice_create(self, order_id: int) -> None:
        # Odoo 17+/19: the old direct methods (action_invoice_create,
        # action_create_invoice) no longer exist on sale.order.
        # Use the sale.advance.payment.inv wizard instead.
        self._create_invoice_via_wizard(order_id)

    def _decrement_catalog_stock(self, order_id: int) -> None:
        order_ref = ""
        try:
            order_row = self._client.read("sale.order", [order_id], ["name"])
            if order_row:
                order_ref = str(order_row[0].get("name") or "")
        except Exception:
            order_ref = ""

        try:
            lines = self._client.search_read(
                "sale.order.line",
                [["order_id", "=", order_id]],
                ["product_id", "product_uom_qty"],
                limit=5000,
            )
        except Exception:
            return
        if not lines:
            return

        product_ids = []
        qty_by_product = {}
        for line in lines:
            product = line.get("product_id") or []
            if not product:
                continue
            pid = int(product[0]) if isinstance(product, list) else int(product)
            qty = float(line.get("product_uom_qty") or 0)
            if pid <= 0 or qty <= 0:
                continue
            product_ids.append(pid)
            qty_by_product[pid] = qty_by_product.get(pid, 0) + qty

        if not product_ids:
            return

        try:
            products = self._client.read("product.product", list(set(product_ids)), ["id", "product_tmpl_id"])
        except Exception:
            return
        tmpl_by_product = {}
        tmpl_ids = []
        for product in products:
            tmpl = product.get("product_tmpl_id") or []
            if not tmpl:
                continue
            tid = int(tmpl[0]) if isinstance(tmpl, list) else int(tmpl)
            pid = int(product.get("id") or 0)
            if tid and pid:
                tmpl_by_product[pid] = tid
                tmpl_ids.append(tid)

        if not tmpl_ids:
            return

        try:
            templates = self._client.read(
                "product.template",
                list(set(tmpl_ids)),
                ["id", "catalog_stock_qty", "default_code", "name", "catalog_id"],
            )
        except Exception:
            return

        tmpl_stock = {int(t["id"]): float(t.get("catalog_stock_qty") or 0) for t in templates if t.get("id")}
        tmpl_by_id = {int(t["id"]): t for t in templates if t.get("id")}

        # Map catalog -> vendor partner (needed for movements listing per vendor).
        vendor_by_catalog = {}
        catalog_ids = set()
        for t in templates:
            catalog = t.get("catalog_id") or []
            if isinstance(catalog, list) and catalog:
                try:
                    catalog_ids.add(int(catalog[0]))
                except Exception:
                    continue
        if catalog_ids:
            try:
                catalogs = self._client.read("catalog.catalog", list(catalog_ids), ["id", "vendor_id"])
                for c in catalogs or []:
                    cid = int(c.get("id") or 0)
                    vendor = c.get("vendor_id") or []
                    vid = int(vendor[0]) if isinstance(vendor, list) and vendor else None
                    if cid and vid:
                        vendor_by_catalog[cid] = vid
            except Exception:
                vendor_by_catalog = {}

        qty_by_template = {}
        for pid, qty in qty_by_product.items():
            tid = tmpl_by_product.get(pid)
            if not tid:
                continue
            qty_by_template[tid] = qty_by_template.get(tid, 0) + qty

        for tid, used in qty_by_template.items():
            current = tmpl_stock.get(tid)
            if current is None:
                continue
            next_qty = max(0.0, float(current) - float(used))
            try:
                self._client.write("product.template", [int(tid)], {"catalog_stock_qty": next_qty})
            except Exception:
                continue

            # Best-effort movement logging for the vendor inventory history UI.
            try:
                tmpl = tmpl_by_id.get(int(tid)) or {}
                catalog = tmpl.get("catalog_id") or []
                catalog_id = int(catalog[0]) if isinstance(catalog, list) and catalog else 0
                vendor_id = vendor_by_catalog.get(catalog_id)
                if vendor_id and order_ref:
                    already = self._client.search_read(
                        "catalog.inventory.movement",
                        [
                            ["vendor_id", "=", int(vendor_id)],
                            ["product_id", "=", int(tid)],
                            ["type", "=", "out"],
                            ["reference", "=", order_ref],
                        ],
                        ["id"],
                        limit=1,
                    )
                    if already:
                        continue
                if vendor_id:
                    self._client.create(
                        "catalog.inventory.movement",
                        {
                            "vendor_id": int(vendor_id),
                            "product_id": int(tid),
                            "sku": tmpl.get("default_code") or "",
                            "type": "out",
                            "quantity": float(used),
                            "before_stock": float(current),
                            "after_stock": float(next_qty),
                            "note": "Venta",
                            "reference": order_ref or "",
                        },
                    )
            except Exception:
                pass

    def _try_validate_pickings(self, order_id: int, order: dict | None = None) -> None:
        order = order or self._read_order(order_id)
        picking_ids = order.get("picking_ids") or []
        if not picking_ids:
            return
        for pid in picking_ids:
            try:
                self._validate_picking(int(pid))
            except Exception:
                continue

    def _validate_picking(self, picking_id: int) -> None:
        try:
            self._client.call("stock.picking", "action_confirm", [[picking_id]])
        except Exception:
            pass
        try:
            self._client.call("stock.picking", "action_assign", [[picking_id]])
        except Exception:
            pass
        result = self._client.call("stock.picking", "button_validate", [[picking_id]])
        if isinstance(result, dict):
            self._handle_picking_wizard(picking_id, result)

    def _handle_picking_wizard(self, picking_id: int, action: dict) -> None:
        res_model = action.get("res_model")
        if res_model not in {"stock.immediate.transfer", "stock.backorder.confirmation"}:
            return
        ctx = action.get("context") or {
            "active_model": "stock.picking",
            "active_ids": [picking_id],
            "active_id": picking_id,
        }
        res_id = action.get("res_id")
        if not res_id:
            vals = {"pick_ids": [(6, 0, [picking_id])]}
            res_id = self._client.call(res_model, "create", [vals], {"context": ctx})
        self._client.call(res_model, "process", [[res_id]], {"context": ctx})

    def _ensure_accounting_setup(self, order_id: int | None = None) -> None:
        """Ensure the minimum accounting configuration exists in Odoo:
        - A sales journal (type 'sale')
        - An income account and expense account
        - Default accounts set on product categories AND on the products themselves
        """
        # 1. Ensure sales journal
        if not self._client.search_read(
            "account.journal", [["type", "=", "sale"]], ["id"], limit=1
        ):
            self._client.create("account.journal", {
                "name": "Customer Invoices",
                "type": "sale",
                "code": "INV",
            })

        # 2. Find or create an income account
        income_account_id = self._find_or_create_account(
            code="400000",
            name="Product Sales",
            account_type="income",
        )

        # 3. Find or create an expense account
        expense_account_id = self._find_or_create_account(
            code="600000",
            name="Cost of Goods Sold",
            account_type="expense",
        )

        # 4. Assign accounts to all product categories
        try:
            categories = self._client.search_read(
                "product.category",
                [],
                ["id", "property_account_income_categ_id", "property_account_expense_categ_id"],
                limit=50,
            )
            for cat in categories:
                updates = {}
                if not cat.get("property_account_income_categ_id"):
                    updates["property_account_income_categ_id"] = income_account_id
                if not cat.get("property_account_expense_categ_id"):
                    updates["property_account_expense_categ_id"] = expense_account_id
                if updates:
                    try:
                        self._client.write("product.category", [cat["id"]], updates)
                    except Exception:
                        continue
        except Exception:
            pass

        # 5. Set accounts directly on the products in the order
        #    (this is the most reliable approach since category properties
        #    don't always propagate via JSON-RPC)
        if order_id:
            self._ensure_products_have_accounts(order_id, income_account_id, expense_account_id)

    def _ensure_products_have_accounts(
        self, order_id: int, income_account_id: int, expense_account_id: int
    ) -> None:
        """Set income/expense accounts directly on each product template in the order."""
        try:
            lines = self._client.search_read(
                "sale.order.line",
                [["order_id", "=", order_id]],
                ["product_id"],
                limit=500,
            )
        except Exception:
            return

        product_ids = []
        for line in lines:
            pid = line.get("product_id")
            if isinstance(pid, list) and pid:
                product_ids.append(int(pid[0]))
            elif pid:
                product_ids.append(int(pid))
        if not product_ids:
            return

        # Get product templates
        try:
            products = self._client.read(
                "product.product",
                list(set(product_ids)),
                ["id", "product_tmpl_id"],
            )
        except Exception:
            return

        tmpl_ids = set()
        for p in products:
            tmpl = p.get("product_tmpl_id")
            if isinstance(tmpl, list) and tmpl:
                tmpl_ids.add(int(tmpl[0]))
            elif tmpl:
                tmpl_ids.add(int(tmpl))
        if not tmpl_ids:
            return

        # Set accounts on each product template
        for tmpl_id in tmpl_ids:
            try:
                tmpl_data = self._client.read(
                    "product.template",
                    [tmpl_id],
                    ["property_account_income_id", "property_account_expense_id"],
                )
                if not tmpl_data:
                    continue
                tmpl = tmpl_data[0]
                updates = {}
                if not tmpl.get("property_account_income_id"):
                    updates["property_account_income_id"] = income_account_id
                if not tmpl.get("property_account_expense_id"):
                    updates["property_account_expense_id"] = expense_account_id
                if updates:
                    self._client.write("product.template", [tmpl_id], updates)
            except Exception:
                continue

    def _find_or_create_account(self, code: str, name: str, account_type: str) -> int:
        """Find an existing account by type, or create one with the given code/name."""
        # Try to find any existing account of this type
        for atype in [account_type, f"{account_type}_other", f"{account_type}_direct_cost"]:
            existing = self._client.search_read(
                "account.account",
                [["account_type", "=", atype]],
                ["id"],
                limit=1,
            )
            if existing:
                return int(existing[0]["id"])

        # Create the account
        return int(self._client.create("account.account", {
            "code": code,
            "name": name,
            "account_type": account_type,
        }))

    def _create_invoice_via_wizard(self, order_id: int) -> None:
        # Ensure the required accounting setup exists before invoicing.
        self._ensure_accounting_setup(order_id=order_id)

        ctx = {"active_model": "sale.order", "active_ids": [order_id], "active_id": order_id}
        # Odoo 17+/19 uses "delivered" instead of "all" for advance_payment_method.
        # Try "delivered" first, then fall back to "all" for older versions.
        for method_value in ("delivered", "all"):
            try:
                wizard_id = self._client.call(
                    "sale.advance.payment.inv", "create", [{"advance_payment_method": method_value}], {"context": ctx}
                )
                self._client.call(
                    "sale.advance.payment.inv", "create_invoices", [[wizard_id]], {"context": ctx}
                )
                return
            except Exception as exc:
                msg = str(exc).lower()
                if "valid" in msg or "selection" in msg or "value" in msg:
                    continue
                raise
        raise RuntimeError(f"Could not create invoice for order {order_id} via wizard")

    def _read_invoice(self, invoice_id: int) -> dict:
        rows = self._client.read("account.move", [invoice_id], self.INVOICE_FIELDS)
        if not rows:
            raise LookupError(f"Invoice {invoice_id} not found")
        return rows[0]

    def _register_payment(self, invoice_id: int, method: str) -> None:
        invoice = self._read_invoice(invoice_id)
        if (invoice.get("payment_state") or "").lower() in {"paid", "in_payment"}:
            return

        if invoice.get("state") == "draft":
            self._client.call("account.move", "action_post", [[invoice_id]])

        journal_id = self._journal_selector.pick(method)
        amount = invoice.get("amount_residual") or invoice.get("amount_total") or 0
        ctx = {"active_model": "account.move", "active_ids": [invoice_id], "active_id": invoice_id}
        wizard_vals = {
            "journal_id": journal_id,
            "amount": amount,
            "payment_date": date.today().isoformat(),
        }
        wizard_id = self._client.call(
            "account.payment.register", "create", [wizard_vals], {"context": ctx}
        )
        self._client.call(
            "account.payment.register",
            "action_create_payments",
            [[wizard_id]],
            {"context": ctx},
        )

    def _annotate_invoice_reference(
        self,
        invoice_id: int,
        request: PaymentRequest,
        extra: str | None = None,
    ) -> None:
        method = request.method()
        last4 = request.card_last4()
        ref = f"catalogix:{method}"
        if extra:
            ref = f"{ref}:{extra}"
        if last4:
            ref = f"{ref}:{last4}"
        try:
            self._client.write("account.move", [invoice_id], {"ref": ref})
        except Exception:
            pass

    def handle_stripe_event(self, event: dict) -> dict:
        event_type = str(event.get("type") or "")
        obj = (event.get("data") or {}).get("object") or {}

        if event_type in {"checkout.session.completed", "checkout.session.async_payment_succeeded"}:
            return self._handle_stripe_session(event_type, obj)
        if event_type == "payment_intent.succeeded":
            return self._handle_stripe_payment_intent(obj)
        return {"handled": False, "reason": "event_ignored", "type": event_type}

    def _handle_stripe_session(self, event_type: str, session: dict) -> dict:
        payment_status = str(session.get("payment_status") or "").lower()
        if event_type == "checkout.session.completed" and payment_status not in {"paid", "no_payment_required"}:
            return {"handled": False, "reason": "payment_not_completed"}

        metadata = session.get("metadata") or {}
        invoice_id = self._metadata_invoice_id(metadata)
        order_id = self._metadata_order_id(metadata)
        if not invoice_id and order_id:
            try:
                order, _was_confirmed = self._confirm_order(int(order_id))
                invoice_id = self._ensure_invoice(int(order_id), order)
            except Exception as exc:
                return {
                    "handled": False,
                    "reason": "invoice_create_failed",
                    "order_id": int(order_id),
                    "error": str(exc),
                }
        if not invoice_id:
            return {"handled": False, "reason": "missing_invoice_id"}
        if order_id:
            self._try_assign_invoice_to_vendor(order_id=int(order_id), invoice_id=int(invoice_id))

        payment_intent_id = session.get("payment_intent")
        last4 = None
        if payment_intent_id:
            try:
                payment_intent = stripe_service.retrieve_payment_intent(payment_intent_id)
                last4 = self._payment_intent_last4(payment_intent)
            except Exception:
                last4 = None

        self._register_payment(invoice_id, "stripe")
        self._annotate_stripe_reference(invoice_id, payment_intent_id=payment_intent_id, last4=last4)
        self._try_notify_whatsapp_payment(invoice_id)
        return {"handled": True, "invoice_id": invoice_id}

    def _handle_stripe_payment_intent(self, payment_intent: dict) -> dict:
        metadata = payment_intent.get("metadata") or {}
        invoice_id = self._metadata_invoice_id(metadata)
        order_id = self._metadata_order_id(metadata)
        if not invoice_id and order_id:
            try:
                order, _was_confirmed = self._confirm_order(int(order_id))
                invoice_id = self._ensure_invoice(int(order_id), order)
            except Exception as exc:
                return {
                    "handled": False,
                    "reason": "invoice_create_failed",
                    "order_id": int(order_id),
                    "error": str(exc),
                }
        if not invoice_id:
            return {"handled": False, "reason": "missing_invoice_id"}
        if order_id:
            self._try_assign_invoice_to_vendor(order_id=int(order_id), invoice_id=int(invoice_id))

        payment_intent_id = payment_intent.get("id")
        last4 = self._payment_intent_last4(payment_intent)

        self._register_payment(invoice_id, "stripe")
        self._annotate_stripe_reference(invoice_id, payment_intent_id=payment_intent_id, last4=last4)
        self._try_notify_whatsapp_payment(invoice_id)
        return {"handled": True, "invoice_id": invoice_id}

    def _try_notify_whatsapp_payment(self, invoice_id: int) -> None:
        try:
            if not current_app.config.get("WHATSAPP_NOTIFY_PAYMENTS"):
                return
            from ..whatsapp.notifiers import whatsapp_payment_notifier

            whatsapp_payment_notifier.notify_invoice_paid(int(invoice_id))
        except Exception as exc:
            try:
                current_app.logger.warning("whatsapp:payment notify failed invoice_id=%s err=%s", invoice_id, exc)
            except Exception:
                pass

    @staticmethod
    def _metadata_invoice_id(metadata: dict) -> int | None:
        raw = metadata.get("odoo_invoice_id") or metadata.get("invoice_id")
        if not raw:
            return None
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _metadata_order_id(metadata: dict) -> int | None:
        raw = metadata.get("odoo_order_id") or metadata.get("order_id") or metadata.get("orderId")
        if not raw:
            return None
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None

    def _try_assign_invoice_to_vendor(self, *, order_id: int, invoice_id: int) -> None:
        vendor_user_id = self._infer_vendor_user_id(order_id)
        if not vendor_user_id:
            return
        try:
            rows = self._client.read("account.move", [int(invoice_id)], ["invoice_user_id"])
            existing = (rows[0].get("invoice_user_id") or []) if rows else []
            existing_id = int(existing[0]) if isinstance(existing, list) and existing else int(existing or 0)
            if existing_id == int(vendor_user_id):
                return
        except Exception:
            pass
        try:
            self._client.write("account.move", [int(invoice_id)], {"invoice_user_id": int(vendor_user_id)})
        except Exception:
            return

    def _infer_vendor_user_id(self, order_id: int) -> int | None:
        vendor_partner_ids = self._infer_vendor_partner_ids(order_id)
        if len(vendor_partner_ids) != 1:
            return None
        vendor_partner_id = int(next(iter(vendor_partner_ids)))
        try:
            rows = self._client.search_read(
                "catalog.vendor",
                [["partner_id", "=", vendor_partner_id]],
                ["user_id", "partner_id"],
                limit=1,
            )
        except Exception:
            return None
        if not rows:
            return None
        user = (rows[0].get("user_id") or [])
        if isinstance(user, list) and user:
            return int(user[0])
        if isinstance(user, int):
            return int(user)
        return None

    def _infer_vendor_partner_ids(self, order_id: int) -> set[int]:
        try:
            lines = self._client.search_read(
                "sale.order.line",
                [["order_id", "=", int(order_id)]],
                ["product_id"],
                limit=5000,
            )
        except Exception:
            return set()

        product_ids: list[int] = []
        for line in lines or []:
            prod = line.get("product_id") or []
            if isinstance(prod, list) and prod:
                product_ids.append(int(prod[0]))
            elif isinstance(prod, int) and prod:
                product_ids.append(int(prod))
        if not product_ids:
            return set()

        try:
            products = self._client.read("product.product", sorted(set(product_ids)), ["id", "product_tmpl_id"])
        except Exception:
            products = []

        template_ids: list[int] = []
        for product in products or []:
            tmpl = product.get("product_tmpl_id") or []
            if isinstance(tmpl, list) and tmpl:
                template_ids.append(int(tmpl[0]))
            elif isinstance(tmpl, int) and tmpl:
                template_ids.append(int(tmpl))
        if not template_ids:
            return set()

        try:
            templates = self._client.read("product.template", sorted(set(template_ids)), ["id", "catalog_id"])
        except Exception:
            templates = []

        catalog_ids: list[int] = []
        for tmpl in templates or []:
            catalog = tmpl.get("catalog_id") or []
            if isinstance(catalog, list) and catalog:
                catalog_ids.append(int(catalog[0]))
            elif isinstance(catalog, int) and catalog:
                catalog_ids.append(int(catalog))
        if not catalog_ids:
            return set()

        try:
            catalogs = self._client.read("catalog.catalog", sorted(set(catalog_ids)), ["id", "vendor_id"])
        except Exception:
            catalogs = []

        vendor_partner_ids: set[int] = set()
        for cat in catalogs or []:
            vendor = cat.get("vendor_id") or []
            if isinstance(vendor, list) and vendor:
                vendor_partner_ids.add(int(vendor[0]))
            elif isinstance(vendor, int) and vendor:
                vendor_partner_ids.add(int(vendor))
        return vendor_partner_ids

    @staticmethod
    def _payment_intent_last4(payment_intent: dict) -> str | None:
        charges = (payment_intent.get("charges") or {}).get("data") or []
        if not charges:
            return None
        details = charges[0].get("payment_method_details") or {}
        card = details.get("card") or {}
        last4 = str(card.get("last4") or "").strip()
        return last4 or None

    def _annotate_stripe_reference(
        self,
        invoice_id: int,
        payment_intent_id: str | None = None,
        last4: str | None = None,
    ) -> None:
        ref = "catalogix:stripe"
        if payment_intent_id:
            ref = f"{ref}:{payment_intent_id}"
        if last4:
            ref = f"{ref}:{last4}"
        try:
            self._client.write("account.move", [invoice_id], {"ref": ref})
        except Exception:
            pass

    def _payment_status(self, invoice: dict, method: str) -> str:
        if method == "cash":
            return "cod"
        payment_state = (invoice.get("payment_state") or "").lower()
        if payment_state in {"paid", "in_payment"}:
            return "success"
        return "pending"


payment_service = PaymentService(odoo)
