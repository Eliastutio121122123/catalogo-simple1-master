from odoo import api, fields, models
from odoo.exceptions import ValidationError


class CatalogCoupon(models.Model):
    _name = "catalog.coupon"
    _description = "Catalog Coupon"
    _rec_name = "code"
    _order = "id desc"

    code = fields.Char(required=True, index=True)
    description = fields.Text()
    discount_type = fields.Selection(
        [("percent", "Percentage"), ("fixed", "Fixed Amount")],
        required=True,
        default="percent",
    )
    value = fields.Float(required=True, default=0.0)
    min_order_amount = fields.Float()
    max_discount_amount = fields.Float()
    max_uses = fields.Integer()
    max_uses_per_user = fields.Integer(default=1)
    expires_at = fields.Date()
    status = fields.Selection(
        [("active", "Active"), ("inactive", "Inactive"), ("expired", "Expired")],
        required=True,
        default="active",
        index=True,
    )
    catalog_ids = fields.Many2many(
        "catalog.catalog",
        "catalog_coupon_catalog_rel",
        "coupon_id",
        "catalog_id",
        string="Catalogs",
    )
    one_per_customer = fields.Boolean(default=True)
    new_customers_only = fields.Boolean(default=False)
    usage_count = fields.Integer(default=0)
    vendor_partner_id = fields.Many2one(
        "res.partner",
        required=True,
        index=True,
        default=lambda self: self.env.user.partner_id.id,
    )
    active = fields.Boolean(default=True)

    _sql_constraints = [
        (
            "catalog_coupon_vendor_code_uniq",
            "unique(code, vendor_partner_id)",
            "Coupon code must be unique for this vendor.",
        )
    ]

    @api.constrains("discount_type", "value")
    def _check_discount_value(self):
        for rec in self:
            if rec.value <= 0:
                raise ValidationError("Coupon value must be greater than 0.")
            if rec.discount_type == "percent" and rec.value > 100:
                raise ValidationError("Percentage discount cannot be greater than 100.")

    @api.constrains("max_uses", "max_uses_per_user")
    def _check_usage_limits(self):
        for rec in self:
            if rec.max_uses is not None and rec.max_uses < 0:
                raise ValidationError("max_uses cannot be negative.")
            if rec.max_uses_per_user is not None and rec.max_uses_per_user < 1:
                raise ValidationError("max_uses_per_user must be at least 1.")

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
