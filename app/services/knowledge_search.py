
import chromadb
from app import config
from app.services.embeddings import embed, get_embedder


class KnowledgeSearch:

    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=str(config.VECTOR_DB_DIR)
        )

        self.collection = self.client.get_collection(
            config.COLLECTION_NAME
        )

        # Load the embedding model now so the first question isn't slow.
        get_embedder()

    # ------------------------------------------
    # SEMANTIC SEARCH
    # ------------------------------------------

    def semantic_search(self, question, company=None, limit=5):

        query_embedding = embed([question])[0]

        filters = None

        if company:
            filters = {
                "company": {"$eq": company.lower()}
            }

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=limit,
            where=filters,
            include=[
                "documents",
                "metadatas",
                "distances"
            ]
        )

        output = []

        for i, document in enumerate(results["documents"][0]):
            output.append({
                "content": document,
                "metadata": results["metadatas"][0][i],
                "distance": results["distances"][0][i]
            })

        return output

    # ------------------------------------------
    # EXACT PROPERTY SEARCH
    # ------------------------------------------

        
    def property_search(
        self,
        city=None,
        max_price=None,
        min_bedrooms=None,
        exact_bedrooms=None,
        currency="SAR",
        limit=10
    ):
        conditions = [
            {"company": {"$eq": "wasalt"}},
            {"currency": {"$eq": currency}}
        ]

        # City filter
        if city:
            city_aliases = {
                "madinah": "Madinah",
                "medina": "Madinah",
                "jeddah": "Jeddah"
            }

            normalized_city = city.strip().lower()
            actual_city = city_aliases.get(
                normalized_city,
                city.strip()
            )

            conditions.append({
                "city": {"$eq": actual_city}
            })

        # Maximum budget (inclusive)
        if max_price is not None:
            conditions.append({
                "price": {"$lte": float(max_price)}
            })

        # Minimum bedrooms
        if min_bedrooms is not None:
            conditions.append({
                "bedrooms": {"$gte": int(min_bedrooms)}
            })

        # Exact bedrooms
        if exact_bedrooms is not None:
            conditions.append({
                "bedrooms": {"$eq": int(exact_bedrooms)}
            })

        results = self.collection.get(
            where={"$and": conditions},
            include=["metadatas", "documents"]
        )

        properties = []

        for metadata in results["metadatas"]:
            properties.append({
                "title": metadata.get("title"),
                "price": metadata.get("price"),
                "currency": metadata.get("currency"),
                "bedrooms": metadata.get("bedrooms"),
                "area": metadata.get("area"),
                "area_unit": metadata.get("area_unit"),
                "city": metadata.get("city"),
                "locality": metadata.get("locality"),
                "facing": metadata.get("facing"),
                "source_url": metadata.get("source_url")
            })

        # Sort by ascending price
        properties.sort(
            key=lambda item: (
                item.get("price")
                if isinstance(item.get("price"), (int, float))
                else float("inf")
            )
        )

        return properties[:limit]

    # ------------------------------------------
    # DATASET STATS (for the frontend filters)
    # ------------------------------------------

    def stats(self):
        metadatas = self.collection.get(include=["metadatas"])["metadatas"]

        listings = [m for m in metadatas if m.get("company") == "wasalt"]
        darglobal_pages = {
            m.get("source_url") or m.get("title")
            for m in metadatas
            if m.get("company") == "darglobal"
        }

        cities = {}
        for m in listings:
            if m.get("city"):
                cities[m["city"]] = cities.get(m["city"], 0) + 1

        prices = [m["price"] for m in listings if isinstance(m.get("price"), (int, float))]
        bedrooms = [m["bedrooms"] for m in listings if isinstance(m.get("bedrooms"), (int, float))]

        return {
            "total_listings": len(listings),
            "darglobal_pages": len(darglobal_pages),
            "cities": [
                {"name": name, "count": count}
                for name, count in sorted(cities.items(), key=lambda item: -item[1])
            ],
            "price_range": {"min": min(prices), "max": max(prices)} if prices else None,
            "bedroom_range": {"min": int(min(bedrooms)), "max": int(max(bedrooms))} if bedrooms else None,
            "currency": "SAR",
        }
