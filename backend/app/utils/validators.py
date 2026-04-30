def require_fields(data: dict, fields: list) -> str | None:
    """Retorna mensaje de error si falta algún campo requerido."""
    missing = [f for f in fields if not data.get(f)]
    if missing:
        return f"Missing required fields: {', '.join(missing)}"
    return None
