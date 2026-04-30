from odoo import fields, models


class CatalogPricingSetting(models.Model):
    _name = "catalog.pricing.setting"
    _description = "Catalog Pricing Settings"
    _order = "id desc"

    partner_id = fields.Many2one(
        "res.partner",
        string="Partner",
        required=True,
        ondelete="cascade",
        index=True,
    )
    currency = fields.Selection(
        [("DOP", "DOP"), ("USD", "USD"), ("EUR", "EUR")],
        default="DOP",
        required=True,
    )
    default_margin_percent = fields.Float(string="Default Margin %", default=25)
    tax_percent = fields.Float(string="Tax %", default=18)
    round_to = fields.Selection(
        [
            ("integer", "Entero"),
            ("0.99", "Terminar en .99"),
            ("0.95", "Terminar en .95"),
            ("none", "Sin redondeo"),
        ],
        default="integer",
        required=True,
    )
    allow_manual_discounts = fields.Boolean(default=True)
    min_price_policy = fields.Selection(
        [
            ("cost_plus_margin", "Costo + margen minimo"),
            ("cost_only", "Nunca debajo del costo"),
            ("free", "Sin restriccion"),
        ],
        default="cost_plus_margin",
        required=True,
    )

    _sql_constraints = [
        (
            "catalog_pricing_setting_partner_uniq",
            "unique(partner_id)",
            "Pricing settings already exist for this partner.",
        )
    ]


class CatalogPricingRule(models.Model):
    _name = "catalog.pricing.rule"
    _description = "Catalog Pricing Rule"
    _order = "priority desc, id desc"

    partner_id = fields.Many2one(
        "res.partner",
        string="Partner",
        required=True,
        ondelete="cascade",
        index=True,
    )
    name = fields.Char(string="Name", required=True)
    scope = fields.Selection(
        [
            ("global", "Global"),
            ("catalog", "Catalogo"),
            ("category", "Categoria"),
            ("product", "Producto"),
        ],
        default="global",
        required=True,
    )
    target = fields.Char(string="Target", default="Todos los productos")
    rule_type = fields.Selection(
        [("percent", "Percent"), ("fixed", "Fixed")],
        default="percent",
        required=True,
    )
    value = fields.Float(string="Value", default=0)
    min_qty = fields.Integer(string="Min Qty", default=1)
    priority = fields.Integer(string="Priority", default=10)
    status = fields.Selection(
        [("active", "Active"), ("inactive", "Inactive")],
        default="active",
        required=True,
    )
