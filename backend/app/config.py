import os
from dotenv import load_dotenv

# Load .env explicitly from the backend directory to avoid CWD issues.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

class Config:
    SECRET_KEY       = os.getenv("SECRET_KEY", "dev-secret-key")
    DEBUG            = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # Odoo
    ODOO_URL         = os.getenv("ODOO_URL", "http://localhost:8069")
    ODOO_DB          = os.getenv("ODOO_DB", "catalogix")
    ODOO_USER        = os.getenv("ODOO_USER", "admin")
    ODOO_PASSWORD    = os.getenv("ODOO_PASSWORD", "admin")

    # CORS
    CORS_ORIGINS     = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    # JWT
    JWT_SECRET       = os.getenv("JWT_SECRET", "jwt-secret-key")
    JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))
    JWT_REFRESH_DAYS = int(os.getenv("JWT_REFRESH_DAYS", "30"))
    RESET_TOKEN_MINUTES = int(os.getenv("RESET_TOKEN_MINUTES", "30"))
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    SEND_RESET_EMAIL = os.getenv("SEND_RESET_EMAIL", "false").lower() == "true"
    RESET_EMAIL_FROM = os.getenv("RESET_EMAIL_FROM", "no-reply@catalogix.local")
    RESET_EMAIL_PROVIDER = os.getenv("RESET_EMAIL_PROVIDER") or None

    # SMTP (for password reset emails)
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
    SMTP_TIMEOUT_SECONDS = int(os.getenv("SMTP_TIMEOUT_SECONDS", "20"))

    # BCC silencioso: el vendedor/admin recibe copia de cada notificacion de pedido
    VENDOR_NOTIFY_BCC = os.getenv("VENDOR_NOTIFY_BCC", "") or None

    # If RESET_EMAIL_PROVIDER is not explicitly set, pick a sensible default.
    # - If SMTP is configured, prefer SMTP.
    # - Otherwise, fall back to Odoo mail queue.
    if RESET_EMAIL_PROVIDER is None:
        RESET_EMAIL_PROVIDER = "smtp" if SMTP_HOST else "odoo"

    # Google Sign-In (ID token / Google Identity Services)
    GOOGLE_LOGIN_ENABLED = os.getenv("GOOGLE_LOGIN_ENABLED", "false").lower() == "true"
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

    # Stripe
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLIC_KEY = os.getenv("STRIPE_PUBLIC_KEY", "")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    STRIPE_SUCCESS_URL = os.getenv(
        "STRIPE_SUCCESS_URL",
        f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/payment-result"
        "?status=success&order={{ORDER}}&session_id={{CHECKOUT_SESSION_ID}}",
    )
    STRIPE_CANCEL_URL = os.getenv(
        "STRIPE_CANCEL_URL",
        f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/checkout?status=cancel",
    )

    # WhatsApp (Meta Cloud API)
    WHATSAPP_PROVIDER = os.getenv("WHATSAPP_PROVIDER", "meta_cloud")
    WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    WHATSAPP_BUSINESS_ACCOUNT_ID = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "")
    WHATSAPP_GRAPH_VERSION = os.getenv("WHATSAPP_GRAPH_VERSION", "v19.0")
    WHATSAPP_WEBHOOK_VERIFY_TOKEN = os.getenv("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "")
    WHATSAPP_APP_SECRET = os.getenv("WHATSAPP_APP_SECRET", "")
    WHATSAPP_DEFAULT_COUNTRY_CODE = os.getenv("WHATSAPP_DEFAULT_COUNTRY_CODE", "")

    # Optional notifications
    WHATSAPP_NOTIFY_PAYMENTS = os.getenv("WHATSAPP_NOTIFY_PAYMENTS", "false").lower() == "true"
    WHATSAPP_PAYMENT_TEMPLATE = os.getenv("WHATSAPP_PAYMENT_TEMPLATE", "")
    WHATSAPP_PAYMENT_LANGUAGE = os.getenv("WHATSAPP_PAYMENT_LANGUAGE", "es")
    
