
import requests
from bs4 import BeautifulSoup
import json
import re

url = "https://www.wasalt.sa/en/property/sale/villa-82632-sqm-facing-south-on-16m-width-street-5967699"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9"
}

response = requests.get(url, headers=headers, timeout=30)

print("HTTP Status:", response.status_code)
print("HTML Length:", len(response.text))
print("Final URL:", response.url)

soup = BeautifulSoup(response.text, "lxml")

print("\nPAGE TITLE:")
print(soup.title.get_text(strip=True) if soup.title else "Not found")

print("\nVISIBLE TEXT:")
text = soup.get_text(" ", strip=True)
print(text[:3000])

print("\nSTRUCTURED DATA:")
for script in soup.find_all("script", type="application/ld+json"):
    try:
        data = json.loads(script.string or script.get_text())
        print(json.dumps(data, indent=2)[:3000])
    except Exception:
        print("Could not parse JSON-LD")

print("\nPROPERTY-RELATED HTML MARKERS:")
for keyword in ["price", "bedroom", "bathroom", "area", "property", "__NEXT_DATA__", "application/ld+json"]:
    print(f"{keyword}: {response.text.lower().count(keyword.lower())}")
