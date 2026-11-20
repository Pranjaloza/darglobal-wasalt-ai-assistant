from app import prompts
from app.services.errors import ServiceError
from app.services.llm_client import chat_completion
from app.services.query_parser import extract_property_filters


def answer_question(question, knowledge):
    """Route a question to property search or general knowledge search."""

    property_filters = extract_property_filters(question)

    if property_filters:
        return _answer_property_question(question, property_filters, knowledge)

    return _answer_knowledge_question(question, knowledge)


def _answer_property_question(question, filters, knowledge):
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
        max_tokens=None
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


def _answer_knowledge_question(question, knowledge):
    try:
        results = knowledge.semantic_search(question, limit=5)
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
        max_tokens=None
    )

    return {
        "answer": answer,
        "sources": sources,
        "retrieved_documents": len(results),
        "model": model
    }
