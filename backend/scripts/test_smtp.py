import argparse
import pathlib
import sys

# When this script is executed as `python scripts/test_smtp.py`, Python adds
# `.../scripts` to sys.path, but not necessarily the project root. Ensure the
# backend root (which contains the `app/` package) is importable.
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.config import Config  # noqa: E402
from app.utils.emailer import send_email_smtp  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Send a test email using SMTP settings from backend/.env")
    parser.add_argument("--to", required=True, help="Recipient email address")
    parser.add_argument("--subject", default="Catalogix - SMTP test", help="Email subject")
    parser.add_argument(
        "--text",
        default="If you received this email, your SMTP configuration is working.",
        help="Plain text body",
    )
    args = parser.parse_args()

    email_from = str(getattr(Config, "RESET_EMAIL_FROM", "") or getattr(Config, "SMTP_USER", "") or "")
    if not email_from:
        raise SystemExit("RESET_EMAIL_FROM (or SMTP_USER) is required to send the test email.")

    send_email_smtp(
        host=str(getattr(Config, "SMTP_HOST", "") or ""),
        port=int(getattr(Config, "SMTP_PORT", 587) or 587),
        username=str(getattr(Config, "SMTP_USER", "") or "") or None,
        password=str(getattr(Config, "SMTP_PASSWORD", "") or "") or None,
        use_tls=bool(getattr(Config, "SMTP_USE_TLS", True)),
        use_ssl=bool(getattr(Config, "SMTP_USE_SSL", False)),
        timeout_seconds=int(getattr(Config, "SMTP_TIMEOUT_SECONDS", 20) or 20),
        email_from=email_from,
        email_to=str(args.to),
        subject=str(args.subject),
        text_body=str(args.text),
        html_body=None,
        from_name="Catalogix",
    )

    print("OK: test email sent")


if __name__ == "__main__":
    main()
