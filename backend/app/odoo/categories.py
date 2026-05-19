"""
CRUD service for product categories (product.category in Odoo).
"""
from .client import odoo

CATEGORY_FIELDS = ["id", "name", "parent_id", "complete_name"]


class CategoryService:

    @staticmethod
    def list_all() -> list[dict]:
        """Return all product categories sorted by name."""
        rows = odoo.call(
            "product.category",
            "search_read",
            [[]],
            {"fields": CATEGORY_FIELDS, "order": "complete_name asc"},
        ) or []
        return [_fmt(r) for r in rows]

    @staticmethod
    def get_by_id(category_id: int) -> dict:
        rows = odoo.read("product.category", [category_id], CATEGORY_FIELDS)
        if not rows:
            raise LookupError(f"Category {category_id} not found")
        return _fmt(rows[0])

    @staticmethod
    def create(name: str, parent_id: int | None = None) -> dict:
        name = str(name).strip()
        if not name:
            raise ValueError("El nombre de la categoría es obligatorio")

        # Check for duplicates at the same parent level
        domain = [["name", "=", name]]
        if parent_id:
            domain.append(["parent_id", "=", int(parent_id)])
        else:
            domain.append(["parent_id", "=", False])

        existing = odoo.call(
            "product.category",
            "search_read",
            [domain],
            {"fields": ["id", "name"], "limit": 1},
        )
        if existing:
            raise ValueError(f"Ya existe una categoría con el nombre «{name}»")

        values: dict = {"name": name}
        if parent_id:
            values["parent_id"] = int(parent_id)

        new_id = odoo.create("product.category", values)
        rows = odoo.read("product.category", [new_id], CATEGORY_FIELDS)
        if not rows:
            raise LookupError("Category not found after creation")
        return _fmt(rows[0])

    @staticmethod
    def update(category_id: int, name: str, parent_id: int | None = None) -> dict:
        name = str(name).strip()
        if not name:
            raise ValueError("El nombre de la categoría es obligatorio")

        # Prevent renaming to an existing sibling
        domain = [["name", "=", name], ["id", "!=", int(category_id)]]
        if parent_id:
            domain.append(["parent_id", "=", int(parent_id)])
        else:
            domain.append(["parent_id", "=", False])

        existing = odoo.call(
            "product.category",
            "search_read",
            [domain],
            {"fields": ["id"], "limit": 1},
        )
        if existing:
            raise ValueError(f"Ya existe una categoría con el nombre «{name}»")

        values: dict = {"name": name}
        if parent_id is not None:
            values["parent_id"] = int(parent_id) if parent_id else False

        odoo.write("product.category", [int(category_id)], values)
        return CategoryService.get_by_id(int(category_id))

    @staticmethod
    def delete(category_id: int) -> bool:
        # Check if any products use this category
        used = odoo.call(
            "product.template",
            "search_read",
            [[[("categ_id", "=", int(category_id))]]],
            {"fields": ["id"], "limit": 1},
        )
        if used:
            raise ValueError(
                "No se puede eliminar: hay productos asignados a esta categoría"
            )
        odoo.unlink("product.category", [int(category_id)])
        return True


def _fmt(row: dict) -> dict:
    parent = row.get("parent_id")
    return {
        "id": row.get("id"),
        "name": row.get("name") or "",
        "fullName": row.get("complete_name") or row.get("name") or "",
        "parentId": int(parent[0]) if isinstance(parent, (list, tuple)) and parent else None,
        "parentName": parent[1] if isinstance(parent, (list, tuple)) and len(parent) > 1 else None,
    }
