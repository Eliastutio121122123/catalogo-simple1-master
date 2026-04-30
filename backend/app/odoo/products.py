from .client import odoo

PRODUCT_FIELDS = [
    "id",
    "name",
    "list_price",
    "description_sale",
    "description",
    "categ_id",
    "qty_available",
    "catalog_stock_qty",
    "catalog_id",
    "default_code",
    "active",
    "standard_price",
    "product_variant_ids",
    "attribute_line_ids",
    "image_1920",
]

_RES_PARTNER_FIELDS: list[str] | None = None


def _res_partner_fields() -> list[str]:
    global _RES_PARTNER_FIELDS
    if _RES_PARTNER_FIELDS is not None:
        return _RES_PARTNER_FIELDS

    try:
        fields = odoo.call("res.partner", "fields_get", [], {}) or {}
    except Exception:
        fields = {}

    partner_fields = ["id", "name", "email", "phone", "image_1920"]
    if "mobile" in fields:
        partner_fields.insert(4, "mobile")

    _RES_PARTNER_FIELDS = partner_fields
    return partner_fields


def _image_to_data_url(image_1920) -> str:
    """Convert an Odoo binary base64 field into a browser-friendly data URL."""
    if not image_1920:
        return ""
    # When Odoo context uses bin_size=True it may return a size-only value like "12345".
    if isinstance(image_1920, str) and (not image_1920.isdigit()):
        return f"data:image/*;base64,{image_1920}"
    return ""


def _attach_image(row: dict) -> dict:
    out = dict(row or {})
    image_1920 = out.get("image_1920")
    if image_1920 and not out.get("image_url"):
        out["image_url"] = _image_to_data_url(image_1920)
    return out


def _attach_product_images(product: dict) -> dict:
    """Attach `image_urls` (main + extra images) for product detail views."""
    out = dict(product or {})
    product_id = int(out.get("id") or 0)
    if product_id <= 0:
        out["image_urls"] = []
        return out

    urls: list[str] = []
    main_url = out.get("image_url") or _image_to_data_url(out.get("image_1920"))
    if main_url:
        urls.append(str(main_url))

    try:
        rows = odoo.call(
            "product.image",
            "search_read",
            [[["product_tmpl_id", "=", product_id]]],
            {
                "fields": ["id", "sequence", "image_1920"],
                "order": "sequence,id",
                "context": {"bin_size": False},
                "limit": 50,
            },
        ) or []
    except Exception:
        rows = []

    for row in rows:
        url = _image_to_data_url((row or {}).get("image_1920"))
        if url and url not in urls:
            urls.append(url)

    out["image_urls"] = urls
    return out


def _attach_vendor(product: dict) -> dict:
    out = dict(product or {})
    catalog = out.get("catalog_id") or []
    catalog_id = None
    if isinstance(catalog, (list, tuple)) and catalog:
        catalog_id = int(catalog[0])
    elif isinstance(catalog, int):
        catalog_id = int(catalog)

    if not catalog_id:
        return out

    try:
        catalog_rows = odoo.read("catalog.catalog", [catalog_id], ["vendor_id"])
        if not catalog_rows:
            return out
        vendor_pair = catalog_rows[0].get("vendor_id") or []
        vendor_id = int(vendor_pair[0]) if vendor_pair else None
        if not vendor_id:
            return out

        partner_rows = odoo.call(
            "res.partner",
            "read",
            [[vendor_id]],
            {"fields": _res_partner_fields(), "context": {"bin_size": False}},
        ) or []
        if not partner_rows:
            return out
        partner = partner_rows[0]
        image_1920 = partner.get("image_1920")
        image_url = ""
        image_url = _image_to_data_url(image_1920)

        out["vendor"] = {
            "id": partner.get("id"),
            "name": partner.get("name") or "",
            "email": partner.get("email") or "",
            "phone": partner.get("mobile") or partner.get("phone") or "",
            "image_url": image_url,
        }
        return out
    except Exception:
        return out


def _attach_reviews(rows: list) -> list:
    if not rows:
        return []
    product_ids = [int(r["id"]) for r in rows if r.get("id")]
    if not product_ids:
        return rows

    try:
        reviews = odoo.call(
            "catalog.review",
            "search_read",
            [[["product_tmpl_id", "in", product_ids], ["state", "=", "approved"]]],
            {"fields": ["product_tmpl_id", "rating"], "context": {"bin_size": False}},
        ) or []
    except Exception:
        reviews = []

    agg = {}
    for rv in reviews:
        pid = rv.get("product_tmpl_id")
        if isinstance(pid, (list, tuple)) and pid:
            pid = pid[0]
        if not pid:
            continue
        agg.setdefault(pid, {"total": 0, "sum": 0})
        agg[pid]["total"] += 1
        agg[pid]["sum"] += int(rv.get("rating") or 0)

    for r in rows:
        pid = r.get("id")
        stat = agg.get(pid)
        if stat and stat["total"] > 0:
            r["rating"] = round(stat["sum"] / stat["total"], 2)
            r["reviews"] = stat["total"]
        else:
            r["rating"] = 0
            r["reviews"] = 0

    return rows


