from odoo import http
from odoo.http import request
from odoo.exceptions import AccessDenied

from .api_base import (
    authenticate_user,
    decode_token,
    error,
    get_json,
    issue_jwt,
    issue_purpose_token,
    issue_refresh_token,
    ok,
    require_fields,
    resolve_role_groups,
    serialize_user,
    _frontend_url,
    _reset_token_minutes,
    _send_reset_email_enabled,
    _reset_email_from,
    _debug_enabled,
)


class CatalogixAuthController(http.Controller):
    @http.route("/api/auth/login", type="http", auth="none", csrf=False, cors="*")
    def login(self, **kwargs):
        data = get_json()
        err = require_fields(data, ["email", "password"])
        if err:
            return error(err, 400)

        email = str(data.get("email") or "").strip().lower()
        password = str(data.get("password") or "")
        try:
            user = authenticate_user(email, password)
            token = issue_jwt(user.id)
            refresh_token = issue_refresh_token(user.id)
            return ok({"token": token, "refresh_token": refresh_token, "user": serialize_user(user)})
        except AccessDenied:
            return error("Invalid email or password", 401)
        except Exception as exc:
            return error(str(exc), 500)

    @http.route("/api/auth/register", type="http", auth="none", csrf=False, cors="*")
    def register(self, **kwargs):
        data = get_json()
        err = require_fields(data, ["name", "email", "password"])
        if err:
            return error(err, 400)

        name = str(data.get("name") or "").strip()
        email = str(data.get("email") or "").strip().lower()
        password = str(data.get("password") or "")
        role = str(data.get("role") or "customer").strip().lower()
        phone = str(data.get("phone") or "").strip() or None
        company = str(data.get("company") or "").strip() or None

        if len(name) < 2:
            return error("Name must have at least 2 characters", 400)
        if len(password) < 8:
            return error("Password must have at least 8 characters", 400)

        users = request.env["res.users"].sudo()
        existing = users.search(["|", ("login", "=", email), ("email", "=", email)], limit=1)
        if existing:
            return error("Email is already registered", 409)

        group_ids = resolve_role_groups(role)
        vals = {
            "name": name,
            "login": email,
            "email": email,
            "password": password,
        }
        if phone:
            vals["phone"] = phone
        if group_ids:
            vals["groups_id"] = [(6, 0, group_ids)]

        try:
            user = users.create(vals)
            if company:
                user.partner_id.write({"company_name": company})
            return ok({"uid": user.id, "user": serialize_user(user)}, 201)
        except Exception as exc:
            return error(str(exc), 500)

    @http.route("/api/auth/logout", type="http", auth="none", csrf=False, cors="*")
    def logout(self, **kwargs):
        return ok({"message": "Logged out"})

    @http.route("/api/auth/refresh", type="http", auth="none", csrf=False, cors="*")
    def refresh(self, **kwargs):
        data = get_json()
        err = require_fields(data, ["refresh_token"])
        if err:
            return error(err, 400)

        try:
            payload = decode_token(str(data.get("refresh_token")))
        except Exception as exc:
            return error("Invalid refresh token", 401)

        if payload.get("purpose") != "refresh":
            return error("Invalid refresh token purpose", 401)
        uid = payload.get("uid")
        if not uid:
            return error("Invalid refresh token payload", 401)

        token = issue_jwt(int(uid))
        refresh_token = issue_refresh_token(int(uid))
        return ok({"token": token, "refresh_token": refresh_token})

    @http.route("/api/auth/forgot-password", type="http", auth="none", csrf=False, cors="*")
    def forgot_password(self, **kwargs):
        data = get_json()
        err = require_fields(data, ["email"])
        if err:
            return error(err, 400)

        email = str(data.get("email") or "").strip().lower()
        users = request.env["res.users"].sudo()
        user = users.search(["|", ("login", "=", email), ("email", "=", email)], limit=1)

        reset_minutes = _reset_token_minutes()
        token = None
        reset_url = None
        if user:
            token = issue_purpose_token(user.id, "reset_password", minutes=reset_minutes)
            reset_url = f"{_frontend_url()}/reset-password?token={token}"

        payload = {
            "message": "If the account exists, password reset instructions were generated.",
            "expires_in_minutes": reset_minutes,
            "email_sent": False,
        }

        if user and _send_reset_email_enabled():
            try:
                mail = request.env["mail.mail"].sudo().create({
                    "subject": "Catalogix - Reset password",
                    "email_to": email,
                    "email_from": _reset_email_from(),
                    "body_html": (
                        f"<p>Hello {user.name or 'user'},</p>"
                        "<p>We received a request to reset your password.</p>"
                        f"<p><a href='{reset_url}'>Click here to change it</a></p>"
                        "<p>If you did not request this change, ignore this email.</p>"
                    ),
                })
                mail.send()
                payload["email_sent"] = True
                payload["message"] = "Password reset email sent"
            except Exception as exc:
                payload["email_sent"] = False
                if _debug_enabled():
                    payload["email_error"] = str(exc)

        if _debug_enabled() or not _send_reset_email_enabled():
            payload["token"] = token
            payload["reset_url"] = reset_url
        return ok(payload)

    @http.route("/api/auth/validate-reset-token", type="http", auth="none", csrf=False, cors="*")
    def validate_reset_token(self, **kwargs):
        data = get_json()
        err = require_fields(data, ["token"])
        if err:
            return error(err, 400)

        try:
            payload = decode_token(str(data.get("token")))
        except Exception:
            return error("Invalid reset token", 401)

        if payload.get("purpose") != "reset_password":
            return error("Invalid reset token purpose", 401)
        uid = payload.get("uid")
        if not uid:
            return error("Invalid reset token payload", 401)

        user = request.env["res.users"].sudo().browse(int(uid))
        if not user.exists():
            return error("User not found", 404)

        return ok({
            "valid": True,
            "uid": user.id,
            "email": user.email or user.login or "",
            "name": user.name or "",
        })

    @http.route("/api/auth/reset-password", type="http", auth="none", csrf=False, cors="*")
    def reset_password(self, **kwargs):
        data = get_json()
        err = require_fields(data, ["token", "password"])
        if err:
            return error(err, 400)

        password = str(data.get("password") or "")
        if len(password) < 8:
            return error("Password must have at least 8 characters", 400)

        try:
            payload = decode_token(str(data.get("token")))
        except Exception:
            return error("Invalid reset token", 401)

        if payload.get("purpose") != "reset_password":
            return error("Invalid reset token purpose", 401)

        uid = payload.get("uid")
        if not uid:
            return error("Invalid reset token payload", 401)

        user = request.env["res.users"].sudo().browse(int(uid))
        if not user.exists():
            return error("User not found", 404)

        user.write({"password": password})
        return ok({"message": "Password updated successfully"})

    @http.route("/api/auth/verify-email", type="http", auth="none", csrf=False, cors="*")
    def verify_email(self, **kwargs):
        data = get_json()
        err = require_fields(data, ["code"])
        if err:
            return error(err, 400)

        try:
            payload = decode_token(str(data.get("code")))
        except Exception:
            return error("Invalid verification token", 401)

        if payload.get("purpose") != "verify_email":
            return error("Invalid verification token purpose", 401)

        uid = payload.get("uid")
        if not uid:
            return error("Invalid verification token payload", 401)

        user = request.env["res.users"].sudo().browse(int(uid))
        if not user.exists():
            return error("User not found", 404)

        return ok({"message": "Email verified", "user": serialize_user(user)})

