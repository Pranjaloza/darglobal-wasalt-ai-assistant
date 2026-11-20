import pytest
from fastapi.testclient import TestClient

from app.main import app, get_knowledge
from app.services import chat_service


class FakeKnowledge:
    def property_search(self, **kwargs):
        return [{
            "title": "Villa A", "price": 1_000_000, "currency": "SAR",
            "bedrooms": 5, "area": 300, "city": "Madinah",
            "locality": "X", "facing": "North", "source_url": "https://example.com/a"
        }]

    def stats(self):
        return {
            "total_listings": 1, "darglobal_pages": 1,
            "cities": [{"name": "Madinah", "count": 1}],
            "price_range": {"min": 1_000_000, "max": 1_000_000},
            "bedroom_range": {"min": 5, "max": 5}, "currency": "SAR"
        }

    def semantic_search(self, question, limit=5):
        return [{
            "content": "DarGlobal builds luxury homes.",
            "metadata": {"title": "About", "company": "darglobal", "source_url": "https://example.com/about"},
            "distance": 0.1
        }]


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(
        chat_service, "chat_completion",
        lambda **kwargs: ("stub answer", "stub-model")
    )
    app.dependency_overrides[get_knowledge] = FakeKnowledge
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_health(client):
    assert client.get("/health").json() == {"status": "healthy"}


def test_chat_property_question(client):
    body = client.post("/chat", json={"question": "villas in Madinah under 2 million"}).json()
    assert body["answer"] == "stub answer"
    assert body["total_returned"] == 1
    assert body["filters"]["city"] == "Madinah"


def test_chat_knowledge_question(client):
    body = client.post("/chat", json={"question": "What does DarGlobal do?"}).json()
    assert body["answer"] == "stub answer"
    assert body["retrieved_documents"] == 1
    assert body["sources"][0]["url"] == "https://example.com/about"


def test_properties_endpoint(client):
    body = client.get("/properties", params={"city": "Madinah"}).json()
    assert body["total_returned"] == 1


def test_chat_rejects_short_question(client):
    assert client.post("/chat", json={"question": "a"}).status_code == 422


def test_stats_endpoint(client):
    body = client.get("/api/stats").json()
    assert body["total_listings"] == 1
    assert body["cities"][0]["name"] == "Madinah"
