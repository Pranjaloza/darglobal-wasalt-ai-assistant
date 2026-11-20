from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import chromadb
from sentence_transformers import SentenceTransformer

DB_PATH = str(ROOT / "vector_db")
COLLECTION_NAME = "darglobal_wasalt_knowledge"
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

print("Loading embedding model...")
model = SentenceTransformer(MODEL_NAME)

print("Connecting to ChromaDB...")
client = chromadb.PersistentClient(path=DB_PATH)

collection = client.get_collection(COLLECTION_NAME)

print("Stored chunks:", collection.count())


def search_knowledge(question, top_k=3):
    query_embedding = model.encode(
        question,
        normalize_embeddings=True
    ).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=[
            "documents",
            "metadatas",
            "distances"
        ]
    )

    print("\n" + "=" * 70)
    print("QUESTION:", question)
    print("=" * 70)

    for i in range(len(results["documents"][0])):
        metadata = results["metadatas"][0][i]
        document = results["documents"][0][i]
        distance = results["distances"][0][i]

        print(f"\nRESULT {i + 1}")
        print("-" * 50)
        print("Company:", metadata.get("company"))
        print("Title:", metadata.get("title"))
        print("Distance:", round(distance, 4))
        print("Source:", metadata.get("source_url"))
        print("Content:", document[:700])


if __name__ == "__main__":

    test_questions = [
        "Tell me about DarGlobal and its real estate business",

        "Find villas in Madinah with a price below 2 million SAR",

        "What properties have at least 5 bedrooms?"
    ]

    for question in test_questions:
        search_knowledge(question)
