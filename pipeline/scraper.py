from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import json
import time
import hashlib
import logging
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, urljoin, urldefrag
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup


#-----------------Configuration-----------------#

SITES = {
       "darglobal" : "https://www.darglobal.co.uk/",
       "wasalt" : "https://www.wasalt.sa/en/"
}

OUTPUT_DIR = (ROOT / "data/raw")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

MAX_PAGES_PER_SITE = 80
REQUEST_DELAY = 1.5  # seconds

HEADERS = {
     "User-Agent": "RealEstateAIResearchBot/1.0 (educational project)"
}

SKIP_EXTENSIONS = (
    ".jpg", ".jpeg", ".png", ".gif", ".webp",
    ".svg", ".pdf", ".zip", ".mp4", ".css", ".js"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s"
)

session = requests.Session()
session.headers.update(HEADERS)

# ---------------- URL UTILITIES ----------------

def normalize_url(url):
    url = urldefrag(url)[0]
    parsed = urlparse(url)

    return parsed._replace(
        fragment="",
        query="",
        path=parsed.path.rstrip("/") or "/"
    ).geturl()

def is_valid_url(url, base_domain):
    parsed = urlparse(url)

    if parsed.scheme not in ("http", "https"):
        return False

    if parsed.netloc.lower() != base_domain.lower():
        return False

    if parsed.path.lower().endswith(SKIP_EXTENSIONS):
        return False

    return True

# ---------------- ROBOTS CHECK ----------------

def get_robots_parser(base_url):
    robots_url = urljoin(base_url, "/robots.txt")

    parser = RobotFileParser()
    parser.set_url(robots_url)

    try:
        response = session.get(robots_url, timeout=15)

        if response.status_code == 200:
            parser.parse(response.text.splitlines())
            logging.info("Loaded robots.txt: %s", robots_url)
            return parser

        logging.warning(
            "Cannot verify robots.txt (%s). Skipping site.",
            response.status_code
        )
        return None

    except requests.RequestException as error:
        logging.warning("Robots check failed: %s", error)
        return None


def is_allowed(parser, url):
    return parser.can_fetch(HEADERS["User-Agent"], url)


# ---------------- SITEMAP DISCOVERY ----------------

def discover_sitemaps(base_url):
    robots_url = urljoin(base_url, "/robots.txt")
    sitemaps = []

    try:
        response = session.get(robots_url, timeout=15)

        if response.status_code == 200:
            for line in response.text.splitlines():
                if line.lower().startswith("sitemap:"):
                    sitemap_url = line.split(":", 1)[1].strip()
                    sitemaps.append(sitemap_url)

    except requests.RequestException as error:
        logging.warning("Sitemap discovery failed: %s", error)

    # Common sitemap locations as additional candidates
    sitemaps.extend([
        urljoin(base_url, "/sitemap.xml"),
        urljoin(base_url, "/sitemap_index.xml")
    ])

    return list(dict.fromkeys(sitemaps))


def extract_sitemap_urls(sitemap_url, domain, robots, visited=None):
    if visited is None:
        visited = set()

    sitemap_url = normalize_url(sitemap_url)

    if sitemap_url in visited or not is_allowed(robots, sitemap_url):
        return []

    visited.add(sitemap_url)
    urls = []

    try:
        response = session.get(sitemap_url, timeout=20)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, "xml")

        # Sitemap index
        for sitemap in soup.find_all("sitemap"):
            loc = sitemap.find("loc")

            if loc and loc.text:
                urls.extend(
                    extract_sitemap_urls(
                        loc.text.strip(), domain, robots, visited
                    )
                )

        # Individual page URLs
        for item in soup.find_all("url"):
            loc = item.find("loc")

            if loc and loc.text:
                page_url = normalize_url(loc.text.strip())

                if is_valid_url(page_url, domain):
                    urls.append(page_url)

    except Exception as error:
        logging.warning(
            "Unable to read sitemap %s: %s",
            sitemap_url, error
        )

    return urls

