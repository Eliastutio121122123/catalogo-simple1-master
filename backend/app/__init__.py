import logging
import sys
from flask import Flask
from flask_cors import CORS
from .config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, origins=app.config["CORS_ORIGINS"])
    _configure_logging(app)

    # ── Blueprints ────────────────────────────────────────────────────────────
    from .api.auth     import bp as auth_bp
    from .api.catalogs import bp as catalogs_bp
    from .api.products import bp as products_bp
    from .api.orders   import bp as orders_bp
    from .api.payments import bp as payments_bp
    from .api.users    import bp as users_bp
    from .api.vendor_coupons import bp as vendor_coupons_bp
    from .api.vendor_customers import bp as vendor_customers_bp
    from .api.vendor_invoices import bp as vendor_invoices_bp
    from .api.vendor_products import bp as vendor_products_bp
    from .api.vendor_promotions import bp as vendor_promotions_bp
    from .api.vendor_dashboard import bp as vendor_dashboard_bp
    from .api.vendor_notifications import bp as vendor_notifications_bp
    from .api.vendor_orders import bp as vendor_orders_bp
    from .api.store import bp as store_bp
    from .api.vendor_catalogs import bp as vendor_catalogs_bp
    from .api.vendor_profile import bp as vendor_profile_bp
    from .api.vendor_inventory import bp as vendor_inventory_bp
    from .api.vendor_pricing import bp as vendor_pricing_bp
    from .api.vendor_reports import bp as vendor_reports_bp
    from .api.customer_invoices import bp as customer_invoices_bp
    from .api.admin_audit import bp as admin_audit_bp
    from .api.admin_users import bp as admin_users_bp
    from .api.admin_vendors import bp as admin_vendors_bp
    from .api.admin_catalogs import bp as admin_catalogs_bp
    from .api.admin_orders import bp as admin_orders_bp
    from .api.admin_payments import bp as admin_payments_bp
    from .api.admin_products import bp as admin_products_bp
    from .api.admin_dashboard import bp as admin_dashboard_bp
    from .api.admin_reports import bp as admin_reports_bp
    from .api.currencies import bp as currencies_bp
    from .api.whatsapp import bp as whatsapp_bp

    app.register_blueprint(auth_bp,     url_prefix="/api/auth")
    app.register_blueprint(catalogs_bp, url_prefix="/api/catalogs")
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(orders_bp,   url_prefix="/api/orders")
    app.register_blueprint(payments_bp, url_prefix="/api/payments")
    app.register_blueprint(users_bp,    url_prefix="/api/users")
    app.register_blueprint(vendor_coupons_bp, url_prefix="/api/vendor/coupons")
    app.register_blueprint(vendor_customers_bp, url_prefix="/api/vendor/customers")
    app.register_blueprint(vendor_invoices_bp, url_prefix="/api/vendor/invoices")
    app.register_blueprint(vendor_products_bp, url_prefix="/api/vendor/products")
    app.register_blueprint(vendor_promotions_bp, url_prefix="/api/vendor/promotions")
    app.register_blueprint(vendor_dashboard_bp, url_prefix="/api/vendor/dashboard")
    app.register_blueprint(vendor_notifications_bp, url_prefix="/api/vendor/notifications")
    app.register_blueprint(vendor_orders_bp, url_prefix="/api/vendor/orders")
    app.register_blueprint(vendor_catalogs_bp, url_prefix="/api/vendor/catalogs")
    app.register_blueprint(vendor_profile_bp, url_prefix="/api/vendor/profile")
    app.register_blueprint(vendor_inventory_bp, url_prefix="/api/vendor/inventory")
    app.register_blueprint(vendor_pricing_bp, url_prefix="/api/vendor/pricing")
    app.register_blueprint(vendor_reports_bp, url_prefix="/api/vendor/reports")
    app.register_blueprint(customer_invoices_bp, url_prefix="/api/customer/invoices")
    app.register_blueprint(store_bp, url_prefix="/store")
    app.register_blueprint(admin_audit_bp, url_prefix="/api/admin/audit")
    app.register_blueprint(admin_users_bp, url_prefix="/api/admin/users")
    app.register_blueprint(admin_vendors_bp, url_prefix="/api/admin/vendors")
    app.register_blueprint(admin_catalogs_bp, url_prefix="/api/admin/catalogs")
    app.register_blueprint(admin_orders_bp, url_prefix="/api/admin/orders")
    app.register_blueprint(admin_payments_bp, url_prefix="/api/admin/payments")
    app.register_blueprint(admin_products_bp, url_prefix="/api/admin/products")
    app.register_blueprint(admin_dashboard_bp, url_prefix="/api/admin/dashboard")
    app.register_blueprint(admin_reports_bp, url_prefix="/api/admin/reports")
    app.register_blueprint(currencies_bp, url_prefix="/api/currencies")
    app.register_blueprint(whatsapp_bp, url_prefix="/api/whatsapp")

    return app


def _configure_logging(app: Flask) -> None:
    """Ensure app logs are visible in container logs."""
    gunicorn_logger = logging.getLogger("gunicorn.error")
    if gunicorn_logger and gunicorn_logger.handlers:
        app.logger.handlers = gunicorn_logger.handlers
        app.logger.setLevel(gunicorn_logger.level)
        return

    if not app.logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] %(message)s"
        )
        handler.setFormatter(formatter)
        app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)
