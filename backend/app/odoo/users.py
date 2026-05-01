from .client import odoo

USER_FIELDS_BASE = ["id", "name", "email", "phone", "partner_id", "login", "image_128"]
_GROUPS_FIELD = None

ROLE_VENDOR = "vendor"
ROLE_CUSTOMER = "customer"
ROLE_ADMIN = "admin"

XMLID_BASE_INTERNAL = "base.group_user"
XMLID_BASE_PORTAL = "base.group_portal"
XMLID_ADMIN_CANDIDATES = [
    "base.group_system",
    "base.group_erp_manager",
]
XMLID_VENDOR_CANDIDATES = [
    "odoo_module.group_vendor",
]
XMLID_SALES_CATEGORY_CANDIDATES = [
    "sales_team.module_category_sales_management",
    "sale.module_category_sales_management",
    "sale_management.module_category_sales_management",
]


class UserAlreadyExistsError(ValueError):
    pass


def normalize_email(email: str) -> str:
    return email.strip().lower()


def _xmlid_to_group_id(xmlid: str) -> int | None:
    if "." not in xmlid:
        return None
    module, name = xmlid.split(".", 1)
    rows = odoo.search_read(
        "ir.model.data",
        [["module", "=", module], ["name", "=", name], ["model", "=", "res.groups"]],
        ["res_id"],
        limit=1,
    )
    if not rows:
        return None
    return int(rows[0]["res_id"])


def _xmlid_to_record_id(xmlid: str, model: str) -> int | None:
    if "." not in xmlid:
        return None
    module, name = xmlid.split(".", 1)
    rows = odoo.search_read(
        "ir.model.data",
        [["module", "=", module], ["name", "=", name], ["model", "=", model]],
        ["res_id"],
        limit=1,
    )
    if not rows:
        return None
    return int(rows[0]["res_id"])


def _sales_category_id() -> int | None:
    for xmlid in XMLID_SALES_CATEGORY_CANDIDATES:
        cid = _xmlid_to_record_id(xmlid, "ir.module.category")
        if cid:
            return cid
    return None


def _sales_group_ids_from_category() -> list[int]:
    category_id = _sales_category_id()
    if not category_id:
        return []
    rows = odoo.search_read(
        "res.groups",
        [["category_id", "=", category_id]],
        ["id", "name"],
        limit=200,
    )
    if not rows:
        return []
    return [int(row["id"]) for row in rows if row.get("id")]


def _pick_vendor_group_from_category() -> int | None:
    category_id = _sales_category_id()
    if not category_id:
        return None
    rows = odoo.search_read(
        "res.groups",
        [["category_id", "=", category_id]],
        ["id", "name"],
        limit=200,
    )
    if not rows:
        return None

    # Prefer the most restrictive "user" sales group instead of manager/admin.
    candidates = sorted(rows, key=lambda r: int(r.get("id") or 0))
    filtered = []
    for row in candidates:
        name = str(row.get("name") or "").lower()
        if "manager" in name or "admin" in name or "administrador" in name:
            continue
        filtered.append(row)
    chosen = filtered[0] if filtered else candidates[0]
    return int(chosen["id"]) if chosen and chosen.get("id") else None


class RoleGroupsResolver:
    @staticmethod
    def resolve(role: str) -> list[int]:
        normalized_role = (role or ROLE_CUSTOMER).strip().lower()

        if normalized_role == ROLE_ADMIN:
            group_ids = []
            internal_group = _xmlid_to_group_id(XMLID_BASE_INTERNAL)
            if internal_group:
                group_ids.append(internal_group)
            for xmlid in XMLID_ADMIN_CANDIDATES:
                gid = _xmlid_to_group_id(xmlid)
                if gid:
                    group_ids.append(gid)
                    break
            return sorted(set(group_ids))

        if normalized_role == ROLE_VENDOR:
            group_ids = []
            internal_group = _xmlid_to_group_id(XMLID_BASE_INTERNAL)
            if internal_group:
                group_ids.append(internal_group)
            for xmlid in XMLID_VENDOR_CANDIDATES:
                gid = _xmlid_to_group_id(xmlid)
                if gid:
                    group_ids.append(gid)
                    break
            return sorted(set(group_ids))

        portal_group = _xmlid_to_group_id(XMLID_BASE_PORTAL)
        return [portal_group] if portal_group else []


