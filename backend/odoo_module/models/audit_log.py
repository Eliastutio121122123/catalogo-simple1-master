from odoo import api, fields, models


class CatalogAuditLog(models.Model):
    _name = "catalog.audit.log"
    _description = "Catalog Audit Log"
    _rec_name = "code"
    _order = "occurred_at desc, id desc"

    code = fields.Char(index=True)
    occurred_at = fields.Datetime(default=fields.Datetime.now, index=True)
    actor_name = fields.Char()
    actor_role = fields.Char()
    ip_address = fields.Char()
    action = fields.Char(required=True, index=True)
    target = fields.Char()
    severity = fields.Selection(
        [("low", "Low"), ("medium", "Medium"), ("high", "High"), ("critical", "Critical")],
        default="low",
        index=True,
    )
    status = fields.Selection(
        [("ok", "OK"), ("warn", "Warn"), ("blocked", "Blocked")],
        default="ok",
        index=True,
    )
    meta_json = fields.Text()

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        for rec in records:
            if not rec.code:
                rec.code = f"AL-{rec.id}"
        return records
