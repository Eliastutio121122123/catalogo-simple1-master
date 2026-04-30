from odoo import api, fields, models


class CatalogReview(models.Model):
    _name = "catalog.review"
    _description = "Catalogix Product Review"
    _order = "create_date desc, id desc"

    product_tmpl_id = fields.Many2one("product.template", string="Producto", required=True, ondelete="cascade")
    partner_id = fields.Many2one("res.partner", string="Cliente", required=True, ondelete="cascade")
    user_id = fields.Many2one("res.users", string="Usuario")

    rating = fields.Integer(string="Rating", required=True, default=5)
    title = fields.Char(string="Titulo")
    body = fields.Text(string="Resena")

    state = fields.Selection(
        [
            ("pending", "Pendiente"),
            ("approved", "Aprobada"),
            ("rejected", "Rechazada"),
        ],
        string="Estado",
        default="approved",
        required=True,
    )

    @api.constrains("rating")
    def _check_rating(self):
        for rec in self:
            if rec.rating < 1 or rec.rating > 5:
                rec.rating = max(1, min(5, rec.rating or 1))
