import sys
sys.path.append('/app')
from app import create_app
from app.odoo.client import odoo

app = create_app()
with app.app_context():
    products = odoo.call('product.template', 'search_read',
        [[['active', '=', True]]],
        {'fields': ['id', 'name', 'catalog_id', 'default_code'], 'limit': 300}
    ) or []
    print("=== PRODUCTOS ===")
    for p in products:
        cname = p.get('catalog_id')
        cname = cname[1] if isinstance(cname, list) and len(cname) > 1 else cname
        print("  id=%s  name=%s  code=%s  catalog=%s" % (p['id'], p['name'], p.get('default_code'), cname))

    catalogs = odoo.call('catalog.catalog', 'search_read',
        [[['active', '=', True]]],
        {'fields': ['id', 'name', 'vendor_id'], 'limit': 100}
    ) or []
    print("=== CATALOGOS ===")
    for c in catalogs:
        vname = c.get('vendor_id')
        vname = vname[1] if isinstance(vname, list) and len(vname) > 1 else vname
        print("  id=%s  name=%s  vendor=%s" % (c['id'], c['name'], vname))
