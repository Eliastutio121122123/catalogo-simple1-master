from odoo import api, fields, models


class CatalogVendor(models.Model):
    _name = "catalog.vendor"
    _description = "Catalog Vendor"
    _rec_name = "store_name"
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
    store_name = fields.Char(string="Store Name", required=True)
    status = fields.Selection(
        [("pending", "Pending"), ("active", "Active"), ("suspended", "Suspended")],
        default="pending",
        required=True,
        index=True,
    )
    phone = fields.Char(related="partner_id.phone", store=True, readonly=False)
    email = fields.Char(related="partner_id.email", store=True, readonly=False)
    notes = fields.Text()

    _sql_constraints = [
        (
            "catalog_vendor_partner_uniq",
            "unique(partner_id)",
            "Vendor already exists for this partner.",
        )
    ]

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get("store_name"):
                partner_id = vals.get("partner_id")
                if partner_id:
                    partner = self.env["res.partner"].browse(partner_id)
                    if partner and partner.name:
                        vals["store_name"] = partner.name
        return super().create(vals_list)
