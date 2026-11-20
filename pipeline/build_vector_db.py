from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import json
import hashlib
from pathlib import Path

import chromadb

from app.services.embeddings import embed


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

DATASET_PATH = (ROOT / "data/processed/combined_knowledge.jsonl")
DB_PATH = (ROOT / "vector_db")

COLLECTION_NAME = "darglobal_wasalt_knowledge"

CHUNK_SIZE = 1800
CHUNK_OVERLAP = 250


# --------------------------------------------------
# LOAD DATASET
# --------------------------------------------------

def load_records():
    records = []

    with DATASET_PATH.open("r", encoding="utf-8") as file:
        for line in file:
            if line.strip():
                records.append(json.loads(line))

    print(f"Loaded {len(records)} documents")
    return records


# --------------------------------------------------
# TEXT CHUNKING
# --------------------------------------------------

def chunk_text(text):
    text = " ".join(text.split())

    if not text:
        return []

    if len(text) <= CHUNK_SIZE:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))

        # Prefer splitting at a sentence boundary
        if end < len(text):
            split_at = text.rfind(". ", start, end)

            if split_at > start + CHUNK_SIZE // 2:
                end = split_at + 1

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = end - CHUNK_OVERLAP

    return chunks


# --------------------------------------------------
# PREPARE CHUNKS AND METADATA
# --------------------------------------------------

def prepare_chunks(records):
    documents = []
    metadatas = []
    ids = []

    for record in records:
        content = record.get("content", "").strip()

        if not content:
            continue

        chunks = chunk_text(content)

        for index, chunk in enumerate(chunks):
            company = (
                record.get("company")
                or record.get("source")
                or "unknown"
            )

            source_url = record.get("url", "")

            unique_text = (
                f"{record.get('id', '')}:"
                f"{index}:"
                f"{chunk}"
            )

            chunk_id = hashlib.sha256(
                unique_text.encode("utf-8")
            ).hexdigest()

            metadata = {
                "company": str(company),
                "title": str(record.get("title", "")),
                "source_url": str(source_url),
                "record_type": str(
                    record.get("record_type", "property_listing")
                ),
                "chunk_index": index,
            }

            # Preserve useful property fields
                        
            numeric_fields = {
                "price": float,
                "bedrooms": int,
                "rooms": int,
                "area": float,
                "street_width_m": float,
                "building_year": int,
            }

            text_fields = [
                "currency",
                "area_unit",
                "city",
                "locality",
                "country",
                "facing",
            ]

            for field, converter in numeric_fields.items():
                value = record.get(field)

                if value is not None and value != "":
                    try:
                        metadata[field] = converter(value)
                    except (ValueError, TypeError):
                        pass

            for field in text_fields:
                value = record.get(field)

                if value is not None and value != "":
                    metadata[field] = str(value)


            documents.append(chunk)
            metadatas.append(metadata)
            ids.append(chunk_id)

    print(f"Prepared {len(documents)} chunks")

    return ids, documents, metadatas


# --------------------------------------------------
# BUILD VECTOR DATABASE
# --------------------------------------------------

def main():
    records = load_records()

    ids, documents, metadatas = prepare_chunks(records)

    print("\nEmbedding documents...")

    embeddings = embed(documents)

    client = chromadb.PersistentClient(
        path=str(DB_PATH)
    )

    # Rebuild collection to avoid stale or duplicate records
    try:
        client.delete_collection(COLLECTION_NAME)
        print("Deleted previous collection")
    except Exception:
        pass

    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    print("Saving embeddings to ChromaDB...")

    batch_size = 100

    for start in range(0, len(ids), batch_size):
        end = start + batch_size

        collection.add(
            ids=ids[start:end],
            documents=documents[start:end],
            metadatas=metadatas[start:end],
            embeddings=embeddings[start:end],
        )

    print("\n========== VECTOR DATABASE COMPLETE ==========")
    print("Collection:", COLLECTION_NAME)
    print("Documents:", len(records))
    print("Stored chunks:", collection.count())
    print("Database location:", DB_PATH.resolve())


if __name__ == "__main__":
    main()
