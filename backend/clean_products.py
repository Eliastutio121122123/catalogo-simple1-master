import sys
sys.path.append('/app')
from app import create_app
from app.odoo.client import odoo

flask_app = create_app()
with flask_app.app_context():
    p = odoo.call('product.template','search_read',[[['catalog_id','=',False], ['active','=',True]]],{'fields':['id']})
    pids = [x['id'] for x in p or [] if x.get('id')]
    if pids:
        odoo.call('product.template','write',[pids, {'active': False}])
    print(f'Productos huerfanos archivados (eliminados de la vista): {len(pids)}')
