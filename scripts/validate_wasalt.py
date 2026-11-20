from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import json
from pathlib import Path

path = (ROOT / "data/processed/wasalt_enriched.jsonl")

records = [
    json.loads(line)
    for line in path.read_text(encoding="utf-8").splitlines()
    if line.strip()
]

properties = [
    r for r in records
    if r.get("extraction_method") == "json_ld"
]

print("TOTAL PROPERTY RECORDS:", len(properties))

fields = ["name", "price", "currency", "bedrooms", "address"]

for field in fields:
    missing = sum(
        not p.get("property_details", {}).get(field)
        for p in properties
    )
    print(f"{field}: {len(properties) - missing} available | {missing} missing")

print("\nSAMPLE PROPERTY:")
if properties:
    p = properties[0]
    print(json.dumps({
        "title": p.get("title"),
        "url": p.get("url"),
        "details": p.get("property_details"),
        "last_checked": p.get("last_checked")
    }, indent=2, ensure_ascii=False))

print("\nDUPLICATE URLS:")
urls = [p.get("url") for p in properties]
print(len(urls) - len(set(urls)))
