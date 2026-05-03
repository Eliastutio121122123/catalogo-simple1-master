"""
Script para completar la configuracion contable en Odoo 19.
Crea cuentas receivable/payable y asigna a partner y productos restantes.
"""
import requests
import sys

ODOO_URL = "http://localhost:8069"
ODOO_DB = "catalogix"
ODOO_USER = "admin"
ODOO_PASSWORD = "admin"

_req_id = 0

def rpc(session, endpoint, params):
    global _req_id
    _req_id += 1
    resp = session.post(
        f"{ODOO_URL}{endpoint}",
        json={"jsonrpc": "2.0", "method": "call", "id": _req_id, "params": params},
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    data = resp.json()
    if "error" in data:
        msg = data["error"].get("data", {}).get("message") or data["error"].get("message", "Unknown")
        raise RuntimeError(f"Odoo: {msg}")
    return data.get("result")

def call(s, model, method, args, kwargs=None):
    return rpc(s, "/web/dataset/call_kw", {
        "model": model, "method": method, "args": args, "kwargs": kwargs or {},
    })

def sr(s, model, domain, fields, limit=100):
    return call(s, model, "search_read", [domain], {"fields": fields, "limit": limit}) or []

def find_or_create_account(s, code, name, account_type, reconcile=False):
    existing = sr(s, "account.account", [["account_type", "=", account_type]], ["id"], limit=1)
    if existing:
        print(f"   Cuenta '{account_type}' ya existe (ID: {existing[0]['id']})")
        return existing[0]["id"]
    vals = {"code": code, "name": name, "account_type": account_type}
    if reconcile:
        vals["reconcile"] = True
    try:
        aid = call(s, "account.account", "create", [vals])
        print(f"   Cuenta '{name}' creada (ID: {aid})")
        return aid
    except Exception as e:
        print(f"   Error creando '{name}': {e}")
        return None

def main():
    s = requests.Session()
    
    print("1. Autenticando...")
    result = rpc(s, "/web/session/authenticate", {
        "db": ODOO_DB, "login": ODOO_USER, "password": ODOO_PASSWORD,
    })
    uid = result.get("uid") if result else None
    if not uid:
        print(" FALLO autenticacion")
        sys.exit(1)
    print(f"   OK (UID: {uid})")

    # Load generic chart of accounts
    print("\n2. Intentando cargar Plan de Cuentas generico...")
    try:
        companies = sr(s, "res.company", [], ["id", "name", "chart_template"], limit=1)
        company_id = companies[0]["id"] if companies else 1
        print(f"   Company: {companies[0].get('name')} (chart_template: {companies[0].get('chart_template')})")
        
        if not companies[0].get("chart_template"):
            # In Odoo 17+/19, try_loading is a classmethod: try_loading(template_code, company)
            try:
                call(s, "account.chart.template", "try_loading", ["generic", company_id])
                print("   Plan de cuentas 'generic' cargado!")
            except Exception as e:
                err = str(e)
                if "not allowed" in err.lower():
                    # Try via sudo/different approach
                    print(f"   Sin acceso a chart.template, creando cuentas manualmente...")
                else:
                    print(f"   Error: {e}")
    except Exception as e:
        print(f"   Error: {e}")

    # List all current accounts
    print("\n3. Cuentas actuales:")
    accounts = sr(s, "account.account", [], ["id", "code", "name", "account_type", "reconcile"], limit=50)
    for a in accounts:
        print(f"   [{a.get('code')}] {a.get('name')} | type={a.get('account_type')} | reconcile={a.get('reconcile')}")

    account_types_present = {a.get("account_type") for a in accounts}
    print(f"\n   Tipos presentes: {account_types_present}")

    # Create missing critical accounts
    print("\n4. Creando cuentas faltantes...")
    
    required_accounts = [
        ("100000", "Accounts Receivable",    "asset_receivable", True),
        ("200000", "Accounts Payable",       "liability_payable", True),
        ("101000", "Bank",                   "asset_cash", False),
        ("101010", "Cash",                   "asset_cash", False),
        ("300000", "Equity",                 "equity", False),
        ("999999", "Undistributed P&L",      "equity_unaffected", False),
        ("400000", "Product Sales",          "income", False),
        ("600000", "Cost of Goods Sold",     "expense", False),
    ]

    account_ids = {}
    for code, name, atype, reconcile in required_accounts:
        aid = find_or_create_account(s, code, name, atype, reconcile)
        if aid:
            account_ids[atype] = aid

    # 5. Set receivable/payable on partners
    receivable_id = account_ids.get("asset_receivable")
    payable_id = account_ids.get("liability_payable")

    if receivable_id and payable_id:
        print("\n5. Asignando cuentas receivable/payable a partners...")
        partners = sr(s, "res.partner", [], [
            "id", "name", "property_account_receivable_id", "property_account_payable_id"
        ], limit=200)
        updated = 0
        for p in partners:
            updates = {}
            if not p.get("property_account_receivable_id"):
                updates["property_account_receivable_id"] = receivable_id
            if not p.get("property_account_payable_id"):
                updates["property_account_payable_id"] = payable_id
            if updates:
                try:
                    call(s, "res.partner", "write", [[p["id"]], updates])
                    updated += 1
                except Exception as e:
                    print(f"   Error en partner '{p.get('name')}': {e}")
        print(f"   {updated} partners actualizados de {len(partners)}")

    # 6. Set income/expense on ALL products (including the 2 that failed)
    income_id = account_ids.get("income")
    expense_id = account_ids.get("expense")
    if income_id and expense_id:
        print("\n6. Asignando cuentas a TODOS los productos...")
        products = sr(s, "product.template", [], [
            "id", "name", "property_account_income_id", "property_account_expense_id"
        ], limit=5000)
        updated = 0
        for prod in products:
            updates = {}
            if not prod.get("property_account_income_id"):
                updates["property_account_income_id"] = income_id
            if not prod.get("property_account_expense_id"):
                updates["property_account_expense_id"] = expense_id
            if updates:
                try:
                    call(s, "product.template", "write", [[prod["id"]], updates])
                    updated += 1
                except Exception as e:
                    print(f"   Error en '{prod.get('name')}': {e}")
        print(f"   {updated} productos actualizados de {len(products)}")
    
    # 7. Set default accounts on journal
    print("\n7. Configurando diario de ventas...")
    journals = sr(s, "account.journal", [["type", "=", "sale"]], [
        "id", "name", "default_account_id"
    ], limit=1)
    if journals:
        j = journals[0]
        if not j.get("default_account_id") and income_id:
            try:
                call(s, "account.journal", "write", [[j["id"]], {"default_account_id": income_id}])
                print(f"   Cuenta default asignada al diario '{j.get('name')}'")
            except Exception as e:
                print(f"   Error: {e}")
        else:
            print(f"   Diario '{j.get('name')}' ya tiene cuenta default")

    # 8. Verify bank/cash journal accounts
    print("\n8. Configurando diarios bank/cash...")
    cash_account = account_ids.get("asset_cash")
    if cash_account:
        for jtype in ["bank", "cash"]:
            js = sr(s, "account.journal", [["type", "=", jtype]], ["id", "name", "default_account_id"], limit=1)
            if js and not js[0].get("default_account_id"):
                try:
                    call(s, "account.journal", "write", [[js[0]["id"]], {"default_account_id": cash_account}])
                    print(f"   Cuenta asignada a diario '{js[0].get('name')}'")
                except Exception as e:
                    print(f"   Error: {e}")

    # 9. Final check - list all accounts
    print("\n9. Estado final de cuentas:")
    accounts = sr(s, "account.account", [], ["id", "code", "name", "account_type"], limit=50)
    for a in accounts:
        print(f"   [{a.get('code')}] {a.get('name')} -> {a.get('account_type')}")

    print("\n" + "="*60)
    print("CONFIGURACION COMPLETADA")
    print("="*60)
    print("\nPrueba hacer el pago de nuevo en tu pagina.")

if __name__ == "__main__":
    main()
