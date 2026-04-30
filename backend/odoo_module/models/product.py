from odoo import api, models, fields


class ProductTemplate(models.Model):
    _inherit = "product.template"

    catalog_id = fields.Many2one("catalog.catalog", string="Catalog")
    min_stock = fields.Float(string="Min Stock", default=5)
    catalog_stock_qty = fields.Float(string="Catalog Stock", default=0)

    def _storable_field_name(self):
        if "detailed_type" in self._fields:
            return "detailed_type"
        if "type" in self._fields:
            field = self._fields.get("type")
            try:
                selection = field.selection if field else []
            except Exception:
                selection = []
            values = {val for val, _ in (selection or [])}
            if "product" in values:
                return "type"
        return None

    @api.model_create_multi
    def create(self, vals_list):
        """Auto-assign catalog for vendor users when not provided."""
        storable_field = self._storable_field_name()
        for vals in vals_list:
            if storable_field and not vals.get(storable_field):
                vals[storable_field] = "product"
            if vals.get("catalog_id"):
                continue

            user = self.env.user
            vendor = self.env["catalog.vendor"].search(
                [("user_id", "=", user.id)], limit=1
            )
            if not vendor and user.partner_id:
                vendor = self.env["catalog.vendor"].search(
                    [("partner_id", "=", user.partner_id.id)], limit=1
                )
            if not vendor:
                continue

            partner_id = vendor.partner_id.id
            catalog = self.env["catalog.catalog"].search(
                [("vendor_id", "=", partner_id)], limit=1
            )
            if not catalog:
                default_name = vendor.store_name or vendor.partner_id.name or "Catalogo principal"
                catalog = self.env["catalog.catalog"].create({
                    "name": default_name,
                    "description": "Catalogo creado automaticamente",
                    "vendor_id": partner_id,
                    "active": True,
                })
            vals["catalog_id"] = catalog.id

        return super().create(vals_list)
