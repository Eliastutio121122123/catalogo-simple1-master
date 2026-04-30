from flask import jsonify


def success(data=None, status: int = 200):
    """Respuesta exitosa estándar."""
    return jsonify({"ok": True, "data": data}), status


def error(message: str, status: int = 400):
    """Respuesta de error estándar."""
    return jsonify({"ok": False, "error": message}), status
