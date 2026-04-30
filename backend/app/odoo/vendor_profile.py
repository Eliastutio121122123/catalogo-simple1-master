from .client import odoo
from .users import UserService, get_user_by_id

VENDOR_FIELDS = [
    "id",
    "store_name",
    "status",
    "email",
    "phone",
    "partner_id",
    "user_id",
]


def _get_vendor_record(uid: int) -> dict | None:
    vendor_rows = odoo.search_read(
        "catalog.vendor",
        [["user_id", "=", uid]],
        VENDOR_FIELDS,
        limit=1,
    )
    if vendor_rows:
        return vendor_rows[0]

    partner_id = UserService.resolve_partner_id(uid)
    if not partner_id:
        return None

    vendor_rows = odoo.search_read(
        "catalog.vendor",
        [["partner_id", "=", partner_id]],
        VENDOR_FIELDS,
        limit=1,
    )
    return vendor_rows[0] if vendor_rows else None


def get_vendor_profile(uid: int) -> dict:
    user = get_user_by_id(uid)
    vendor = _get_vendor_record(uid)
    return {"user": user, "vendor": vendor}


def update_vendor_profile(uid: int, payload: dict) -> dict:
    user = get_user_by_id(uid)
    vendor = _get_vendor_record(uid)

    store_name = payload.get("store_name") or payload.get("storeName")
    email = payload.get("email")
    phone = payload.get("phone")

    values = {}
    if store_name is not None:
        values["store_name"] = str(store_name).strip()
    if email is not None:
        values["email"] = str(email).strip()
    if phone is not None:
        values["phone"] = str(phone).strip()

    if values:
        if not vendor:
            partner_id = UserService.resolve_partner_id(uid)
            if not partner_id:
                raise LookupError("Vendor partner not found")
            vendor_id = odoo.create(
                "catalog.vendor",
                {
                    "partner_id": partner_id,
                    "user_id": uid,
                    "store_name": values.get("store_name") or user.get("name") or "Vendedor",
                    "status": "pending",
                },
            )
            if email or phone:
                odoo.write("catalog.vendor", [vendor_id], values)
        else:
            odoo.write("catalog.vendor", [vendor["id"]], values)

    return get_vendor_profile(uid)