def _resolve_role_groups(role: str) -> list[int]:
    return RoleGroupsResolver.resolve(role)


def _ensure_vendor_internal(uid: int) -> None:
    """Make sure vendor users are internal and not in portal group."""
    portal_gid = _xmlid_to_group_id(XMLID_BASE_PORTAL)
    updates = {"share": False}
    if portal_gid:
        updates[_groups_field_name()] = [(3, portal_gid)]
    odoo.write("res.users", [uid], updates)


class RoleResolver:
    _ADMIN_GROUP_IDS: set[int] | None = None

    @staticmethod
    def admin_group_ids() -> set[int]:
        if RoleResolver._ADMIN_GROUP_IDS is not None:
            return RoleResolver._ADMIN_GROUP_IDS
        ids: set[int] = set()
        for xmlid in XMLID_ADMIN_CANDIDATES:
            gid = _xmlid_to_group_id(xmlid)
            if gid:
                ids.add(int(gid))
        RoleResolver._ADMIN_GROUP_IDS = ids
        return ids

    @staticmethod
    def is_admin(group_ids: list[int] | set[int] | None) -> bool:
        ids = set(int(gid) for gid in (group_ids or []))
        return bool(ids.intersection(RoleResolver.admin_group_ids()))

    @staticmethod
    def role_from_groups(group_ids: list[int] | None) -> str:
        ids = set(int(gid) for gid in (group_ids or []))
        if RoleResolver.is_admin(ids):
            return ROLE_ADMIN
        for xmlid in XMLID_VENDOR_CANDIDATES:
            gid = _xmlid_to_group_id(xmlid)
            if gid and gid in ids:
                return ROLE_VENDOR
        sales_group_ids = set(_sales_group_ids_from_category())
        if ids.intersection(sales_group_ids):
            return ROLE_VENDOR
        return ROLE_CUSTOMER


def _groups_field_name() -> str:
    global _GROUPS_FIELD
    if _GROUPS_FIELD:
        return _GROUPS_FIELD

    try:
        fields = odoo.call("res.users", "fields_get", [], {"attributes": ["type"]})
    except Exception:
        fields = {}

    if "group_ids" in fields:
        _GROUPS_FIELD = "group_ids"
    elif "groups_id" in fields:
        _GROUPS_FIELD = "groups_id"
    else:
        _GROUPS_FIELD = "group_ids"

    return _GROUPS_FIELD


def _user_fields() -> list[str]:
    return USER_FIELDS_BASE + [_groups_field_name()]


def _normalize_user(user: dict) -> dict:
    out = dict(user)
    groups = out.get(_groups_field_name()) or out.get("group_ids") or out.get("groups_id") or []
    out["role"] = RoleResolver.role_from_groups(groups)
    return out


def get_user_by_id(uid: int) -> dict:
    results = odoo.search_read("res.users", [["id", "=", uid]], _user_fields(), limit=1)
    if not results:
        raise LookupError(f"User {uid} not found")
    return _normalize_user(results[0])


def get_user_by_email(email: str) -> dict | None:
    normalized = normalize_email(email)
    results = odoo.search_read(
        "res.users",
        ["|", ["login", "=", normalized], ["email", "=", normalized]],
        _user_fields(),
        limit=1,
    )
    return _normalize_user(results[0]) if results else None


