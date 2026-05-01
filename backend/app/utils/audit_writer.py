"""
audit_writer.py
===============
Centralised helper for writing audit events to Odoo's catalog.audit.log model.

Usage (from any router):
    from ..utils.audit_writer import log_event

    log_event(
        action="LOGIN_SUCCESS",
        target=f"user:{email}",
        actor_name=name,
        actor_role="customer",
        severity="low",
        status="ok",
    )

The helper is intentionally non-raising: if Odoo is unreachable or the model
is missing, the call silently swallows the error so the main request never fails.
"""

from __future__ import annotations

import logging
from datetime import datetime
from flask import request as flask_request

logger = logging.getLogger(__name__)


def _get_ip() -> str:
    """Return the real client IP, honoring X-Forwarded-For if present."""
    xff = flask_request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    return flask_request.remote_addr or "-"


def log_event(
    action: str,
    *,
    target: str = "-",
    actor_name: str = "System",
    actor_role: str = "system",
    severity: str = "low",    # low | medium | high | critical
    status: str = "ok",       # ok | warn | blocked
    ip: str | None = None,
    meta: dict | None = None,
) -> None:
    """
    Write a single audit event to catalog.audit.log.
    Silently skips if Odoo is unavailable or the model doesn't exist.
    """
    try:
        from ..odoo.client import odoo  # local import to avoid circular deps

        occurred_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        ip_address = ip or _get_ip()

        values: dict = {
            "action": action,
            "target": target,
            "actor_name": actor_name,
            "actor_role": actor_role,
            "severity": severity,
            "status": status,
            "ip_address": ip_address,
            "occurred_at": occurred_at,
        }
        if meta:
            import json
            values["meta_json"] = json.dumps(meta, ensure_ascii=False, default=str)

        odoo.create("catalog.audit.log", values)
    except Exception as exc:
        # Never crash the main request due to audit failure.
        logger.debug("audit_writer skipped: %s", exc)
