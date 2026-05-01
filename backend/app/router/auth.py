import datetime
import jwt
import re
import secrets
from flask import Blueprint, current_app, request
from ..odoo.client import odoo
from ..utils.emailer import send_email_smtp
from ..utils.google_signin import verify_google_id_token

from ..odoo.auth import login as odoo_login
from ..odoo.users import (
    UserAlreadyExistsError,
    create_user,
    get_user_by_email,
    get_user_by_id,
    normalize_email,
    UserService,
    update_user,
)
from ..utils.response import error, success
from ..utils.validators import require_fields
from ..utils.audit_writer import log_event

bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _partner_id_from_user(user: dict | None) -> int | None:
    if not user:
        return None
    partner = user.get("partner_id") or []
    if isinstance(partner, list) and partner:
        return int(partner[0])
    return None


def issue_jwt(uid: int, partner_id: int | None = None) -> str:
    payload = {
        "uid": uid,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(
            hours=current_app.config["JWT_EXPIRY_HOURS"]
        ),
    }
    if partner_id:
        payload["partner_id"] = int(partner_id)
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")


def issue_refresh_token(uid: int) -> str:
    return jwt.encode({
        "uid": uid,
        "purpose": "refresh",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(
            days=current_app.config["JWT_REFRESH_DAYS"]
        ),
    }, current_app.config["JWT_SECRET"], algorithm="HS256")


def issue_purpose_token(uid: int, purpose: str, minutes: int = 30) -> str:
    return jwt.encode({
        "uid": uid,
        "purpose": purpose,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=minutes),
    }, current_app.config["JWT_SECRET"], algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=["HS256"])


def parse_reset_token(token: str) -> tuple[int, dict]:
    payload = decode_token(token)
    if payload.get("purpose") != "reset_password":
        raise jwt.InvalidTokenError("Invalid reset token purpose")
    uid = payload.get("uid")
    if not uid:
        raise jwt.InvalidTokenError("Invalid reset token payload")
    return int(uid), payload


def send_reset_email(email_to: str, name: str, reset_url: str) -> bool:
    provider = (current_app.config.get("RESET_EMAIL_PROVIDER") or "odoo").strip().lower()
    email_from = str(current_app.config["RESET_EMAIL_FROM"])

    subject = "Catalogix - Restablecer contraseña"
    html_body = (
        f"<p>Hola {name or 'usuario'},</p>"
        "<p>Recibimos una solicitud para restablecer tu contraseña.</p>"
        f"<p><a href='{reset_url}'>Haz clic aquí para cambiarla</a></p>"
        "<p>Si no solicitaste este cambio, ignora este mensaje.</p>"
    )
    text_body = (
        f"Hola {name or 'usuario'},\n\n"
        "Recibimos una solicitud para restablecer tu contraseña.\n\n"
        f"Abrir enlace: {reset_url}\n\n"
        "Si no solicitaste este cambio, ignora este mensaje.\n"
    )

    if provider == "smtp":
        send_email_smtp(
            host=str(current_app.config.get("SMTP_HOST") or ""),
            port=int(current_app.config.get("SMTP_PORT") or 587),
            username=str(current_app.config.get("SMTP_USER") or "") or None,
            password=str(current_app.config.get("SMTP_PASSWORD") or "") or None,
            use_tls=bool(current_app.config.get("SMTP_USE_TLS")),
            use_ssl=bool(current_app.config.get("SMTP_USE_SSL")),
            timeout_seconds=int(current_app.config.get("SMTP_TIMEOUT_SECONDS") or 20),
            email_from=email_from,
            email_to=email_to,
            subject=subject,
            text_body=text_body,
            html_body=html_body,
            from_name="Catalogix",
        )
        return True

    if provider != "odoo":
        raise ValueError("RESET_EMAIL_PROVIDER must be 'smtp' or 'odoo'")

    mail_id = odoo.create(
        "mail.mail",
        {
            "subject": subject,
            "email_to": email_to,
            "email_from": email_from,
            "body_html": html_body,
        },
    )
    # Attempt immediate send; Odoo mail queue can also process this later.
    odoo.call("mail.mail", "send", [[mail_id]])
    return True


