from odoo import fields, models


class CatalogInventoryMovement(models.Model):
    _name = "catalog.inventory.movement"
    _description = "Catalog Inventory Movement"
    _order = "create_date desc"

    vendor_id = fields.Many2one(
        "res.partner",
        string="Vendor",
        required=True,
        index=True,
        ondelete="cascade",
    )
    product_id = fields.Many2one(
        "product.template",
        string="Product",
        required=True,
        index=True,
        ondelete="cascade",
    )
    sku = fields.Char(string="SKU")
    type = fields.Selection(
        [("in", "In"), ("out", "Out"), ("adjust", "Adjust")],
        required=True,
        index=True,
    )
    quantity = fields.Float(string="Quantity")
    before_stock = fields.Float(string="Before Stock")
    after_stock = fields.Float(string="After Stock")
    note = fields.Text(string="Note")
    reference = fields.Char(string="Reference")
    user_id = fields.Many2one("res.users", string="User", ondelete="set null")