def _attach_promotions(rows: list) -> list:
    if not rows:
        return rows

    catalog_ids = []
    for r in rows:
        c_id = r.get("catalog_id")
        if isinstance(c_id, (list, tuple)) and c_id:
            catalog_ids.append(int(c_id[0]))
        elif isinstance(c_id, int):
            catalog_ids.append(c_id)

    if not catalog_ids:
        return rows

    catalog_ids = list(set(catalog_ids))
    try:
        catalogs = odoo.read("catalog.catalog", catalog_ids, ["vendor_id"])
        vendor_ids = []
        catalog_to_vendor = {}
        for c in catalogs:
            v_pair = c.get("vendor_id")
            if isinstance(v_pair, (list, tuple)) and v_pair:
                v_id = int(v_pair[0])
                vendor_ids.append(v_id)
                catalog_to_vendor[c["id"]] = v_id

        if not vendor_ids:
            return rows

        vendor_ids = list(set(vendor_ids))
        from datetime import date
        today_str = date.today().isoformat()

        promos = odoo.call(
            "catalog.promotion",
            "search_read",
            [[
                ["vendor_partner_id", "in", vendor_ids],
                ["status", "=", "active"],
            ]],
            {"fields": ["vendor_partner_id", "promotion_type", "value", "min_order_amount", "end_date", "start_date"]}
        ) or []

        valid_promos = {}
        for p in promos:
            if p.get("start_date") and p["start_date"] > today_str:
                continue
            if p.get("end_date") and p["end_date"] < today_str:
                continue
            
            min_order = float(p.get("min_order_amount") or 0)
            if min_order > 0:
                continue

            v_pair = p.get("vendor_partner_id")
            v_id = int(v_pair[0]) if isinstance(v_pair, (list, tuple)) and v_pair else None
            if not v_id:
                continue

            if v_id not in valid_promos:
                valid_promos[v_id] = []
            valid_promos[v_id].append(p)

    except Exception:
        return rows

    for r in rows:
        c_id = r.get("catalog_id")
        c_id = int(c_id[0]) if isinstance(c_id, (list, tuple)) and c_id else c_id
        if not c_id:
            continue

        v_id = catalog_to_vendor.get(c_id)
        if not v_id or v_id not in valid_promos:
            continue

        best_discount = 0
        original = float(r.get("list_price") or 0)

        for p in valid_promos[v_id]:
            val = float(p.get("value") or 0)
            if p.get("promotion_type") == "percent":
                disc = original * (val / 100.0)
            else:
                disc = val

            if disc > best_discount and disc < original:
                best_discount = disc

        if best_discount > 0:
            r["original_price"] = original
            r["list_price"] = original - best_discount

    return rows


def _search_read(domain: list, limit=50, offset=0) -> list:
    rows = odoo.call(
        "product.template",
        "search_read",
        [domain],
        {
            "fields": PRODUCT_FIELDS,
            "limit": limit,
            "offset": offset,
            "context": {"bin_size": False},
        },
    ) or []
    return _attach_promotions(_attach_reviews([_attach_image(row) for row in rows]))


class ProductService:
    @staticmethod
    def list_products(domain=None, limit=50, offset=0) -> list:
        base_domain = list(domain) if domain else [["sale_ok", "=", True]]
        base_domain.append(["catalog_id.active", "=", True])
        return _search_read(base_domain, limit=limit, offset=offset)

    @staticmethod
    def get_by_id(product_id: int) -> dict:
        results = _search_read([["id", "=", product_id], ["catalog_id.active", "=", True]], limit=1, offset=0)
        if not results:
            raise LookupError(f"Product {product_id} not found")
        # For detail views we include vendor info and all product images.
        return _attach_product_images(_attach_vendor(results[0]))

    @staticmethod
    def search(query: str, filters: dict | None = None, limit=50, offset=0) -> list:
        domain = [["name", "ilike", query]]
        if filters:
            if filters.get("category"):
                domain.append(["categ_id.name", "=", filters["category"]])
            if filters.get("min_price"):
                domain.append(["list_price", ">=", float(filters["min_price"])])
            if filters.get("max_price"):
                domain.append(["list_price", "<=", float(filters["max_price"])])
        
        domain.append(["catalog_id.active", "=", True])
        return _search_read(domain, limit=limit, offset=offset)


# Backwards-compatible helpers
def get_products(domain=None, limit=50, offset=0) -> list:
    return ProductService.list_products(domain=domain, limit=limit, offset=offset)


def get_product_by_id(product_id: int) -> dict:
    return ProductService.get_by_id(product_id)


def search_products(query: str, filters: dict = None, limit=50, offset=0) -> list:
    return ProductService.search(query, filters, limit=limit, offset=offset)
