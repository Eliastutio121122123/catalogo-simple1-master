import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr


def send_email_smtp(
    *,
    host: str,
    port: int,
    username: str | None,
    password: str | None,
    use_tls: bool,
    use_ssl: bool,
    timeout_seconds: int,
    email_from: str,
    email_to: str,
    subject: str,
    text_body: str,
    html_body: str | None = None,
    from_name: str | None = None,
) -> None:
    if not host:
        raise ValueError("SMTP_HOST is required to send emails via SMTP")
    if use_tls and use_ssl:
        raise ValueError("SMTP_USE_TLS and SMTP_USE_SSL cannot both be true")

    # Most SMTP providers (including Gmail) require authentication.
    if host.lower() in {"smtp.gmail.com", "smtp.googlemail.com"} and (not username or not password):
        raise ValueError(
            "SMTP_USER and SMTP_PASSWORD are required for Gmail SMTP. "
            "Tip: if your Gmail has 2FA enabled, use an App Password (not your normal Gmail password)."
        )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = formataddr((from_name, email_from)) if from_name else email_from
    msg["To"] = email_to
    msg.set_content(text_body)
    if html_body:
        msg.add_alternative(html_body, subtype="html")

    if use_ssl:
        client: smtplib.SMTP = smtplib.SMTP_SSL(host=host, port=port, timeout=timeout_seconds)
    else:
        client = smtplib.SMTP(host=host, port=port, timeout=timeout_seconds)

    try:
        client.ehlo()
        if use_tls:
            client.starttls(context=ssl.create_default_context())
            client.ehlo()
        if username and password:
            try:
                client.login(username, password)
            except smtplib.SMTPAuthenticationError as exc:
                raise ValueError(
                    "SMTP authentication failed. Verify SMTP_USER/SMTP_PASSWORD. "
                    "For Gmail, this usually means you need an App Password."
                ) from exc
        client.send_message(msg)
    finally:
        try:
            client.quit()
        except Exception:
            # Avoid masking the original error if quit fails.
            pass