@bp.post("/login")
def login():
    data = request.get_json() or {}
    err = require_fields(data, ["email", "password"])
    if err:
        return error(err, 400)

    raw_login = str(data["email"] or "").strip()
    password = str(data["password"])
    if not raw_login:
        return error("El usuario o correo es obligatorio", 400)

    # Permitir login por usuario o correo. Validamos formato solo si parece email.
    if "@" in raw_login:
        login_id = normalize_email(raw_login)
        if not EMAIL_REGEX.match(login_id):
            return error("Invalid email format", 400)
    else:
        login_id = raw_login

    try:
        result = odoo_login(login_id, password)
        # Ensure partner is linked so vendor endpoints can resolve it.
        partner_id = UserService.resolve_partner_id(result["uid"])
        user = get_user_by_id(result["uid"])
        token = issue_jwt(result["uid"], partner_id=partner_id or _partner_id_from_user(user))
        refresh_token = issue_refresh_token(result["uid"])
        log_event(
            "LOGIN_SUCCESS",
            target=f"user:{login_id}",
            actor_name=user.get("name") or login_id,
            actor_role=user.get("role") or "customer",
            severity="low",
            status="ok",
        )
        return success({"token": token, "refresh_token": refresh_token, "user": user})
    except PermissionError:
        log_event(
            "LOGIN_FAILED",
            target=f"user:{login_id}",
            actor_name=login_id,
            actor_role="unknown",
            severity="high",
            status="blocked",
        )
        return error("Invalid email or password", 401)
    except LookupError as exc:
        log_event(
            "LOGIN_FAILED",
            target=f"user:{login_id}",
            actor_name=login_id,
            actor_role="unknown",
            severity="medium",
            status="warn",
        )
        return error(str(exc), 404)


@bp.post("/register")
def register():
    data = request.get_json() or {}
    err = require_fields(data, ["name", "email", "password"])
    if err:
        return error(err, 400)

    name = str(data["name"]).strip()
    email = normalize_email(data["email"])
    password = str(data["password"])
    role = str(data.get("role") or "customer").strip().lower()
    phone = str(data.get("phone") or "").strip() or None
    company = str(data.get("company") or "").strip() or None

    if len(name) < 2:
        return error("Name must have at least 2 characters", 400)
    if not EMAIL_REGEX.match(email):
        return error("Invalid email format", 400)
    if len(password) < 8:
        return error("Password must have at least 8 characters", 400)
    if role not in {"customer", "vendor"}:
        return error("Invalid role. Allowed: customer, vendor", 400)

    try:
        uid = create_user(name, email, password, role=role, phone=phone, company=company)
        if role == "vendor":
            UserService.resolve_partner_id(uid)
        user = get_user_by_id(uid)
        log_event(
            "USER_REGISTERED",
            target=f"user:{email}",
            actor_name=name,
            actor_role=role,
            severity="low",
            status="ok",
        )
        return success({"uid": uid, "user": user}, 201)
    except UserAlreadyExistsError as exc:
        log_event(
            "REGISTER_DUPLICATE",
            target=f"user:{email}",
            actor_name=name,
            actor_role=role,
            severity="medium",
            status="warn",
        )
        return error(str(exc), 409)
    except PermissionError as exc:
        return error(str(exc), 403)
    except Exception as exc:
        return error(str(exc), 500)


