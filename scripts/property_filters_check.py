from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import chromadb

client = chromadb.PersistentClient(path=str(ROOT / "vector_db"))

collection = client.get_collection(
    "darglobal_wasalt_knowledge"
)


def find_properties(
    city=None,
    max_price=None,
    min_bedrooms=None,
    currency="SAR"
):
    conditions = [
        {"company": {"$eq": "wasalt"}},
        {"currency": {"$eq": currency}},
    ]

    if city:
        conditions.append(
            {"city": {"$eq": city}}
        )

    if max_price is not None:
        conditions.append(
            {"price": {"$lt": max_price}}
        )

    if min_bedrooms is not None:
        conditions.append(
            {"bedrooms": {"$gte": min_bedrooms}}
        )

    results = collection.get(
        where={"$and": conditions},
        include=["metadatas", "documents"]
    )

    print("\nMATCHING PROPERTIES:", len(results["ids"]))

    for i, metadata in enumerate(results["metadatas"]):
        print("\nPROPERTY", i + 1)
        print("Title:", metadata.get("title"))
        print("Price:", metadata.get("price"), metadata.get("currency"))
        print("City:", metadata.get("city"))
        print("Bedrooms:", metadata.get("bedrooms"))
        print("Source:", metadata.get("source_url"))


if __name__ == "__main__":

    print("\nTEST 1: Madinah villas below 2 million SAR")
    find_properties(city="Madinah", max_price=2_000_000)

    print("\nTEST 2: Properties with at least 5 bedrooms")
    find_properties(min_bedrooms=5)

    print("\nTEST 3: Madinah properties below 2 million with 5+ bedrooms")
    find_properties(
        city="Madinah",
        max_price=2_000_000,
        min_bedrooms=5
    )
