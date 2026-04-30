from odoo import fields, models


class CatalogNotification(models.Model):
    _name = "catalog.notification"
    _description = "Catalog Notification"
    _order = "create_date desc, id desc"

    vendor_partner_id = fields.Many2one(
        "res.partner",
        string="Vendor",
        required=True,
        index=True,
        ondelete="cascade",
    )
    title = fields.Char(required=True)
    body = fields.Text()
    notif_type = fields.Selection(
        [
            ("order", "Order"),
            ("inventory", "Inventory"),
            ("invoice", "Invoice"),
            ("system", "System"),
        ],
        default="system",
        required=True,
        index=True,
    )
    is_read = fields.Boolean(default=False, index=True)