@bp.post("/google")
def google_signin():
    """
    Login/Register using a Google Identity Services ID token (credential).

    Frontend flow:
    - Google returns `credential` (ID token)
    - Frontend POSTs { credential, role? } to this endpoint
    """
    if not current_app.config.get("GOOGLE_LOGIN_ENABLED"):
        return error("Google login is disabled", 403)

    data = request.get_json() or {}
    credential = str(data.get("credential") or "").strip()
    if not credential:
        return error("credential is required", 400)

    role = str(data.get("role") or "customer").strip().lower()
    if role not in {"customer", "vendor"}:
        return error("Invalid role. Allowed: customer, vendor", 400)

    try:
        payload = verify_google_id_token(
            credential=credential,
            client_id=str(current_app.config.get("GOOGLE_CLIENT_ID") or ""),
        )
    except Exception:
        return error("Invalid Google token", 401)

    email = normalize_email(str(payload.get("email") or ""))
    if not email or not EMAIL_REGEX.match(email):
        return error("Google account did not provide a valid email", 400)

    if payload.get("email_verified") is False:
        return error("Google email is not verified", 403)

    name = str(payload.get("name") or payload.get("given_name") or "").strip()
    if not name:
        name = email.split("@", 1)[0]

    is_new = False
    try:
        user = get_user_by_email(email)
        if not user:
            # Create a user in Odoo with a random password; auth will be via Google.
            random_password = secrets.token_urlsafe(32)
            uid = create_user(name, email, random_password, role=role)
            if role == "vendor":
                UserService.resolve_partner_id(uid)
            user = get_user_by_id(uid)
            is_new = True

        uid = int(user["id"])
        partner_id = UserService.resolve_partner_id(uid)
        token = issue_jwt(uid, partner_id=partner_id or _partner_id_from_user(user))
        refresh_token = issue_refresh_token(uid)
        return success({"token": token, "refresh_token": refresh_token, "user": user, "is_new": is_new})
    except UserAlreadyExistsError:
        # Race condition: user was created between checks.
        user = get_user_by_email(email)
        if not user:
            return error("Could not create user", 500)
        uid = int(user["id"])
        partner_id = UserService.resolve_partner_id(uid)
        token = issue_jwt(uid, partner_id=partner_id or _partner_id_from_user(user))
        refresh_token = issue_refresh_token(uid)
        return success({"token": token, "refresh_token": refresh_token, "user": user, "is_new": False})
    except Exception as exc:
        return error(str(exc), 500)


@bp.post("/logout")
def logout():
    # JWT is stateless: logout is handled on the client by deleting token.
    log_event(
        "LOGOUT",
        target="session",
        actor_name="authenticated_user",
        actor_role="user",
        severity="low",
        status="ok",
    )
    return success({"message": "Logged out"})


@bp.post("/refresh")
def refresh():
    data = request.get_json() or {}
    err = require_fields(data, ["refresh_token"])
    if err:
        return error(err, 400)

    try:
        payload = decode_token(str(data["refresh_token"]))
    except jwt.ExpiredSignatureError:
        return error("Refresh token expired", 401)
    except jwt.InvalidTokenError:
        return error("Invalid refresh token", 401)

    if payload.get("purpose") != "refresh":
        return error("Invalid refresh token purpose", 401)

    uid = payload.get("uid")
    if not uid:
        return error("Invalid refresh token payload", 401)

    uid = int(uid)
    partner_id = UserService.resolve_partner_id(uid)
    user = get_user_by_id(uid)
    token = issue_jwt(uid, partner_id=partner_id or _partner_id_from_user(user))
    refresh_token = issue_refresh_token(int(uid))
    return success({"token": token, "refresh_token": refresh_token})


