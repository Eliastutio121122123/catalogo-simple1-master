import jwt
from functools import wraps
from flask import request, current_app
from ..utils.response import error


def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            try:
                current_app.logger.warning(
                    "auth_guard: missing token for %s %s",
                    request.method,
                    request.path,
                )
            except Exception:
                pass
            return error("Missing or invalid token", 401)

        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(
                token,
                current_app.config["JWT_SECRET"],
                algorithms=["HS256"]
            )
            uid = payload.get("uid") or payload.get("user_id") or payload.get("id") or payload.get("sub")
            if not uid:
                return error("Invalid token", 401)
            try:
                payload["uid"] = int(uid)
            except (TypeError, ValueError):
                return error("Invalid token", 401)
            request.jwt_payload = payload
        except jwt.ExpiredSignatureError:
            return error("Token expired", 401)
        except jwt.InvalidTokenError:
            return error("Invalid token", 401)

        return f(*args, **kwargs)
    return decorated
