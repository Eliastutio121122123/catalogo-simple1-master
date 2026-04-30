from .client import odoo
from .users import get_user_by_id


def login(username: str, password: str) -> dict:
    """
    Validate user credentials against Odoo and return user profile.
    Uses a one-off authentication to avoid overwriting the shared admin session.
    """
    uid = odoo.authenticate(username, password, persist=False)
    user = get_user_by_id(uid)
    return {"uid": uid, "user": user}