@bp.post("/forgot-password")
def forgot_password():
    data = request.get_json() or {}
    err = require_fields(data, ["email"])
    if err:
        return error(err, 400)

    email = normalize_email(data["email"])
    if not EMAIL_REGEX.match(email):
        return error("Invalid email format", 400)

    user = get_user_by_email(email)
    # Do not leak whether an email exists in the system.
    generic_message = "Si la cuenta existe, enviaremos un enlace para restablecer la contraseña."
    payload: dict = {"message": generic_message}

    if not user:
        if current_app.config["DEBUG"]:
            payload["user_exists"] = False
        return success(payload)

    reset_minutes = current_app.config["RESET_TOKEN_MINUTES"]
    reset_token = issue_purpose_token(user["id"], "reset_password", minutes=reset_minutes)
    reset_url = f"{current_app.config['FRONTEND_URL']}/reset-password?token={reset_token}"

    if current_app.config["SEND_RESET_EMAIL"]:
        try:
            send_reset_email(email, user.get("name"), reset_url)
            if current_app.config["DEBUG"]:
                payload["email_sent"] = True
        except Exception as exc:
            current_app.logger.exception("Failed to send reset email")
            if current_app.config["DEBUG"]:
                payload["email_sent"] = False
                payload["email_error"] = str(exc)
    elif current_app.config["DEBUG"]:
        payload["email_sent"] = False

    if current_app.config["DEBUG"]:
        # In dev mode we return token/link directly; in production this should be emailed.
        payload["user_exists"] = True
        payload["expires_in_minutes"] = reset_minutes
        payload["token"] = reset_token
        payload["reset_url"] = reset_url

    return success(payload)


@bp.post("/validate-reset-token")
def validate_reset_token():
    data = request.get_json() or {}
    err = require_fields(data, ["token"])
    if err:
        return error(err, 400)

    try:
        uid, _ = parse_reset_token(str(data["token"]))
        user = get_user_by_id(uid)
        return success({
            "valid": True,
            "uid": uid,
            "email": user.get("email"),
            "name": user.get("name"),
        })
    except jwt.ExpiredSignatureError:
        return error("Reset token expired", 401)
    except jwt.InvalidTokenError:
        return error("Invalid reset token", 401)
    except LookupError as exc:
        return error(str(exc), 404)


@bp.post("/reset-password")
def reset_password():
    data = request.get_json() or {}
    err = require_fields(data, ["token", "password"])
    if err:
        return error(err, 400)

    password = str(data["password"])
    if len(password) < 8:
        return error("Password must have at least 8 characters", 400)

    try:
        uid, _ = parse_reset_token(str(data["token"]))
    except jwt.ExpiredSignatureError:
        log_event(
            "PASSWORD_RESET_EXPIRED",
            target="reset_token",
            actor_name="unknown",
            actor_role="user",
            severity="medium",
            status="blocked",
        )
        return error("Reset token expired", 401)
    except jwt.InvalidTokenError:
        log_event(
            "PASSWORD_RESET_INVALID_TOKEN",
            target="reset_token",
            actor_name="unknown",
            actor_role="user",
            severity="high",
            status="blocked",
        )
        return error("Invalid reset token", 401)

    try:
        update_user(uid, {"password": password})
        log_event(
            "PASSWORD_RESET_SUCCESS",
            target=f"user:{uid}",
            actor_name=f"uid:{uid}",
            actor_role="user",
            severity="medium",
            status="ok",
        )
    except Exception as exc:
        log_event(
            "PASSWORD_RESET_FAILED",
            target=f"user:{uid}",
            actor_name=f"uid:{uid}",
            actor_role="user",
            severity="high",
            status="warn",
        )
        return error(f"No se pudo actualizar la contraseña: {exc}", 500)
    return success({"message": "Password updated successfully"})


@bp.post("/verify-email")
def verify_email():
    data = request.get_json() or {}
    err = require_fields(data, ["code"])
    if err:
        return error(err, 400)

    try:
        payload = decode_token(str(data["code"]))
    except jwt.ExpiredSignatureError:
        return error("Verification token expired", 401)
    except jwt.InvalidTokenError:
        return error("Invalid verification token", 401)

    if payload.get("purpose") != "verify_email":
        return error("Invalid verification token purpose", 401)

    uid = payload.get("uid")
    if not uid:
        return error("Invalid verification token payload", 401)

    user = get_user_by_id(int(uid))
    return success({"message": "Email verified", "user": user})
