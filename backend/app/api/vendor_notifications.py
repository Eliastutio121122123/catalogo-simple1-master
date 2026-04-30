from flask import Blueprint, request
from flask.views import MethodView
from xmlrpc.client import Fault

from ..middleware.auth_guard import jwt_required
from ..odoo.notifications import notification_service
from ..utils.response import error, success


class VendorNotificationBase(MethodView):
    decorators = [jwt_required]

    def __init__(self, service):
        self._service = service

    @staticmethod
    def _uid() -> int:
        return int(request.jwt_payload.get("uid"))

    @staticmethod
    def _is_model_missing(exc: Exception) -> bool:
        if not isinstance(exc, Fault):
            return False
        msg = str(exc).lower()
        return "catalog.notification" in msg and ("does not exist" in msg or "invalid" in msg or "model" in msg)

    @staticmethod
    def _model_missing_response():
        return error(
            "Odoo model catalog.notification is missing. Install/update the custom module 'Catalogix Digital' in Odoo Apps.",
            503,
        )


class VendorNotificationsAPI(VendorNotificationBase):
    def get(self):
        try:
            return success(self._service.list_vendor_notifications(self._uid()))
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)


class VendorNotificationReadAPI(VendorNotificationBase):
    def patch(self, notification_id: int):
        try:
            return success(self._service.mark_read(self._uid(), notification_id))
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)


class VendorNotificationAllReadAPI(VendorNotificationBase):
    def patch(self):
        try:
            return success({"ok": self._service.mark_all_read(self._uid())})
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)


class VendorNotificationDeleteAPI(VendorNotificationBase):
    def delete(self, notification_id: int):
        try:
            self._service.delete(self._uid(), notification_id)
            return success({"message": "Notification deleted"})
        except LookupError as exc:
            return error(str(exc), 404)
        except Exception as exc:
            if self._is_model_missing(exc):
                return self._model_missing_response()
            return error(str(exc), 500)


bp = Blueprint("vendor_notifications", __name__)
bp.add_url_rule("", view_func=VendorNotificationsAPI.as_view("vendor_notifications", service=notification_service))
bp.add_url_rule(
    "/<int:notification_id>/read",
    view_func=VendorNotificationReadAPI.as_view("vendor_notification_read", service=notification_service),
)
bp.add_url_rule(
    "/read-all",
    view_func=VendorNotificationAllReadAPI.as_view("vendor_notification_read_all", service=notification_service),
)
bp.add_url_rule(
    "/<int:notification_id>",
    view_func=VendorNotificationDeleteAPI.as_view("vendor_notification_delete", service=notification_service),
)
