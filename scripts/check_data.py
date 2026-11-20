from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import json
from pathlib import Path

for file_path in (ROOT / "data/raw").glob("*.jsonl"):
    records = []

    with file_path.open(encoding="utf-8") as file:
        for line in file:
            if line.strip():
                records.append(json.loads(line))

    print(f"\nWebsite: {file_path.stem}")
    print(f"Total pages: {len(records)}")

    for record in records[:5]:
        print("-" * 50)
        print("Title:", record["title"])
        print("Source:", record.get("url", record.get("source_file", "Not available")))
        print("Content length:", len(record["content"]))
