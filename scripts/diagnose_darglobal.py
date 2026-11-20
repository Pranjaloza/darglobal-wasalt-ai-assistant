
import requests
from bs4 import BeautifulSoup

url = "https://www.darglobal.co.uk/"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
}

try:
    response = requests.get(
        url,
        headers=headers,
        timeout=30
    )

    print("Status:", response.status_code)
    print("Final URL:", response.url)
    print("HTML size:", len(response.text))

    soup = BeautifulSoup(response.text, "html.parser")

    print("\nPAGE TITLE:")
    print(soup.title.get_text(strip=True) if soup.title else "No title")

    print("\nMETA DESCRIPTION:")
    meta = soup.find("meta", attrs={"name": "description"})
    print(meta.get("content") if meta else "Not found")

    print("\nHEADINGS:")
    for heading in soup.find_all(["h1", "h2", "h3"]):
        print(heading.get_text(" ", strip=True))

    print("\nMAIN ELEMENTS:")
    for tag in ["main", "article", "section"]:
        elements = soup.find_all(tag)
        print(tag, ":", len(elements))

    print("\nBODY TEXT PREVIEW:")
    if soup.body:
        print(soup.body.get_text(" ", strip=True)[:3000])

    with open("darglobal_debug.html", "w", encoding="utf-8") as f:
        f.write(response.text)

    print("\nSaved HTML to darglobal_debug.html")

    print("\nRAW HTML:")
    print(repr(response.text))

    print("\nRESPONSE HEADERS:")
    for key, value in response.headers.items():
        print(f"{key}: {value}")

except requests.RequestException as error:
    print("Request error:", error)

