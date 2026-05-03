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

        name     = str(data.get("name")     or "").strip()
        email    = str(data.get("email")    or "").strip().lower()
        password = str(data.get("password") or "")
        role     = str(data.get("role")     or "customer").strip().lower()
        phone    = str(data.get("phone")    or "").strip() or None
        company  = str(data.get("company")  or "").strip() or None

        # ── Validaciones de negocio (Backend) ──────────────────────────────
        if len(name) < 2:
            return error("Name must have at least 2 characters", 400)

        if len(password) < 8:
            return error("Password must have at least 8 characters", 400)

        # Exclusividad Gmail: el correo debe terminar estrictamente en @gmail.com
        import re
        if not re.fullmatch(r"[a-zA-Z0-9._%+\-]+@gmail\.com", email):
            return error("Only @gmail.com accounts are accepted", 400)

        # Límite de teléfono: máximo 15 caracteres (estándar internacional E.164)
        if phone and len(phone) > 15:
            return error("Phone number must not exceed 15 characters", 400)

        # ── Verificar duplicados ────────────────────────────────────────────
        users = request.env["res.users"].sudo()
        existing = users.search(["|", ("login", "=", email), ("email", "=", email)], limit=1)
        if existing:
            return error("Email is already registered", 409)

        # ── Crear usuario ───────────────────────────────────────────────────
        group_ids = resolve_role_groups(role)
        vals = {
            "name":     name,
            "login":    email,
            "email":    email,
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

            # ── Correo de verificación ──────────────────────────────────────
            # Generamos un token JWT de propósito "verify_email" (expira en 24h)
            verify_token = issue_purpose_token(user.id, "verify_email", minutes=1440)
            verify_url   = f"{_frontend_url()}/verify-email?code={verify_token}"

            email_sent = False
            if _send_reset_email_enabled():
                try:
                    mail = request.env["mail.mail"].sudo().create({
                        "subject":    "Catalogix – Verifica tu cuenta",
                        "email_to":   email,
                        "email_from": _reset_email_from(),
                        "body_html": (
                            f"<p>Hola {user.name or 'usuario'},</p>"
                            "<p>Gracias por registrarte en <strong>Catalogix</strong>.</p>"
                            "<p>Para activar tu cuenta haz clic en el siguiente enlace "
                            "(válido por 24 horas):</p>"
                            f"<p><a href='{verify_url}' "
                            f"style='background:#2563eb;color:#fff;padding:12px 24px;"
                            f"border-radius:8px;text-decoration:none;font-weight:700;'>"
                            f"Verificar mi correo</a></p>"
                            f"<p>O copia y pega esta URL en tu navegador:<br/>"
                            f"<small>{verify_url}</small></p>"
                            "<p>Si no creaste esta cuenta, ignora este mensaje.</p>"
                        ),
                    })
                    mail.send()
                    email_sent = True
                except Exception as exc:
                    # El usuario se creó; el error de correo no debe revertir el registro.
                    if _debug_enabled():
                        return ok({
                            "uid":        user.id,
                            "user":       serialize_user(user),
                            "email_sent": False,
                            "email_error": str(exc),
                            "verify_url": verify_url,
                        }, 201)

            response_payload = {
                "uid":        user.id,
                "user":       serialize_user(user),
                "email_sent": email_sent,
            }
            # En modo debug exponemos el token/URL para facilitar las pruebas
            if _debug_enabled() or not _send_reset_email_enabled():
                response_payload["verify_token"] = verify_token
                response_payload["verify_url"]   = verify_url

            return ok(response_payload, 201)

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

