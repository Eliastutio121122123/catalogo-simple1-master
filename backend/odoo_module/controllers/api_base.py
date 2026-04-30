import datetime
import json

from odoo import http
from odoo.http import request
from odoo.exceptions import AccessDenied

try:
    import jwt
except Exception:
    jwt = None


XMLID_BASE_INTERNAL = "base.group_user"
XMLID_BASE_PORTAL = "base.group_portal"
XMLID_VENDOR_CANDIDATES = [
    "sales_team.group_sale_salesman",
    "sales_team.group_sale_salesman_all_leads",
    "sale_management.group_sale_salesman",
    "sale.group_sale_salesman",
]


def _param(key: str, default: str) -> str:
    return request.env["ir.config_parameter"].sudo().get_param(key, default)


def _param_int(key: str, default: int) -> int:
    try:
        return int(_param(key, str(default)))
    except Exception:
        return default


def _jwt_secret() -> str:
    return _param("catalogix.jwt_secret", "jwt-secret-key")


def _jwt_expiry_hours() -> int:
    return _param_int("catalogix.jwt_expiry_hours", 24)


def _jwt_refresh_days() -> int:
    return _param_int("catalogix.jwt_refresh_days", 30)


def _reset_token_minutes() -> int:
    return _param_int("catalogix.reset_token_minutes", 30)


def _frontend_url() -> str:
    return _param("catalogix.frontend_url", "http://localhost:5173")


def _send_reset_email_enabled() -> bool:
    return _param("catalogix.send_reset_email", "false").lower() == "true"


def _reset_email_from() -> str:
    return _param("catalogix.reset_email_from", "no-reply@catalogix.local")


def _debug_enabled() -> bool:
    return _param("catalogix.debug", "false").lower() == "true"


def _json_response(payload: dict, status: int = 200):
    return http.Response(
        json.dumps(payload),
        status=status,
        content_type="application/json",
    )


def ok(data, status: int = 200):
    return _json_response({"ok": True, "data": data}, status)


def error(message: str, status: int = 400):
    return _json_response({"ok": False, "error": message}, status)


def get_json() -> dict:
    try:
        data = request.httprequest.get_json(force=True, silent=True)
    except Exception:
        data = None
    return data or {}


def require_fields(data: dict, fields: list[str]) -> str | None:
    for f in fields:
        if f not in data or data[f] in (None, ""):
            return f"Missing field: {f}"
    return None


def _group_id(xmlid: str):
    try:
        rec = request.env.ref(xmlid, raise_if_not_found=False)
    except Exception:
        rec = None
    return rec.id if rec else None


def _role_from_groups(group_ids: list[int] | None) -> str:
    ids = set(int(gid) for gid in (group_ids or []))
    for xmlid in XMLID_VENDOR_CANDIDATES:
        gid = _group_id(xmlid)
        if gid and gid in ids:
            return "vendor"
    return "customer"


def resolve_role_groups(role: str) -> list[int]:
    normalized = (role or "customer").strip().lower()
    if normalized == "vendor":
        group_ids = []
        internal_gid = _group_id(XMLID_BASE_INTERNAL)
        if internal_gid:
            group_ids.append(internal_gid)
        for xmlid in XMLID_VENDOR_CANDIDATES:
            gid = _group_id(xmlid)
            if gid:
                group_ids.append(gid)
                break
        return sorted(set(group_ids))

    portal_gid = _group_id(XMLID_BASE_PORTAL)
    return [portal_gid] if portal_gid else []


def serialize_user(user) -> dict:
    partner = user.partner_id
    return {
        "id": user.id,
        "name": user.name or "",
        "email": user.email or user.login or "",
        "phone": user.phone or "",
        "partner_id": [partner.id, partner.name] if partner else False,
        "group_ids": user.groups_id.ids,
        "login": user.login or "",
        "role": _role_from_groups(user.groups_id.ids),
    }


def issue_jwt(uid: int) -> str:
    if not jwt:
        raise RuntimeError("PyJWT is required")
    return jwt.encode(
        {
            "uid": uid,
            "exp": datetime.datetime.utcnow()
            + datetime.timedelta(hours=_jwt_expiry_hours()),
        },
        _jwt_secret(),
        algorithm="HS256",
    )


def issue_refresh_token(uid: int) -> str:
    if not jwt:
        raise RuntimeError("PyJWT is required")
    return jwt.encode(
        {
            "uid": uid,
            "purpose": "refresh",
            "exp": datetime.datetime.utcnow()
            + datetime.timedelta(days=_jwt_refresh_days()),
        },
        _jwt_secret(),
        algorithm="HS256",
    )


def issue_purpose_token(uid: int, purpose: str, minutes: int) -> str:
    if not jwt:
        raise RuntimeError("PyJWT is required")
    return jwt.encode(
        {
            "uid": uid,
            "purpose": purpose,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=minutes),
        },
        _jwt_secret(),
        algorithm="HS256",
    )


def decode_token(token: str) -> dict:
    if not jwt:
        raise RuntimeError("PyJWT is required")
    return jwt.decode(token, _jwt_secret(), algorithms=["HS256"])


def get_bearer_token() -> str | None:
    auth_header = request.httprequest.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header.split(" ", 1)[1].strip()


def require_jwt():
    token = get_bearer_token()
    if not token:
        return None, error("Missing or invalid token", 401)
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        return None, error("Token expired", 401)
    except Exception:
        return None, error("Invalid token", 401)
    uid = payload.get("uid")
    if not uid:
        return None, error("Invalid token", 401)
    return int(uid), None


def authenticate_user(email: str, password: str):
    user = (
        request.env["res.users"]
        .sudo()
        .search(["|", ("login", "=", email), ("email", "=", email)], limit=1)
    )
    if not user:
        raise AccessDenied()
    user._check_credentials(password)
    return user