# ---------------- HTML EXTRACTION ----------------

def extract_page(url, company):
    response = session.get(url, timeout=20)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove non-content elements
    for element in soup([
        "script", "style", "noscript",
        "iframe", "svg", "nav", "footer"
    ]):
        element.decompose()

    title = (
        soup.title.get_text(" ", strip=True)
        if soup.title else ""
    )

    description_tag = soup.find(
        "meta", attrs={"name": "description"}
    )

    description = (
        description_tag.get("content", "")
        if description_tag else ""
    )

    headings = [
        heading.get_text(" ", strip=True)
        for heading in soup.find_all(["h1", "h2", "h3"])
        if heading.get_text(strip=True)
    ]

    # Prefer main content when available
    main = (
        soup.find("main")
        or soup.find("article")
        or soup.body
        or soup
    )

    paragraphs = [
        p.get_text(" ", strip=True)
        for p in main.find_all(["p", "li"])
        if len(p.get_text(strip=True)) > 30
    ]

    content = "\n".join(paragraphs)

    # Internal links
    links = set()

    for anchor in soup.find_all("a", href=True):
        absolute_url = normalize_url(
            urljoin(url, anchor["href"])
        )

        if is_valid_url(
            absolute_url, urlparse(url).netloc
        ):
            links.add(absolute_url)

    if len(content) < 100:
        logging.warning("Low-content page: %s", url)
        return None, links

    record = {
        "id": hashlib.sha256(
            url.encode("utf-8")
        ).hexdigest(),
        "company": company,
        "url": url,
        "title": title,
        "description": description,
        "headings": headings,
        "content": content,
        "scraped_at": datetime.now(
            timezone.utc
        ).isoformat(),
        "content_hash": hashlib.sha256(
            content.encode("utf-8")
        ).hexdigest()
    }

    return record, links

# ---------------- MAIN SCRAPER ----------------

def scrape_site(company, base_url):
    domain = urlparse(base_url).netloc
    output_file = OUTPUT_DIR / f"{company}.jsonl"

    logging.info("Starting scrape: %s", company)

    robots = get_robots_parser(base_url)

    if robots is None:
        return

    sitemap_urls = discover_sitemaps(base_url)

    discovered = set()

    for sitemap in sitemap_urls:
        discovered.update(
            extract_sitemap_urls(sitemap, domain, robots)
        )

    # Homepage is a starting point even if sitemap is absent
    discovered.add(normalize_url(base_url))

    queue = list(discovered)
    visited = set()
    content_hashes = set()
    total_saved = 0

    with output_file.open("w", encoding="utf-8") as file:

        while queue and len(visited) < MAX_PAGES_PER_SITE:

            url = queue.pop(0)

            if url in visited:
                continue

            visited.add(url)

            if not is_valid_url(url, domain):
                continue

            if not is_allowed(robots, url):
                logging.info("Robots disallowed: %s", url)
                continue

            try:
                record, internal_links = extract_page(
                    url, company
                )

                if record:
                    content_hash = record["content_hash"]

                    if content_hash not in content_hashes:
                        file.write(
                            json.dumps(
                                record,
                                ensure_ascii=False
                            ) + "\n"
                        )

                        content_hashes.add(content_hash)
                        total_saved += 1

                        logging.info(
                            "Saved %s | %s",
                            company, record["title"]
                        )

                for link in internal_links:
                    if link not in visited and link not in queue:
                        queue.append(link)

            except requests.RequestException as error:
                logging.warning(
                    "Request failed for %s: %s", url, error
                )

            except Exception:
                logging.exception("Extraction failed: %s", url)

            time.sleep(REQUEST_DELAY)

    logging.info(
        "%s completed. Pages saved: %d",
        company, total_saved
    )


if __name__ == "__main__":
    for company, base_url in SITES.items():
        scrape_site(company, base_url)

    print("\nScraping process completed!")
