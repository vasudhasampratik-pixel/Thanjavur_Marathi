from dataclasses import dataclass

from fastapi.testclient import TestClient

from app.config import Settings
from app.auth import AuthenticationError
from app.model import ModelNotReadyError
from app.main import create_app
from app.quota import QuotaExceededError


@dataclass
class FakeModel:
    ready: bool = True

    def translate(self, text: str) -> str:
        return f"translated: {text}"


class FakeUsageStore:
    def __init__(self, limit: int = 20):
        self.limit = limit
        self.counts: dict[str, int] = {}

    def reserve(self, uid: str):
        count = self.counts.get(uid, 0)
        if count >= self.limit:
            raise QuotaExceededError("Daily translation limit reached.")
        count += 1
        self.counts[uid] = count
        return {"used": count, "limit": self.limit, "remaining": self.limit - count, "date": "2026-09-17"}


def make_client(model=None, store=None):
    app = create_app(
        settings=Settings(allowed_origins=("http://testserver",)),
        model=model or FakeModel(),
        usage_store=store or FakeUsageStore(),
        load_model=False,
    )
    return TestClient(app)


def test_health_endpoint_reports_model_state():
    response = make_client().get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "modelReady": True}


def test_missing_and_invalid_tokens_are_rejected(monkeypatch):
    client = make_client()
    assert client.post("/translate", json={"text": "hello"}).status_code == 401
    monkeypatch.setattr("app.main.verify_bearer_token", lambda _: (_ for _ in ()).throw(AuthenticationError("bad")))
    assert client.post("/translate", headers={"Authorization": "Bearer bad"}, json={"text": "hello"}).status_code == 401


def test_valid_translation_attaches_quota(monkeypatch):
    monkeypatch.setattr("app.main.verify_bearer_token", lambda _: "user-a")
    response = make_client().post("/translate", headers={"Authorization": "Bearer token"}, json={"text": "hello"})
    assert response.status_code == 200
    assert response.json()["translation"] == "translated: hello"
    assert response.json()["usage"]["remaining"] == 19


def test_empty_and_overlong_text_are_rejected():
    client = make_client()
    assert client.post("/translate", json={"text": " "}).status_code == 400
    assert client.post("/translate", json={"text": "x" * 501}).status_code == 400


def test_quota_at_limit_is_rejected(monkeypatch):
    monkeypatch.setattr("app.main.verify_bearer_token", lambda _: "user-a")
    store = FakeUsageStore()
    store.counts["user-a"] = 20
    response = make_client(store=store).post("/translate", headers={"Authorization": "Bearer token"}, json={"text": "hello"})
    assert response.status_code == 429
    assert response.json()["error"]["code"] == "daily_limit_reached"


def test_model_not_ready_is_reported(monkeypatch):
    monkeypatch.setattr("app.main.verify_bearer_token", lambda _: "user-a")
    response = make_client(model=FakeModel(ready=False)).post("/translate", headers={"Authorization": "Bearer token"}, json={"text": "hello"})
    assert response.status_code == 503
