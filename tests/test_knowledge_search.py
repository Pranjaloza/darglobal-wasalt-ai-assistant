"""Integration tests against the real vector DB. Skipped if it has not been built."""

import pytest

from app import config

pytestmark = pytest.mark.skipif(
    not (config.VECTOR_DB_DIR / "chroma.sqlite3").exists(),
    reason="vector_db not built; run `python -m pipeline.build_vector_db`",
)


@pytest.fixture(scope="module")
def search():
    from app.services.knowledge_search import KnowledgeSearch
    return KnowledgeSearch()


def test_semantic_search_darglobal(search):
    results = search.semantic_search(
        "Tell me about DarGlobal's luxury real estate business",
        company="darglobal",
        limit=3,
    )
    assert results
    assert all(r["metadata"].get("company") == "darglobal" for r in results)


def test_property_search_respects_filters(search):
    properties = search.property_search(
        city="Madinah", max_price=2_000_000, min_bedrooms=5, limit=10
    )
    for p in properties:
        assert p["city"] == "Madinah"
        assert p["price"] < 2_000_000
        assert p["bedrooms"] >= 5
    prices = [p["price"] for p in properties]
    assert prices == sorted(prices)
