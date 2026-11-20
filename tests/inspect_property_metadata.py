
import chromadb
from app import config

client = chromadb.PersistentClient(
    path=str(config.VECTOR_DB_DIR)
)

collection = client.get_collection(config.COLLECTION_NAME)

results = collection.get(
    where={"company": {"$eq": "wasalt"}},
    include=["metadatas"]
)

metadata = results["metadatas"]

print("Total Wasalt records:", len(metadata))

print("\nStored cities:")
print(sorted({
    item.get("city")
    for item in metadata
    if item.get("city")
}))

print("\nAvailable metadata fields:")
print(sorted({
    key
    for item in metadata
    for key in item.keys()
}))

print("\nPossible property type fields:")
for item in metadata[:5]:
    print({
        key: value
        for key, value in item.items()
        if "type" in key.lower()
    })
