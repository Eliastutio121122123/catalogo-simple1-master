from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DeliveryData:
    first_name: str
    last_name: str
    email: str
    phone: str
    province: str
    city: str
    address: str
    reference: str = ""

    def full_name(self) -> str:
        name = f"{self.first_name} {self.last_name}".strip()
        return name or "Entrega"


class DeliveryRequest:
    def __init__(self, payload: dict | None):
        self._payload = payload or {}

    def is_empty(self) -> bool:
        return not any(
            str(self._payload.get(k) or "").strip()
            for k in (
                "firstName",
                "lastName",
                "email",
                "phone",
                "province",
                "city",
                "address",
                "reference",
            )
        )

    def parse(self) -> DeliveryData:
        def _get(key: str) -> str:
            return str(self._payload.get(key) or "").strip()

        data = DeliveryData(
            first_name=_get("firstName"),
            last_name=_get("lastName"),
            email=_get("email"),
            phone=_get("phone"),
            province=_get("province"),
            city=_get("city"),
            address=_get("address"),
            reference=_get("reference"),
        )
        self._validate(data)
        return data

    @staticmethod
    def _validate(data: DeliveryData) -> None:
        missing = []
        if not data.first_name:
            missing.append("firstName")
        if not data.last_name:
            missing.append("lastName")
        if not data.email:
            missing.append("email")
        if not data.phone:
            missing.append("phone")
        if not data.province:
            missing.append("province")
        if not data.city:
            missing.append("city")
        if not data.address:
            missing.append("address")
        if missing:
            raise ValueError(f"Missing delivery fields: {', '.join(missing)}")

