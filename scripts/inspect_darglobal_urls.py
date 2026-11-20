from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
from pathlib import Path
from bs4 import BeautifulSoup
import json

folder = (ROOT / "data/raw/darglobal_pages")

for file_path in sorted(folder.glob("*.html")):
    with file_path.open("r", encoding="utf-8", errors="ignore") as f:
        soup = BeautifulSoup(f, "lxml")

    canonical = soup.find("link", rel="canonical")
    og_url = soup.find("meta", property="og:url")

    canonical_url = canonical.get("href") if canonical else None
    og_url_value = og_url.get("content") if og_url else None

    jsonld_urls = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or script.get_text())
            objects = data if isinstance(data, list) else [data]

            for obj in objects:
                if isinstance(obj, dict):
                    if obj.get("url"):
                        jsonld_urls.append(obj["url"])
        except (json.JSONDecodeError, TypeError):
            pass

    print(f"\nFILE: {file_path.name}")
    print("Canonical:", canonical_url)
    print("OG URL:", og_url_value)
    print("JSON-LD URLs:", jsonld_urls[:3])
