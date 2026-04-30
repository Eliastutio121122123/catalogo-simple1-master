from __future__ import annotations

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token


def verify_google_id_token(*, credential: str, client_id: str) -> dict:
    """
    Verify a Google Identity Services ID token (credential) and return its payload.

    Raises ValueError if verification fails.
    """
    if not client_id:
        raise ValueError("GOOGLE_CLIENT_ID is not configured")
    if not credential:
        raise ValueError("Missing Google credential")

    # This validates signature, expiration, issuer, etc.
    payload = google_id_token.verify_oauth2_token(
        credential,
        google_requests.Request(),
        client_id,
    )
    return dict(payload or {})

