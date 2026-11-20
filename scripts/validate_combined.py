from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import json
from pathlib import Path
from collections import Counter

DATASET = (ROOT / "data/processed/combined_knowledge.jsonl")

records = []

with DATASET.open("r", encoding="utf-8") as file:
    for line in file:
        if line.strip():
            records.append(json.loads(line))

print("\n========== DATASET VALIDATION ==========")

print(f"Total documents: {len(records)}")

company_counts = Counter(
    record.get("company") or record.get("source") or "unknown"
    for record in records
)

print("\nDocuments by source:")
for company, count in company_counts.items():
    print(f"{company}: {count}")

# Check duplicate URLs
urls = [record.get("url") for record in records if record.get("url")]
duplicates = [
    url for url, count in Counter(urls).items()
    if count > 1
]

print(f"\nRecords with URLs: {len(urls)}")
print(f"Duplicate URLs: {len(duplicates)}")

# Check missing URLs
missing_urls = [
    record for record in records
    if not record.get("url")
]

print(f"Missing URLs: {len(missing_urls)}")

# Validate Wasalt properties
wasalt = [
    record for record in records
    if (record.get("company") or record.get("source")) == "wasalt"
]

required_fields = [
    "price",
    "currency",
    "bedrooms",
    "city",
    "country"
]

print("\nWasalt field validation:")

for field in required_fields:
    populated = sum(
        1 for record in wasalt
        if record.get(field) is not None
        and record.get(field) != ""
    )
    print(f"{field}: {populated}/{len(wasalt)}")

# Final checks
print("\n========== VALIDATION RESULT ==========")

if len(records) == 49 and len(duplicates) == 0 and len(missing_urls) == 0:
    print("PASS: Dataset structure and URLs look good.")
else:
    print("WARNING: Review the counts and issues above.")
