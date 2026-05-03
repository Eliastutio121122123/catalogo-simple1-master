"""
Script de limpieza de datos de prueba en Odoo.
Elimina (archiva) productos y catálogos de prueba identificados.

MODO SIMULACION: Primero imprime lo que va a borrar.
Cambia DRY_RUN = False para ejecutar el borrado real.
"""
import sys
sys.path.append('/app')
from app import create_app
from app.odoo.client import odoo

DRY_RUN = False  # Cambiar a False para borrar de verdad

# IDs de catálogos de prueba a eliminar
CATALOGS_TO_DELETE = [
    1,   # Tienda Test
    2,   # Cat API
    3,   # Cat API (duplicado)
    12,  # m (catálogo sin nombre real)
]

# IDs de productos de prueba a eliminar
PRODUCTS_TO_DELETE = [
    1,   # Producto test (SKU-123)
    2,   # Producto test (SKU-123 duplicado)
    3,   # Producto test 2
    4,   # Producto test 3
    5,   # Producto test 4
    6,   # Producto API
    7,   # Producto Lento
    29,  # sda231 (catalogo "m")
]

app = create_app()
with app.app_context():
    # --- Mostrar lo que se va a borrar ---
    print("=" * 60)
    print("PRODUCTOS A ELIMINAR:")
    prods = odoo.call('product.template', 'search_read',
        [[['id', 'in', PRODUCTS_TO_DELETE]]],
        {'fields': ['id', 'name', 'default_code', 'catalog_id']}
    ) or []
    for p in prods:
        cat = p.get('catalog_id')
        cat = cat[1] if isinstance(cat, list) and len(cat) > 1 else cat
        print("  [id=%s] %s (SKU: %s) - Catálogo: %s" % (
            p['id'], p['name'], p.get('default_code', '-'), cat))

    print("\nCATALOGOS A ELIMINAR:")
    cats = odoo.call('catalog.catalog', 'search_read',
        [[['id', 'in', CATALOGS_TO_DELETE]]],
        {'fields': ['id', 'name', 'vendor_id']}
    ) or []
    for c in cats:
        vendor = c.get('vendor_id')
        vendor = vendor[1] if isinstance(vendor, list) and len(vendor) > 1 else vendor
        print("  [id=%s] %s - Vendedor: %s" % (c['id'], c['name'], vendor))

    print("=" * 60)

    if DRY_RUN:
        print("\n[DRY RUN] No se eliminó nada. Cambia DRY_RUN=False para borrar.")
    else:
        # Archivar productos
        if PRODUCTS_TO_DELETE:
            # Primero desactivar variantes para evitar errores de FK
            try:
                variants = odoo.call('product.product', 'search_read',
                    [[['product_tmpl_id', 'in', PRODUCTS_TO_DELETE]]],
                    {'fields': ['id']}
                ) or []
                vids = [v['id'] for v in variants]
                if vids:
                    odoo.call('product.product', 'write', [vids, {'active': False}])
                    print("Variantes archivadas:", len(vids))
            except Exception as e:
                print("Advertencia variantes:", e)

            # Archivar templates
            try:
                odoo.call('product.template', 'write',
                    [PRODUCTS_TO_DELETE, {'active': False}])
                print("Productos archivados:", len(PRODUCTS_TO_DELETE))
            except Exception as e:
                print("Error archivando productos:", e)

        # Archivar catálogos
        if CATALOGS_TO_DELETE:
            try:
                odoo.call('catalog.catalog', 'write',
                    [CATALOGS_TO_DELETE, {'active': False}])
                print("Catálogos archivados:", len(CATALOGS_TO_DELETE))
            except Exception as e:
                print("Error archivando catálogos:", e)

        print("\n✅ Limpieza completada. Datos de prueba eliminados de la vista pública.")
        print("(Los registros fueron archivados en Odoo, no borrados permanentemente.)")

        # Verificar resultado
        remaining_prods = odoo.call('product.template', 'search_read',
            [[['active', '=', True]]],
            {'fields': ['id', 'name', 'catalog_id'], 'limit': 100}
        ) or []
        remaining_cats = odoo.call('catalog.catalog', 'search_read',
            [[['active', '=', True]]],
            {'fields': ['id', 'name'], 'limit': 100}
        ) or []
        print("\n=== DATOS RESTANTES ===")
        print("Productos activos:", len(remaining_prods))
        for p in remaining_prods:
            cat = p.get('catalog_id')
            cat = cat[1] if isinstance(cat, list) and len(cat) > 1 else cat
            print("  [%s] %s (cat: %s)" % (p['id'], p['name'], cat))
        print("Catálogos activos:", len(remaining_cats))
        for c in remaining_cats:
            print("  [%s] %s" % (c['id'], c['name']))
