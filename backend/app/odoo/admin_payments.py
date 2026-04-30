from __future__ import annotations

from .client import odoo


class AdminPaymentService:
    FIELDS = [
        "id",
        "name",
        "state",
        "payment_state",
        "invoice_origin",
        "invoice_date",
        "invoice_date_due",
        "amount_total",
        "amount_residual",
        "partner_id",
        "payment_reference",
        "ref",
        "create_date",
        "currency_id",
    ]

    def __init__(self, client):
        self._client = client

    def list_payments(
        self,
        q: str | None = None,
        status: str | None = None,
        method: str | None = None,
        limit: int = 200,
        offset: int = 0,
    ) -> dict:
        domain = self._build_domain(q)
        rows = self._client.search_read(
            "account.move",
            domain,
            self.FIELDS,
            limit=limit,
            offset=offset,
            order="id desc",
        )
        if not rows:
            return {"items": [], "stats": {"total": 0}, "filters": {"statuses": [], "methods": [], "providers": []}}

        partner_map = self._partner_map(rows)
        items = [self._to_api(row, partner_map) for row in rows]

        if status and status != "all":
            items = [row for row in items if row.get("status") == status]
        if method and method != "all":
            items = [row for row in items if (row.get("method") or "").lower() == method.lower()]

        stats = self._stats(items)
        filters = self._filters(items)
        return {"items": items, "stats": stats, "filters": filters}

    def _build_domain(self, q: str | None) -> list:
        domain: list = [["move_type", "=", "out_invoice"]]
        if q:
            term = q.strip()
            if term:
                domain = [
                    "&",
                    ["move_type", "=", "out_invoice"],
                    "|",
                    "|",
                    ["name", "ilike", term],
                    ["invoice_origin", "ilike", term],
                    ["partner_id.name", "ilike", term],
                ]
        return domain

    def _partner_map(self, rows: list[dict]) -> dict[int, dict]:
        partner_ids = []
        for row in rows:
            partner = row.get("partner_id") or []
            if isinstance(partner, list) and partner:
                partner_ids.append(int(partner[0]))
        if not partner_ids:
            return {}
        partners = self._client.read(
            "res.partner",
            list(set(partner_ids)),
            ["id", "name", "email", "phone"],
        )
        return {
            int(p["id"]): {
                "name": p.get("name") or "",
                "email": p.get("email") or "",
                "phone": p.get("phone") or "",
            }
            for p in partners
            if p.get("id")
        }

    def _status(self, rec: dict) -> str:
        state = rec.get("state")
        payment_state = (rec.get("payment_state") or "").lower()
        if state == "cancel" or payment_state == "reversed":
            return "chargeback"
        if payment_state in {"paid", "in_payment"}:
            return "approved"
        if payment_state in {"partial"}:
            return "review"
        return "pending"

    def _parse_method(self, rec: dict) -> tuple[str, str, str]:
        raw = str(rec.get("payment_reference") or rec.get("ref") or "").strip().lower()
        method = ""
        last4 = ""

        if "catalogix:" in raw:
            parts = raw.split(":")
            if len(parts) > 1:
                method = parts[1]
            if len(parts) > 2:
                last4 = "".join(ch for ch in parts[2] if ch.isdigit())[-4:]

        if not method:
            for key in ("card", "stripe", "paypal", "cash", "bank", "transfer"):
                if key in raw:
                    method = key
                    break

        label = self._method_label(method)
        provider = self._provider_label(method, label)
        return label, provider, last4

    def _method_label(self, method: str) -> str:
        method = (method or "").lower()
        if method in {"card", "stripe"}:
            return "Card"
        if method in {"bank", "transfer"}:
            return "Transfer"
        if method == "cash":
            return "Cash"
        if method == "paypal":
            return "Paypal"
        return "Manual"

    def _provider_label(self, method: str, label: str) -> str:
        method = (method or "").lower()
        if method in {"stripe", "card"}:
            return "Stripe"
        if method in {"bank", "transfer"}:
            return "Bank"
        if method == "cash":
            return "Cash"
        if method == "paypal":
            return "Paypal"
        if label == "Manual":
            return "Manual"
        return label

    def _to_api(self, rec: dict, partner_map: dict[int, dict]) -> dict:
        inv_id = int(rec.get("id") or 0)
        number = rec.get("name")
        number = None if number in (None, "/", False) else str(number)
        partner = rec.get("partner_id") or []
        partner_id = int(partner[0]) if isinstance(partner, list) and partner else 0
        customer_name = partner[1] if isinstance(partner, list) and len(partner) > 1 else "-"
        customer = partner_map.get(partner_id, {"name": customer_name})
        method_label, provider, last4 = self._parse_method(rec)
        status = self._status(rec)

        return {
            "id": number or f"INV-{inv_id:06d}",
            "rawId": inv_id,
            "order": rec.get("invoice_origin") or None,
            "customer": customer.get("name") or customer_name,
            "method": method_label,
            "provider": provider,
            "amount": float(rec.get("amount_total") or 0),
            "status": status,
            "createdAt": rec.get("invoice_date") or rec.get("create_date"),
            "paymentState": rec.get("payment_state") or "",
            "currency": (rec.get("currency_id") or [None, "DOP"])[1]
            if isinstance(rec.get("currency_id"), list)
            else "DOP",
            "cardLast4": last4 or None,
        }

    def _stats(self, items: list[dict]) -> dict:
        total = len(items)
        approved = len([p for p in items if p.get("status") == "approved"])
        pending = len([p for p in items if p.get("status") == "pending"])
        review = len([p for p in items if p.get("status") == "review"])
        chargeback = len([p for p in items if p.get("status") == "chargeback"])
        return {
            "total": total,
            "approved": approved,
            "pending": pending,
            "review": review,
            "chargeback": chargeback,
        }

    def _filters(self, items: list[dict]) -> dict:
        statuses = sorted({p.get("status") for p in items if p.get("status")})
        methods = sorted({p.get("method") for p in items if p.get("method")})
        providers = sorted({p.get("provider") for p in items if p.get("provider")})
        return {"statuses": statuses, "methods": methods, "providers": providers}


admin_payment_service = AdminPaymentService(odoo)
