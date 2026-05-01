from odoo import models, fields, api


class Catalog(models.Model):
    _name        = "catalog.catalog"
    _description = "Catálogo Digital"

    name         = fields.Char(string="Nombre", required=True)
    category     = fields.Selection(
        selection=[
            ("Moda", "Moda"),
            ("Deportes", "Deportes"),
            ("Belleza", "Belleza"),
            ("Alimentos", "Alimentos"),
            ("Hogar", "Hogar"),
            ("Electrónica", "Electrónica"),
            ("Servicios", "Servicios"),
            ("Otros", "Otros"),
        ],
        string="Categoría",
        default="Otros",
    )
    description  = fields.Text(string="Descripción")
    image_url    = fields.Char(string="URL de imagen")
    image_1920   = fields.Image(string="Imagen", max_width=1920, max_height=1920)
    active       = fields.Boolean(default=True)
    vendor_id    = fields.Many2one("res.partner", string="Vendedor")
    product_ids  = fields.One2many("product.template", "catalog_id", string="Productos")
    product_count = fields.Integer(compute="_compute_product_count", string="# Productos")

    @api.depends("product_ids")
    def _compute_product_count(self):
        for rec in self:
            rec.product_count = len(rec.product_ids)
