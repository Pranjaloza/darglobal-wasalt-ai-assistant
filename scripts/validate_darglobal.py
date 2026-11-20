from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import json
from pathlib import Path

file_path = (ROOT / "data/raw/darglobal.jsonl")

with file_path.open("r", encoding="utf-8") as file:
    rows = [
        json.loads(line)
        for line in file
        if line.strip()
    ]

print("TOTAL RECORDS:", len(rows))
print("\nRECORD DETAILS:")

for i, record in enumerate(rows, 1):
    title = record.get("title", "No title")
    url = record.get("url", "MISSING URL")
    content = record.get("content", "")

    print(f"{i}. {title}")
    print(f"   URL: {url}")
    print(f"   Characters: {len(content)}")

urls = [record.get("url") for record in rows]

print("\nUNIQUE URLS:", len(set(urls)))
print("MISSING URLS:", sum(not url for url in urls))