def create_user(
    name: str,
    email: str,
    password: str,
    role: str = ROLE_CUSTOMER,
    phone: str | None = None,
    company: str | None = None,
) -> int:
    normalized = normalize_email(email)
    if get_user_by_email(normalized):
        raise UserAlreadyExistsError("Email is already registered")

    values = {
        "name": name.strip(),
        "login": normalized,
        "email": normalized,
        "password": password,
    }
    if phone:
        values["phone"] = str(phone).strip()
    if company:
        values["company_name"] = str(company).strip()

    groups = _resolve_role_groups(role)
    if groups:
        values[_groups_field_name()] = [(6, 0, groups)]
    normalized_role = (role or "").strip().lower()
    if normalized_role == ROLE_CUSTOMER:
        values["share"] = True
    elif normalized_role in {ROLE_VENDOR, ROLE_ADMIN}:
        values["share"] = False

    uid = odoo.create("res.users", values)

    if groups:
        # Ensure groups are applied after creation as well.
        odoo.write("res.users", [uid], {_groups_field_name(): [(6, 0, groups)]})

    # Safety pass: if vendor was requested and role still resolves as customer,
    # apply a fallback sales group using category lookup.
    if (role or "").strip().lower() == ROLE_VENDOR:
        _ensure_vendor_internal(uid)
        _ensure_vendor_profile(uid, store_name=company or name)
        created = get_user_by_id(uid)
        if created.get("role") != ROLE_VENDOR:
            fallback_gid = _pick_vendor_group_from_category()
            if fallback_gid:
                odoo.write("res.users", [uid], {_groups_field_name(): [(4, fallback_gid)]})
    else:
        _ensure_customer_profile(uid)

    return uid


def _ensure_vendor_profile(uid: int, store_name: str | None = None) -> None:
    user_rows = odoo.read("res.users", [uid], ["partner_id", "name", "email", "phone"])
    if not user_rows:
        return
    user = user_rows[0]
    partner = user.get("partner_id") or []
    partner_id = int(partner[0]) if partner else None
    if not partner_id:
        return

    partner_rows = odoo.read("res.partner", [partner_id], ["supplier_rank"])
    supplier_rank = 0
    if partner_rows:
        supplier_rank = int(partner_rows[0].get("supplier_rank") or 0)
    if supplier_rank < 1:
        odoo.write("res.partner", [partner_id], {"supplier_rank": 1})

    existing = odoo.search("catalog.vendor", [["partner_id", "=", partner_id]])
    if existing:
        return

    vendor_name = (store_name or user.get("name") or "Vendor").strip()
    odoo.create("catalog.vendor", {
        "partner_id": partner_id,
        "user_id": uid,
        "store_name": vendor_name,
        "status": "pending",
    })


def _ensure_customer_profile(uid: int) -> None:
    user_rows = odoo.read("res.users", [uid], ["partner_id", "name", "email", "phone"])
    if not user_rows:
        return
    user = user_rows[0]
    partner = user.get("partner_id") or []
    partner_id = int(partner[0]) if partner else None
    if not partner_id:
        return

    partner_rows = odoo.read("res.partner", [partner_id], ["customer_rank"])
    customer_rank = 0
    if partner_rows:
        customer_rank = int(partner_rows[0].get("customer_rank") or 0)
    if customer_rank < 1:
        odoo.write("res.partner", [partner_id], {"customer_rank": 1})

    existing = odoo.search("catalog.customer", [["partner_id", "=", partner_id]])
    if existing:
        return

    odoo.create("catalog.customer", {
        "partner_id": partner_id,
        "user_id": uid,
        "status": "active",
    })


