from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import json
from pathlib import Path

path = (ROOT / "data/processed/wasalt_enriched.jsonl")

with path.open("r", encoding="utf-8") as file:
    records = [json.loads(line) for line in file if line.strip()]

property_records = [
    record for record in records
    if "/property/" in record.get("url", "")
]

print("TOTAL RECORDS:", len(records))
print("INDIVIDUAL PROPERTY RECORDS:", len(property_records))

for i, record in enumerate(property_records[:2], 1):
    print(f"\n========== PROPERTY {i} ==========")
    print(json.dumps(record, indent=2, ensure_ascii=False))
    print("\nTOP-LEVEL KEYS:", list(record.keys()))
