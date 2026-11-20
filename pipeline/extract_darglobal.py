from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import json
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from bs4 import BeautifulSoup


def extract_source_url(soup):
    """Extract the original URL from the saved HTML metadata."""

    canonical = soup.find(
        "link",
        rel=lambda value: value and "canonical" in value
    )

    if canonical and canonical.get("href"):
        return canonical["href"].strip()

    og_url = soup.find("meta", property="og:url")

    if og_url and og_url.get("content"):
        return og_url["content"].strip()

    return "https://darglobal.co.uk/"


INPUT_DIR = (ROOT / "data/raw/darglobal_pages")
OUTPUT_FILE = (ROOT / "data/raw/darglobal.jsonl")

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

records = []
seen_hashes = set()


for html_file in INPUT_DIR.glob("*.html"):

    print(f"Processing: {html_file.name}")

    soup = BeautifulSoup(
        html_file.read_text(encoding="utf-8", errors="ignore"),
        "html.parser"
    )
    page_url = extract_source_url(soup)

    for element in soup([
        "script", "style", "noscript",
        "svg", "nav", "footer"
    ]):
        element.decompose()

    title = (
        soup.title.get_text(" ", strip=True)
        if soup.title else html_file.stem
    )

    headings = [
        h.get_text(" ", strip=True)
        for h in soup.find_all(["h1", "h2", "h3"])
    ]

    main = (
        soup.find("main")
        or soup.find("article")
        or soup.body
        or soup
    )

    content = main.get_text(
        separator="\n",
        strip=True
    )

    lines = [
        line.strip()
        for line in content.splitlines()
        if len(line.strip()) > 20
    ]

    content = "\n".join(lines)

    if len(content) < 100:
        print("Skipped: insufficient content")
        continue

    content_hash = hashlib.sha256(
        content.encode("utf-8")
    ).hexdigest()

    if content_hash in seen_hashes:
        print("Skipped: duplicate content")
        continue

    seen_hashes.add(content_hash)

    record = {
        "id": hashlib.sha256(
            html_file.name.encode()
        ).hexdigest(),
        "company": "darglobal",
        "title": title,
        "url": page_url,
        "source_file": html_file.name,
        "headings": headings,
        "content": content,
        "content_hash": content_hash,
        "scraped_at": datetime.now(
            timezone.utc
        ).isoformat(),
        "collection_method": "manual_browser_export"
    }

    records.append(record)

with OUTPUT_FILE.open("w", encoding="utf-8") as f:
    for record in records:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

print("\nExtraction completed!")
print("Total records:", len(records))
print("Output:", OUTPUT_FILE)
