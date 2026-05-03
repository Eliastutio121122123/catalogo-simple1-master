"""
Sube el logo de Catalogix a la empresa principal en Odoo.
El logo se usa en las facturas, cotizaciones y reportes PDF.
"""
import sys
import base64
sys.path.append('/app')
from app import create_app
from app.odoo.client import odoo

LOGO_PATH = "/logo/catalogix.png"   # montado desde el host

app = create_app()
with app.app_context():
    # Leer y codificar el logo en base64
    try:
        with open(LOGO_PATH, "rb") as f:
            logo_b64 = base64.b64encode(f.read()).decode("utf-8")
        print("Logo leido OK (%d bytes en base64)" % len(logo_b64))
    except FileNotFoundError:
        print("ERROR: No se encontro el archivo %s" % LOGO_PATH)
        sys.exit(1)

    # Obtener la empresa principal (id=1 generalmente)
    companies = odoo.call("res.company", "search_read",
        [[]], {"fields": ["id", "name", "logo"], "limit": 5}
    ) or []

    if not companies:
        print("ERROR: No se encontro ninguna empresa en Odoo")
        sys.exit(1)

    company = companies[0]
    print("Empresa encontrada: [id=%s] %s" % (company["id"], company["name"]))

    # Actualizar el logo
    odoo.call("res.company", "write",
        [[company["id"]], {"logo": logo_b64}]
    )
    print("Logo actualizado en Odoo correctamente.")
    print("Las facturas ahora mostraran el logo de Catalogix.")
