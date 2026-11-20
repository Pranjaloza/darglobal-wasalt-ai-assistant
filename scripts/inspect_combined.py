from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import json
from pathlib import Path

path = (ROOT / "data/processed/combined_knowledge.jsonl")

with path.open("r", encoding="utf-8") as file:
    records = [json.loads(line) for line in file if line.strip()]

print("FIRST DAR GLOBAL RECORD:")
for record in records:
    if record.get("source") == "darglobal":
        print(json.dumps(record, indent=2, ensure_ascii=False))
        break

print("\nSOURCE AND COMPANY COUNTS:")

for field in ["company", "source"]:
    counts = {}
    for record in records:
        value = record.get(field, "MISSING")
        counts[value] = counts.get(value, 0) + 1
    print(field, counts)
