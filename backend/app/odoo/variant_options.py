import re

from .client import odoo

_HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")

_ATTR_FIELDS: list[str] | None = None
_ATTR_VALUE_FIELDS: list[str] | None = None


def _attribute_fields() -> list[str]:
    global _ATTR_FIELDS
    if _ATTR_FIELDS is not None:
        return _ATTR_FIELDS
    try:
        fields = odoo.call("product.attribute", "fields_get", [], {}) or {}
    except Exception:
        fields = {}

    out = ["id", "name"]
    if "display_type" in fields:
        out.append("display_type")
    _ATTR_FIELDS = out
    return out


def _attribute_value_fields() -> list[str]:
    global _ATTR_VALUE_FIELDS
    if _ATTR_VALUE_FIELDS is not None:
        return _ATTR_VALUE_FIELDS
    try:
        fields = odoo.call("product.attribute.value", "fields_get", [], {}) or {}
    except Exception:
        fields = {}

    out = ["id", "name"]
    if "html_color" in fields:
        out.append("html_color")
    _ATTR_VALUE_FIELDS = out
    return out


def _dedupe_keep_order(items: list) -> list:
    out = []
    seen = set()
    for item in items:
        key = item if isinstance(item, (str, int, float, bool, type(None))) else str(item)
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def _norm(s: str | None) -> str:
    return (s or "").strip().lower()


_COLOR_NAMES = {"color", "colour", "colores"}
_SIZE_NAMES = {"size", "talla", "tamaño", "tamano", "tallas"}


def _is_color_attribute(attr_name: str | None, display_type: str | None) -> bool:
    if _norm(display_type) == "color":
        return True
    return _norm(attr_name) in _COLOR_NAMES


def _is_size_attribute(attr_name: str | None) -> bool:
    return _norm(attr_name) in _SIZE_NAMES


def _value_hex(val: dict | None) -> str | None:
    if not val:
        return None
    html_color = val.get("html_color")
    if isinstance(html_color, str) and _HEX_RE.match(html_color.strip()):
        return html_color.strip()
    name = str(val.get("name") or "").strip()
    if _HEX_RE.match(name):
        return name
    return None


def _value_name(val: dict | None) -> str:
    if not val:
        return ""
    name = str(val.get("name") or "").strip()
    return name


def attach_variant_options(product: dict) -> dict:
    """
    Attach normalized variant options for store/product detail UIs.

    Adds:
      - colors: [{id, name, hex}]
      - sizes:  [str]
      - attributes: [{id, name, values:[{id,name,hex?}]}]
    """
    out = dict(product or {})
    line_ids = out.get("attribute_line_ids") or []
    if not isinstance(line_ids, list) or not line_ids:
        out["colors"] = [{"id": "default", "name": "Estándar", "hex": "#94a3b8"}]
        out["sizes"] = ["Único"]
        out["attributes"] = []
        return out

    try:
        lines = odoo.read("product.template.attribute.line", line_ids, ["id", "attribute_id", "value_ids"]) or []
    except Exception:
        lines = []

    attr_ids: list[int] = []
    all_value_ids: list[int] = []
    for ln in lines:
        pair = (ln or {}).get("attribute_id") or []
        if isinstance(pair, (list, tuple)) and pair:
            try:
                attr_ids.append(int(pair[0]))
            except Exception:
                pass
        for vid in (ln or {}).get("value_ids") or []:
            try:
                all_value_ids.append(int(vid))
            except Exception:
                pass

    attr_ids = _dedupe_keep_order([i for i in attr_ids if isinstance(i, int)])
    all_value_ids = _dedupe_keep_order([i for i in all_value_ids if isinstance(i, int)])

    attributes_map: dict[int, dict] = {}
    if attr_ids:
        try:
            attrs = odoo.read("product.attribute", attr_ids, _attribute_fields()) or []
        except Exception:
            attrs = []
        for a in attrs:
            try:
                attributes_map[int(a.get("id"))] = a
            except Exception:
                continue

    value_map: dict[int, dict] = {}
    if all_value_ids:
        try:
            values = odoo.read("product.attribute.value", all_value_ids, _attribute_value_fields()) or []
        except Exception:
            values = []
        for v in values:
            try:
                value_map[int(v.get("id"))] = v
            except Exception:
                continue

    attributes_out: list[dict] = []
    colors: list[dict] = []
    sizes: list[str] = []

    for ln in lines:
        ln = ln or {}
        attr_pair = ln.get("attribute_id") or []
        attr_id = None
        attr_name = None
        if isinstance(attr_pair, (list, tuple)) and attr_pair:
            try:
                attr_id = int(attr_pair[0])
            except Exception:
                attr_id = None
            attr_name = str(attr_pair[1]) if len(attr_pair) > 1 else None

        display_type = None
        if attr_id and attr_id in attributes_map:
            display_type = attributes_map[attr_id].get("display_type")
            if not attr_name:
                attr_name = attributes_map[attr_id].get("name")

        value_ids = ln.get("value_ids") or []
        values_out: list[dict] = []
        for vid in value_ids:
            try:
                vid_int = int(vid)
            except Exception:
                continue
            val = value_map.get(vid_int) or {}
            name = _value_name(val)
            hex_color = _value_hex(val)
            entry = {"id": vid_int, "name": name}
            if hex_color:
                entry["hex"] = hex_color
            values_out.append(entry)

            if _is_color_attribute(attr_name, display_type):
                colors.append(
                    {
                        "id": str(vid_int),
                        "name": name if not _HEX_RE.match(name) else name.upper(),
                        "hex": hex_color or "#94a3b8",
                    }
                )
            elif _is_size_attribute(attr_name):
                if name:
                    sizes.append(name)

        if attr_id or attr_name:
            attributes_out.append(
                {
                    "id": attr_id,
                    "name": attr_name or "",
                    "values": values_out,
                }
            )

    colors = _dedupe_keep_order(colors)
    sizes = _dedupe_keep_order([s for s in sizes if isinstance(s, str) and s.strip()])

    out["attributes"] = attributes_out
    out["colors"] = colors or [{"id": "default", "name": "Estándar", "hex": "#94a3b8"}]
    out["sizes"] = sizes or ["Único"]
    return out

