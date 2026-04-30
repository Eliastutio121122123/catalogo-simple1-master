from odoo import api, fields, models
from odoo.exceptions import ValidationError


class CatalogPromotion(models.Model):
    _name = "catalog.promotion"
    _description = "Catalog Promotion"
    _rec_name = "name"
    _order = "id desc"

    name = fields.Char(required=True, index=True)
    code = fields.Char(index=True)
    description = fields.Text()
    promotion_type = fields.Selection(
        [("percent", "Percentage"), ("fixed", "Fixed Amount"), ("shipping", "Free Shipping")],
        required=True,
        default="percent",
    )
    value = fields.Float(required=True, default=0.0)
    min_order_amount = fields.Float()
    max_discount_amount = fields.Float()
    applies_to = fields.Selection(
        [("all", "All"), ("catalog", "Catalog"), ("category", "Category"), ("product", "Product")],
        required=True,
        default="all",
    )
    start_date = fields.Date()
    end_date = fields.Date()
    usage_limit = fields.Integer()
    used_count = fields.Integer(default=0)
    status = fields.Selection(
        [("active", "Active"), ("inactive", "Inactive"), ("expired", "Expired")],
        required=True,
        default="active",
        index=True,
    )
    vendor_partner_id = fields.Many2one(
        "res.partner",
        required=True,
        index=True,
        default=lambda self: self.env.user.partner_id.id,
    )
    active = fields.Boolean(default=True)

    _sql_constraints = [
        (
            "catalog_promotion_vendor_code_uniq",
            "unique(code, vendor_partner_id)",
            "Promotion code must be unique for this vendor.",
        )
    ]

    @api.constrains("promotion_type", "value")
    def _check_value(self):
        for rec in self:
            if rec.promotion_type != "shipping" and rec.value <= 0:
                raise ValidationError("Promotion value must be greater than 0.")
            if rec.promotion_type == "percent" and rec.value > 100:
                raise ValidationError("Percentage promotion cannot be greater than 100.")

    @api.constrains("start_date", "end_date")
    def _check_dates(self):
        for rec in self:
            if rec.start_date and rec.end_date and rec.end_date < rec.start_date:
                raise ValidationError("End date cannot be earlier than start date.")

    @api.constrains("usage_limit")
    def _check_usage_limit(self):
        for rec in self:
            if rec.usage_limit is not None and rec.usage_limit < 0:
                raise ValidationError("usage_limit cannot be negative.")

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            code = vals.get("code")
            if code:
                vals["code"] = str(code).strip().upper()
        return super().create(vals_list)

    def write(self, vals):
        if vals.get("code"):
            vals["code"] = str(vals["code"]).strip().upper()
        return super().write(vals)