def update_user(uid: int, values: dict) -> bool:
    # Extract password before write() to handle it via the correct Odoo API.
    new_password = values.pop("password", None)

    if "email" in values and values["email"]:
        values["email"] = normalize_email(values["email"])
    avatar_payload = None
    for key in ("avatar", "avatarUrl", "image"):
        if key in values:
            avatar_payload = values.pop(key)
            break
    if avatar_payload is not None:
        if isinstance(avatar_payload, str) and avatar_payload.startswith("data:"):
            parts = avatar_payload.split(",", 1)
            avatar_payload = parts[1] if len(parts) > 1 else ""
        values["image_1920"] = avatar_payload or False

    # Change password: Odoo 17+ ignores write({'password': ...}) via external RPC
    # sessions for security reasons. We need to call the Odoo web endpoint that
    # sets the password using sudo context. The reliable approach is to call
    # `res.users` `write` with `password` through a call that forces sudo.
    if new_password:
        # First attempt: call write with password field — works if Odoo config allows it
        written = odoo.write("res.users", [uid], {"password": new_password})
        # Verify the password was actually saved by trying to authenticate with it.
        # If it wasn't (Odoo silently ignored it), use the fallback approach.
        if written:
            try:
                from .auth import login as _odoo_login
                user_row = odoo.search_read(
                    "res.users", [["id", "=", uid]], ["login"], limit=1
                )
                login_val = (user_row[0].get("login") or "") if user_row else ""
                if login_val:
                    _odoo_login(login_val, new_password)
                    # Authentication succeeded — password was saved correctly
                    if values:
                        return odoo.write("res.users", [uid], values)
                    return True
            except PermissionError:
                pass  # Password was NOT saved, fall through to alternative
            except Exception:
                pass  # Ignore verification errors

        # Fallback: use passlib (bundled with Odoo) to hash and write password_crypt
        try:
            import importlib
            crypt_ctx = importlib.import_module("passlib.context").CryptContext(
                schemes=["pbkdf2_sha512"], deprecated="auto"
            )
            hashed = crypt_ctx.hash(new_password)
            odoo.write("res.users", [uid], {"password_crypt": hashed})
        except Exception as exc:
            raise RuntimeError(
                f"No se pudo cambiar la contraseña en Odoo (uid={uid}): {exc}"
            ) from exc

    if values:
        return odoo.write("res.users", [uid], values)
    return True


class UserService:
    @staticmethod
    def resolve_partner_id(uid: int) -> int | None:
        rows = odoo.read("res.users", [uid], ["partner_id", "login", "email", "name", "phone"])
        if not rows:
            return None
        user = rows[0]
        partner = user.get("partner_id") or []
        if partner:
            return int(partner[0])

        login = normalize_email(user.get("login") or "")
        email = normalize_email(user.get("email") or "")
        domain = ["|", ["email", "=", login], ["email", "=", email]]
        partners = odoo.search_read("res.partner", domain, ["id"], limit=1)
        if partners:
            partner_id = int(partners[0]["id"])
            odoo.write("res.users", [uid], {"partner_id": partner_id})
            return partner_id

        # Last resort: create a partner and link it.
        partner_vals = {
            "name": user.get("name") or login or email or f"User {uid}",
            "email": email or login,
        }
        if user.get("phone"):
            partner_vals["phone"] = user.get("phone")
        partner_id = odoo.create("res.partner", partner_vals)
        odoo.write("res.users", [uid], {"partner_id": partner_id})
        return int(partner_id)

    @staticmethod
    def resolve_vendor_partner_id(uid: int) -> int | None:
        """Return partner_id if the user has a vendor record."""
        # Prefer vendor linked by user_id
        rows = odoo.search_read(
            "catalog.vendor",
            [["user_id", "=", uid]],
            ["partner_id"],
            limit=1,
        )
        if rows:
            partner = rows[0].get("partner_id") or []
            if partner:
                return int(partner[0])

        # Fallback: resolve partner and check vendor by partner_id
        partner_id = UserService.resolve_partner_id(uid)
        if not partner_id:
            return None
        rows = odoo.search_read(
            "catalog.vendor",
            [["partner_id", "=", partner_id]],
            ["partner_id"],
            limit=1,
        )
        if rows:
            partner = rows[0].get("partner_id") or []
            if partner:
                return int(partner[0])
        return None


def resolve_partner_id(uid: int) -> int | None:
    return UserService.resolve_partner_id(uid)
