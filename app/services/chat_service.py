from app import prompts
from app.services.errors import ServiceError
from app.services.llm_client import chat_completion
from app.services.query_parser import extract_property_filters


# How much of the conversation the model sees
HISTORY_MESSAGES = 6
HISTORY_CHARS = 1500
# A follow-up this short is searched together with the previous question
SHORT_FOLLOW_UP_WORDS = 10

FILTER_KEYS = ("city", "max_price", "min_bedrooms", "exact_bedrooms")


def answer_question(question, knowledge, history=None):
    """Route a question to property search or general knowledge search.

    `history` is the conversation so far ([{role, content}], oldest first).
    It lets follow-ups such as "what about Jeddah?" or "and under 1.5M?"
    build on the previous search, and lets the model refer back to earlier
    answers.
    """

    history = _trim_history(history or [])
    earlier_questions = [m["content"] for m in history if m["role"] == "user"]

    # Replay the conversation so chained follow-ups keep accumulating filters
    previous_filters = None
    for earlier in earlier_questions:
        previous_filters = _resolve_filters(earlier, previous_filters)

    property_filters = _resolve_filters(question, previous_filters)

    if property_filters:
        return _answer_property_question(question, property_filters, knowledge, history)

    search_query = question
    if earlier_questions and _is_short(question):
        search_query = f"{earlier_questions[-1]}\n{question}"

    return _answer_knowledge_question(question, knowledge, history, search_query)


def _is_short(question):
    return len(question.split()) <= SHORT_FOLLOW_UP_WORDS


def _resolve_filters(question, previous_filters):
    """Property filters for `question`, given the filters in force before it.

    - No earlier property search, or a long self-contained question:
      use the question's own filters (None if it is not a property question).
    - A short follow-up that names a city, price or bedroom count:
      apply those changes on top of the previous filters.
    - Anything else: the question's own filters (usually None).
    """
    own = extract_property_filters(question)

    if previous_filters is None or (own is not None and not _is_short(question)):
        return own

    changes = extract_property_filters(question, require_keyword=False)
    if not any(changes[key] is not None for key in FILTER_KEYS):
        return own

    return _merge(previous_filters, changes)


def _trim_history(history):
    """Keep the last few messages and shorten long answers."""
    trimmed = []
    for message in history[-HISTORY_MESSAGES:]:
        content = message["content"]
        if len(content) > HISTORY_CHARS:
            content = content[:HISTORY_CHARS] + " …"
        trimmed.append({"role": message["role"], "content": content})
    return trimmed


def _merge(previous_filters, changes):
    """Apply the follow-up's filters on top of the previous ones."""
    merged = dict(previous_filters)
    for key in FILTER_KEYS:
        if changes[key] is not None:
            merged[key] = changes[key]

    # A new bedroom rule replaces the old one rather than combining with it
    if changes["exact_bedrooms"] is not None:
        merged["min_bedrooms"] = None
    if changes["min_bedrooms"] is not None:
        merged["exact_bedrooms"] = None

    return merged


def _answer_property_question(question, filters, knowledge, history):
    try:
        properties = knowledge.property_search(
            city=filters["city"],
            max_price=filters["max_price"],
            min_bedrooms=filters["min_bedrooms"],
            exact_bedrooms=filters["exact_bedrooms"],
            currency=filters["currency"],
            limit=10
        )
    except Exception as error:
        raise ServiceError(500, f"Property search failed: {error}")

    if not properties:
        return {
            "answer": (
                "I couldn't find matching properties "
                "in the collected listings. Try adjusting "
                "your search criteria."
            ),
            "filters": filters,
            "total_returned": 0,
            "properties": [],
            "sources": []
        }

    context = "\n\n".join(
        prompts.PROPERTY_RECORD_TEMPLATE.format(
            title=p.get("title"),
            price=p.get("price"),
            currency=p.get("currency"),
            bedrooms=p.get("bedrooms"),
            area=p.get("area"),
            area_unit=p.get("area_unit") or "SQM",
            city=p.get("city"),
            locality=p.get("locality"),
            facing=p.get("facing"),
            source_url=p.get("source_url")
        )
        for p in properties
    )

    answer, model = chat_completion(
        system_prompt=prompts.PROPERTY_SYSTEM_PROMPT,
        user_prompt=prompts.PROPERTY_USER_TEMPLATE.format(
            question=question,
            context=context
        ),
        temperature=0.1,
        max_tokens=None,
        history=history
    )

    return {
        "answer": answer,
        "filters": filters,
        "total_returned": len(properties),
        "properties": properties,
        "sources": [
            {"title": p.get("title"), "url": p.get("source_url")}
            for p in properties
        ],
        "model": model
    }


def _answer_knowledge_question(question, knowledge, history, search_query):
    try:
        results = knowledge.semantic_search(search_query, limit=5)
    except Exception as error:
        raise ServiceError(500, f"Knowledge retrieval failed: {error}")

    if not results:
        return {
            "answer": "I couldn't find relevant information in the available data.",
            "sources": [],
            "retrieved_documents": 0
        }

    context_parts = []
    sources = []
    seen_urls = set()

    for result in results:
        metadata = result["metadata"]

        title = metadata.get("title", "Untitled")
        source_url = metadata.get("source_url", "")
        company = metadata.get("company", "unknown")

        context_parts.append(
            prompts.KNOWLEDGE_RECORD_TEMPLATE.format(
                company=company,
                title=title,
                content=result["content"]
            )
        )

        if source_url and source_url not in seen_urls:
            sources.append({
                "title": title,
                "company": company,
                "url": source_url
            })
            seen_urls.add(source_url)

    answer, model = chat_completion(
        system_prompt=prompts.KNOWLEDGE_SYSTEM_PROMPT,
        user_prompt=prompts.KNOWLEDGE_USER_TEMPLATE.format(
            context="\n\n".join(context_parts),
            question=question
        ),
        temperature=0.2,
        max_tokens=None,
        history=history
    )

    return {
        "answer": answer,
        "sources": sources,
        "retrieved_documents": len(results),
        "model": model
    }
