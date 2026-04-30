from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from .client import odoo
from .users import UserService


@dataclass
class ReviewPayload:
    rating: int
    title: str
    body: str

    @staticmethod
    def from_payload(payload: dict | None) -> "ReviewPayload":
        data = payload or {}
        rating = int(data.get("rating") or 0)
        if rating < 1:
            rating = 1
        if rating > 5:
            rating = 5
        title = str(data.get("title") or "").strip()
        body = str(data.get("body") or data.get("text") or "").strip()
        return ReviewPayload(rating=rating, title=title, body=body)


class ReviewService:
    FIELDS = [
        "id",
        "product_tmpl_id",
        "partner_id",
        "user_id",
        "rating",
        "title",
        "body",
        "state",
        "create_date",
    ]

    def __init__(self, client, user_service: type[UserService] = UserService):
        self._client = client
        self._users = user_service

    def list_reviews(self, product_id: int) -> dict:
        rows = self._client.search_read(
            "catalog.review",
            [["product_tmpl_id", "=", int(product_id)], ["state", "=", "approved"]],
            self.FIELDS,
            limit=500,
            order="create_date desc",
        )
        reviews = []
        counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        total = 0
        for row in rows or []:
            rating = int(row.get("rating") or 0)
            if rating < 1:
                rating = 1
            if rating > 5:
                rating = 5
            counts[rating] = counts.get(rating, 0) + 1
            total += 1

            partner = row.get("partner_id") or []
            user_name = partner[1] if isinstance(partner, list) and len(partner) > 1 else "Usuario"
            created = row.get("create_date")
            date_str = str(created)[:10] if created else None
            reviews.append(
                {
                    "id": int(row.get("id") or 0),
                    "user": user_name,
                    "rating": rating,
                    "title": row.get("title") or "",
                    "text": row.get("body") or "",
                    "date": date_str,
                    "helpful": 0,
                }
            )

        avg = 0
        if total:
            avg = sum(k * v for k, v in counts.items()) / total

        summary = {
            "avg": round(avg, 2),
            "total": total,
            "counts": counts,
        }
        return {"summary": summary, "reviews": reviews}

    def create_review(self, uid: int, product_id: int, payload: dict | None) -> dict:
        review = ReviewPayload.from_payload(payload)
        partner_id = self._users.resolve_partner_id(uid)
        if not partner_id:
            raise RuntimeError("No partner linked to this user")

        vals = {
            "product_tmpl_id": int(product_id),
            "partner_id": int(partner_id),
            "user_id": int(uid),
            "rating": review.rating,
            "title": review.title,
            "body": review.body,
            "state": "approved",
        }
        review_id = self._client.create("catalog.review", vals)
        return {
            "id": int(review_id),
            "user": "",
            "rating": review.rating,
            "title": review.title,
            "text": review.body,
            "date": datetime.now().date().isoformat(),
            "helpful": 0,
        }


review_service = ReviewService(odoo)
