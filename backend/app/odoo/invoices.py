from datetime import date

from .client import odoo

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


def _is_payment_method_line_missing(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "account.payment.method.line" in msg and ("does not exist" in msg or "invalid" in msg or "model" in msg)


def _find_or_create_account(code: str, name: str, account_type: str) -> int:
    """Best-effort helper to ensure an account exists for payment/outstanding lines."""
    try:
        for atype in [account_type, f"{account_type}_other", f"{account_type}_direct_cost"]:
            existing = odoo.search_read(
                "account.account",
                [["account_type", "=", atype]],
                ["id"],
                limit=1,
            )
            if existing:
                return int(existing[0]["id"])
    except Exception:
        pass
    return int(odoo.create("account.account", {
        "code": code,
        "name": name,
        "account_type": account_type,
    }))


def _ensure_journal_outstanding_accounts(journal_id: int) -> None:
    """
    Odoo's payment register wizard requires an 'outstanding account' on the journal payment method line.
    If it's missing, Odoo raises: 'No outstanding account could be found to make the payment'.

    This function tries to set (or create) the needed account on existing inbound/outbound method lines,
    and creates a minimal inbound line if none exists.
    """
    try:
        fields = odoo.call("account.payment.method.line", "fields_get", [], {}) or {}
    except Exception as exc:
        if _is_payment_method_line_missing(exc):
            return
        raise

    account_field = "payment_account_id" if "payment_account_id" in fields else None
    journal_field = "journal_id" if "journal_id" in fields else None
    method_field = "payment_method_id" if "payment_method_id" in fields else None
    payment_type_field = "payment_type" if "payment_type" in fields else None

    if not account_field or not journal_field:
        return

    receipt_acc_id = _find_or_create_account("101999", "Outstanding Receipts", "asset_current")
    payment_acc_id = _find_or_create_account("101998", "Outstanding Payments", "asset_current")

    def _find_method_id(payment_type: str) -> int | None:
        if not method_field:
            return None
        try:
            m_fields = odoo.call("account.payment.method", "fields_get", [], {}) or {}
        except Exception:
            m_fields = {}
        domain = []
        if "payment_type" in m_fields:
            domain.append(["payment_type", "=", payment_type])
        rows = odoo.search_read("account.payment.method", domain, ["id"], limit=1)
        return int(rows[0]["id"]) if rows else None

    inbound_method_id = _find_method_id("inbound")
    outbound_method_id = _find_method_id("outbound")

    existing = odoo.search_read(
        "account.payment.method.line",
        [[journal_field, "=", int(journal_id)]],
        ["id", account_field, payment_type_field] if payment_type_field else ["id", account_field],
        limit=200,
    )

    inbound_ids = []
    outbound_ids = []
    for row in existing or []:
        pid = int(row.get("id") or 0)
        if not pid:
            continue
        ptype = (row.get(payment_type_field) or "") if payment_type_field else ""
        if ptype == "outbound":
            outbound_ids.append(pid)
        else:
            inbound_ids.append(pid)

    # Update existing lines missing account.
    try:
        if inbound_ids:
            to_fix = [i for i in inbound_ids if not any(r.get("id") == i and r.get(account_field) for r in existing)]
            if to_fix:
                odoo.write("account.payment.method.line", to_fix, {account_field: int(receipt_acc_id)})
        if outbound_ids:
            to_fix = [i for i in outbound_ids if not any(r.get("id") == i and r.get(account_field) for r in existing)]
            if to_fix:
                odoo.write("account.payment.method.line", to_fix, {account_field: int(payment_acc_id)})
    except Exception:
        pass

    # If no inbound line exists at all, create one (best-effort).
    if not inbound_ids:
        vals = {journal_field: int(journal_id), account_field: int(receipt_acc_id)}
        if payment_type_field:
            vals[payment_type_field] = "inbound"
        if method_field and inbound_method_id:
            vals[method_field] = int(inbound_method_id)
        try:
            odoo.create("account.payment.method.line", vals)
        except Exception:
            # Last attempt: some versions don't allow create without a method.
            if method_field and inbound_method_id:
                vals.pop(method_field, None)
            try:
                odoo.create("account.payment.method.line", vals)
            except Exception:
                return

    # Same for outbound if none exists (not strictly required for inbound register).
    if payment_type_field and not outbound_ids:
        vals = {journal_field: int(journal_id), account_field: int(payment_acc_id), payment_type_field: "outbound"}
        if method_field and outbound_method_id:
            vals[method_field] = int(outbound_method_id)
        try:
            odoo.create("account.payment.method.line", vals)
        except Exception:
            pass


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
    rows = odoo.read("res.partner", ids, ["id", "name", "email", "phone", "street", "city"])
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
    rows = odoo.search_read(
        "account.move",
        [["id", "=", invoice_id], ["move_type", "=", "out_invoice"], ["invoice_user_id", "=", uid]],
        INVOICE_FIELDS,
        limit=1,
    )
    if not rows:
        raise LookupError(f"Invoice {invoice_id} not found")
    return rows[0]


def list_vendor_invoices(uid: int) -> list[dict]:
    rows = odoo.call(
        "account.move",
        "search_read",
        [[["move_type", "=", "out_invoice"], ["invoice_user_id", "=", uid]]],
        {"fields": INVOICE_FIELDS, "order": "id desc", "limit": 500},
    )

    partner_ids = []
    for row in rows:
        partner = row.get("partner_id")
        if isinstance(partner, list):
            partner_ids.append(partner[0])
    partners = _partner_map(partner_ids)

    return [
        _move_to_api(
            row,
            partner_data=partners.get((row.get("partner_id") or [None])[0]) if isinstance(row.get("partner_id"), list) else None,
        )
        for row in rows
    ]


def get_vendor_invoice(uid: int, invoice_id: int) -> dict:
    row = _owned_invoice(uid, invoice_id)
    partner = row.get("partner_id")
    partner_id = partner[0] if isinstance(partner, list) else None
    partner_data = _partner_map([partner_id]).get(partner_id) if partner_id else None

    line_ids = row.get("invoice_line_ids") or []
    raw_lines = odoo.read("account.move.line", line_ids, LINE_FIELDS) if line_ids else []
    lines = []
    for line in raw_lines:
        if (line.get("display_type") or "") in {"line_section", "line_note"}:
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


def update_vendor_invoice_status(uid: int, invoice_id: int, status: str) -> dict:
    invoice = _owned_invoice(uid, invoice_id)
    status = (status or "").strip().lower()

    if status not in {"draft", "sent", "paid", "cancelled"}:
        raise ValueError("Invalid invoice status")

    if status == "draft":
        odoo.call("account.move", "button_draft", [[invoice_id]])
    elif status == "sent":
        if invoice.get("state") == "draft":
            odoo.call("account.move", "action_post", [[invoice_id]])
    elif status == "cancelled":
        if invoice.get("state") == "draft":
            odoo.call("account.move", "action_post", [[invoice_id]])
        odoo.call("account.move", "button_cancel", [[invoice_id]])
    elif status == "paid":
        return mark_vendor_invoice_paid(uid, invoice_id)

    return get_vendor_invoice(uid, invoice_id)


def mark_vendor_invoice_paid(uid: int, invoice_id: int, method: str = "manual") -> dict:
    invoice = _owned_invoice(uid, invoice_id)
    payment_state = (invoice.get("payment_state") or "").lower()
    if payment_state in {"paid", "in_payment"}:
        return get_vendor_invoice(uid, invoice_id)

    if invoice.get("state") == "draft":
        odoo.call("account.move", "action_post", [[invoice_id]])

    journals = odoo.search_read(
        "account.journal",
        [["type", "in", ["bank", "cash"]]],
        ["id"],
        limit=1,
    )
    if not journals:
        raise RuntimeError("No bank/cash journal available to register payment")

    amount = invoice.get("amount_residual") or invoice.get("amount_total") or 0
    ctx = {"active_model": "account.move", "active_ids": [invoice_id], "active_id": invoice_id}
    wizard_vals = {"journal_id": journals[0]["id"], "amount": amount, "payment_date": date.today().isoformat()}
    journal_id = int(journals[0]["id"])
    try:
        wizard_id = odoo.call("account.payment.register", "create", [wizard_vals], {"context": ctx})
        odoo.call("account.payment.register", "action_create_payments", [[wizard_id]], {"context": ctx})
    except Exception as exc:
        # Common Odoo error when journals are missing outstanding accounts.
        msg = str(exc)
        if "outstanding account" in msg.lower():
            _ensure_journal_outstanding_accounts(journal_id)
            wizard_id = odoo.call("account.payment.register", "create", [wizard_vals], {"context": ctx})
            odoo.call("account.payment.register", "action_create_payments", [[wizard_id]], {"context": ctx})
        else:
            raise

    updated = get_vendor_invoice(uid, invoice_id)
    updated["paymentMethod"] = method or updated.get("paymentMethod")
    return updated
