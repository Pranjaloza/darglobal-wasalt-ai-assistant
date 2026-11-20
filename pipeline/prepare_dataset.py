from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import json
import hashlib
from pathlib import Path
from datetime import datetime, timezone

DARGLOBAL_FILE = (ROOT / "data/raw/darglobal.jsonl")
WASALT_FILE = (ROOT / "data/processed/wasalt_enriched.jsonl")
OUTPUT_FILE = (ROOT / "data/processed/combined_knowledge.jsonl")


def read_jsonl(file_path):
    records = []

    if not file_path.exists():
        print(f"WARNING: File not found: {file_path}")
        return records

    with file_path.open("r", encoding="utf-8") as file:
        for line in file:
            if line.strip():
                records.append(json.loads(line))

    return records


def make_id(source, url):
    raw = f"{source}:{url}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def prepare_darglobal(records):
    prepared = []

    for record in records:
        content = record.get("content", "").strip()

        if not content:
            continue

        url = record.get("url", "")
        title = record.get("title", "DarGlobal information")

        prepared.append({
            "id": make_id("darglobal", url),
            "source": "darglobal",
            "company": "darglobal",
            "record_type": "company_information",
            "title": title,
            "url": url,
            "content": content,
            "last_checked": record.get("scraped_at"),
            "metadata": {
                "company": "DarGlobal",
                "source_file": record.get("source_file"),
                "headings": record.get("headings", [])
            }
        })

    return prepared



def prepare_wasalt(records):
    documents = []

    for record in records:
        details = record.get("property_details", {})

        # Only process individual property listings
        if not details or "/property/" not in record.get("url", ""):
            continue

        name = details.get("name") or record.get("title")
        price = details.get("price")

        if not name or price is None:
            continue

        address = details.get("address", {})

        document = {
            "id": record.get("id"),
            "company": "wasalt",
            "title": name,
            "content": record.get("content", ""),
            "url": record.get("url"),
            "price": price,
            "currency": details.get("currency"),
            "bedrooms": details.get("bedrooms"),
            "rooms": details.get("rooms"),
            "area": details.get("area"),
            "area_unit": details.get("area_unit"),
            "city": address.get("city"),
            "locality": address.get("street"),
            "country": address.get("country"),
            "facing": details.get("facing"),
            "street_width_m": details.get("street_width_m"),
            "building_year": details.get("building_year"),
            "image": details.get("image"),
            "last_checked": record.get("last_checked"),
        }

        documents.append(document)

    return documents


def main():
    darglobal_records = read_jsonl(DARGLOBAL_FILE)
    wasalt_records = read_jsonl(WASALT_FILE)

    print("DarGlobal source records:", len(darglobal_records))
    print("Wasalt source records:", len(wasalt_records))

    darglobal = prepare_darglobal(darglobal_records)
    wasalt = prepare_wasalt(wasalt_records)

    combined = darglobal + wasalt

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_FILE.open("w", encoding="utf-8") as file:
        for record in combined:
            file.write(
                json.dumps(record, ensure_ascii=False) + "\n"
            )

    print("\nDATASET PREPARATION COMPLETED")
    print("DarGlobal documents:", len(darglobal))
    print("Wasalt properties:", len(wasalt))
    print("Total documents:", len(combined))
    print("Output:", OUTPUT_FILE)


if __name__ == "__main__":
    main()
