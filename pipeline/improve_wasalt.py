from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import json
import time
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

INPUT_FILE = (ROOT / "data/raw/wasalt.jsonl")
OUTPUT_FILE = (ROOT / "data/processed/wasalt_enriched.jsonl")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9"
}

PROPERTY_TYPES = {
    "SingleFamilyResidence",
    "Residence",
    "Apartment",
    "House",
    "Product"
}


def get_jsonld(soup):
    """Extract JSON-LD objects from the page."""
    results = []

    for script in soup.find_all(
        "script", type="application/ld+json"
    ):
        try:
            data = json.loads(script.string or script.get_text())

            if isinstance(data, list):
                results.extend(data)
            else:
                results.append(data)

        except (json.JSONDecodeError, TypeError):
            continue

    return results


def find_property(objects):
    """Find property-related objects, including objects inside @graph."""
    for obj in objects:
        if not isinstance(obj, dict):
            continue

        obj_type = obj.get("@type", [])
        if isinstance(obj_type, str):
            obj_type = [obj_type]

        if PROPERTY_TYPES.intersection(obj_type):
            return obj

        graph = obj.get("@graph", [])
        if isinstance(graph, list):
            found = find_property(graph)
            if found:
                return found

    return None


def clean_html(value):
    if not value:
        return ""

    soup = BeautifulSoup(str(value), "html.parser")
    return soup.get_text(" ", strip=True)


def extract_property_details(data):
    """Convert structured property data into useful fields."""
    address = data.get("address", {})
    if not isinstance(address, dict):
        address = {}

    offers = data.get("offers", {})
    if isinstance(offers, list):
        offers = offers[0] if offers else {}
    if not isinstance(offers, dict):
        offers = {}

    
    description = clean_html(data.get("description"))

    extra = extract_extra_attributes(description)

    area = (
        data.get("floorSize")
        or data.get("landArea")
        or extra["area_sqm"]
    )

    return {
        "name": data.get("name"),
        "description": description,
        "bedrooms": data.get("numberOfBedrooms"),
        "rooms": data.get("numberOfRooms"),
        "area": area,
        "area_unit": "SQM" if area else None,
        "address": {
            "country": address.get("addressCountry"),
            "city": address.get("addressLocality"),
            "street": address.get("streetAddress")
        },
        "price": offers.get("price"),
        "currency": offers.get("priceCurrency"),
        "image": data.get("image"),
        "facing": extra["facing"],
        "street_width_m": extra["street_width_m"],
        "building_year": extra["building_year"]
    }


def build_content(details, visible_text):
    parts = []

    for key in ["name", "description", "bedrooms", "rooms", "area"]:
        value = details.get(key)
        if value:
            parts.append(f"{key.title()}: {value}")

    address = details.get("address", {})
    location = ", ".join(
        str(v) for v in address.values() if v
    )
    if location:
        parts.append(f"Location: {location}")

    if details.get("price"):
        parts.append(
            f"Price: {details['price']} {details.get('currency') or ''}"
        )

    if parts:
        return "\n".join(parts)

    return visible_text


def extract_extra_attributes(description):
    """Recover attributes embedded in the property description."""
    text = description or ""

    def find(pattern):
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip() if match else None

    return {
        "area_sqm": find(
            r"(?:Land Area|Area)[:\s]+([\d,.]+)\s*(?:SQM|m²)"
        ),
        "facing": find(
            r"(?:located on\s+\d+\s+street,\s*|Facade[:\s]+)([A-Za-z ]+?)(?:\s+with|\s*$)"
        ),
        "street_width_m": find(
            r"(\d+(?:\.\d+)?)\s*m\s+width"
        ),
        "building_year": find(
            r"Building year[:\s]+(\d{4})"
        )
    }


def main():
    if not INPUT_FILE.exists():
        print("Input file not found:", INPUT_FILE)
        return

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    records = [
        json.loads(line)
        for line in INPUT_FILE.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]

    session = requests.Session()
    session.headers.update(HEADERS)

    enriched = []
    property_count = 0
    failed_count = 0

    for index, record in enumerate(records, start=1):
        url = record.get("url")

        if not url:
            print(f"[{index}/{len(records)}] Missing URL")
            continue

        print(f"[{index}/{len(records)}] {url}")

        try:
            response = session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "lxml")
            visible_text = soup.get_text(" ", strip=True)

            jsonld = get_jsonld(soup)
            property_data = find_property(jsonld)

            if property_data:
                details = extract_property_details(property_data)
                content = build_content(details, visible_text)
                record["property_details"] = details
                record["extraction_method"] = "json_ld"
                property_count += 1
            else:
                content = visible_text
                record["extraction_method"] = "visible_html"

            record["content"] = content
            record["content_length"] = len(content)
            record["last_checked"] = datetime.now(
                timezone.utc
            ).isoformat()

            enriched.append(record)

        except requests.RequestException as error:
            print("Request failed:", error)
            record["extraction_error"] = str(error)
            failed_count += 1
            enriched.append(record)

        time.sleep(1.5)

    with OUTPUT_FILE.open("w", encoding="utf-8") as file:
        for record in enriched:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")

    print("\nExtraction completed!")
    print("Total records:", len(enriched))
    print("Structured property records:", property_count)
    print("Failed requests:", failed_count)
    print("Output:", OUTPUT_FILE)


if __name__ == "__main__":
    main()
