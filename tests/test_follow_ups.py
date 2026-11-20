from app.services import chat_service
from app.services.chat_service import _resolve_filters, answer_question

BASE = "Find villas in Madinah below 2 million SAR with at least 5 bedrooms"


def resolve_chain(*questions):
    filters = None
    for question in questions:
        filters = _resolve_filters(question, filters)
    return filters


def test_city_follow_up_keeps_price_and_bedrooms():
    filters = resolve_chain(BASE, "What about Jeddah?")
    assert filters["city"] == "Jeddah"
    assert filters["max_price"] == 2_000_000
    assert filters["min_bedrooms"] == 5


def test_chained_follow_ups_accumulate():
    filters = resolve_chain(BASE, "What about Jeddah?", "and under 1.5 million?")
    assert filters["city"] == "Jeddah"
    assert filters["max_price"] == 1_500_000
    assert filters["min_bedrooms"] == 5


def test_bedroom_follow_up_replaces_bedroom_rule():
    filters = resolve_chain(BASE, "only ones with exactly 6 bedrooms")
    assert filters["city"] == "Madinah"
    assert filters["exact_bedrooms"] == 6
    assert filters["min_bedrooms"] is None


def test_unrelated_short_question_is_not_a_property_search():
    assert resolve_chain(BASE, "Tell me about DarGlobal") is None


def test_long_new_property_question_starts_fresh():
    filters = resolve_chain(BASE, "Find properties in Jeddah with more than 6 bedrooms and a large plot area please")
    assert filters["city"] == "Jeddah"
    assert filters["max_price"] is None


class FakeKnowledge:
    def __init__(self):
        self.property_calls = []

    def property_search(self, **kwargs):
        self.property_calls.append(kwargs)
        return [{"title": "Villa", "price": 1_000_000, "currency": "SAR", "bedrooms": 6,
                 "area": 300, "city": kwargs.get("city"), "locality": "X", "facing": "N",
                 "source_url": "https://example.com"}]

    def semantic_search(self, question, limit=5):
        return []


def test_history_is_sent_to_the_model(monkeypatch):
    seen = {}

    def fake_completion(**kwargs):
        seen.update(kwargs)
        return "ok", "stub"

    monkeypatch.setattr(chat_service, "chat_completion", fake_completion)
    knowledge = FakeKnowledge()
    history = [
        {"role": "user", "content": BASE},
        {"role": "assistant", "content": "x" * 5000},
    ]

    answer_question("What about Jeddah?", knowledge, history)

    assert knowledge.property_calls[0]["city"] == "Jeddah"
    assert knowledge.property_calls[0]["max_price"] == 2_000_000
    assert [m["role"] for m in seen["history"]] == ["user", "assistant"]
    assert len(seen["history"][1]["content"]) < 2000  # long answers are trimmed
