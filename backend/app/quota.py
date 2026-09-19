from datetime import datetime, timezone
from typing import Protocol

from google.cloud import firestore


class QuotaExceededError(Exception):
    pass


class UsageStore(Protocol):
    def reserve(self, uid: str) -> dict[str, int | str]: ...


class FirestoreUsageStore:
    def __init__(self, client: firestore.Client, limit: int):
        self.client = client
        self.limit = limit

    def reserve(self, uid: str) -> dict[str, int | str]:
        date = datetime.now(timezone.utc).date().isoformat()
        reference = self.client.collection("translationUsage").document(f"{uid}_{date}")
        transaction = self.client.transaction()

        @firestore.transactional
        def reserve_in_transaction(transaction: firestore.Transaction) -> dict[str, int | str]:
            snapshot = reference.get(transaction=transaction)
            current_count = int(snapshot.get("count") or 0) if snapshot.exists else 0
            if current_count >= self.limit:
                raise QuotaExceededError("Daily translation limit reached.")

            next_count = current_count + 1
            transaction.set(
                reference,
                {
                    "uid": uid,
                    "date": date,
                    "count": next_count,
                    "limit": self.limit,
                    "updatedAt": firestore.SERVER_TIMESTAMP,
                },
                merge=True,
            )
            return {
                "used": next_count,
                "limit": self.limit,
                "remaining": self.limit - next_count,
                "date": date,
            }

        return reserve_in_transaction(transaction)
