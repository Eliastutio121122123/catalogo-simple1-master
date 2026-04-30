from odoo import fields, models


class CatalogCustomer(models.Model):
    _name = "catalog.customer"
    _description = "Catalog Customer"
    _rec_name = "partner_id"
    _order = "id desc"

    partner_id = fields.Many2one(
        "res.partner",
        string="Partner",
        required=True,
        ondelete="cascade",
        index=True,
    )
    user_id = fields.Many2one(
        "res.users",
        string="User",
        ondelete="set null",
    )
    status = fields.Selection(
        [("active", "Active"), ("inactive", "Inactive")],
        default="active",
        required=True,
        index=True,
    )
    phone = fields.Char(related="partner_id.phone", store=True, readonly=False)
    email = fields.Char(related="partner_id.email", store=True, readonly=False)
    notes = fields.Text()

    _sql_constraints = [
        (
            "catalog_customer_partner_uniq",
            "unique(partner_id)",
            "Customer already exists for this partner.",
        )
    ]
