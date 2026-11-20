
import re


PROPERTY_KEYWORDS = [
    "villa", "villas",
    "property", "properties",
    "bedroom", "bedrooms",
    "house", "houses",
    "home", "homes",
    "apartment", "apartments",
    "real estate"
]


# --------------------------------------------------
# PRICE EXTRACTION
# --------------------------------------------------

PRICE_PATTERN = re.compile(
    r"\b(?:under|below|less than|up to|upto|"
    r"maximum(?:\s+budget)?|"
    r"max(?:imum)?(?:\s+budget)?|"
    r"budget(?:\s+of)?|within)"
    r"\s+(?:of\s+)?(?:sar\s*)?"
    r"(\d[\d,]*(?:\.\d+)?)"
    r"\s*(million|millions|mn|m|k)?"
    r"(?:\s*sar)?\b",
    re.IGNORECASE
)


# --------------------------------------------------
# BEDROOM EXTRACTION
# --------------------------------------------------

MIN_BEDROOM_PATTERNS = [
    (r"\b(?:at least|minimum|min\.?)\s+(\d+)\s*\+?\s*bedrooms?\b", False),
    (r"\b(\d+)\s*\+\s*bedrooms?\b", False),
    (r"\bwith\s+(\d+)\s+or more\s+bedrooms?\b", False),
    (r"\b(\d+)\s+or more\s+bedrooms?\b", False),
    (r"\bmore than\s+(\d+)\s+bedrooms?\b", True),
    (r"\bover\s+(\d+)\s+bedrooms?\b", True)
]


EXACT_BEDROOM_PATTERN = re.compile(
    r"\b(?:exactly\s+|with\s+|having\s+)?"
    r"(\d+)[-\s]+bedrooms?\b",
    re.IGNORECASE
)


# --------------------------------------------------
# CITY EXTRACTION
# --------------------------------------------------

CITY_ALIASES = {
    "madinah": "Madinah",
    "medina": "Madinah",
    "jeddah": "Jeddah"
}


def extract_city(question):
    q = question.lower()

    for alias, canonical_name in CITY_ALIASES.items():
        pattern = rf"\b{re.escape(alias)}\b"

        if re.search(pattern, q):
            return canonical_name

    return None


# --------------------------------------------------
# PRICE CONVERSION
# --------------------------------------------------

def convert_price(amount, unit):
    amount = float(amount.replace(",", ""))

    if unit:
        unit = unit.lower()

        if unit in ("million", "millions", "mn", "m"):
            amount *= 1_000_000

        elif unit == "k":
            amount *= 1_000

    return amount


# --------------------------------------------------
# MAIN FILTER EXTRACTION
# --------------------------------------------------

def extract_property_filters(question):
    """
    Extract structured property filters from a user question.

    Returns:
        dict: Property filters
        None: If the question is not a property search
    """

    q = question.lower()

    # Check whether this is a property-related query.
    if not any(keyword in q for keyword in PROPERTY_KEYWORDS):
        return None

    filters = {
        "city": None,
        "max_price": None,
        "min_bedrooms": None,
        "exact_bedrooms": None,
        "currency": "SAR"
    }

    # --------------------------------------------------
    # CITY
    # --------------------------------------------------

    filters["city"] = extract_city(q)

    # --------------------------------------------------
    # PRICE
    # --------------------------------------------------

    price_match = PRICE_PATTERN.search(q)

    if price_match:
        amount = price_match.group(1)
        unit = price_match.group(2)

        filters["max_price"] = convert_price(
            amount,
            unit
        )

    # --------------------------------------------------
    # MINIMUM BEDROOMS
    # --------------------------------------------------

    for pattern, exclusive in MIN_BEDROOM_PATTERNS:

        match = re.search(
            pattern,
            q,
            re.IGNORECASE
        )

        if match:
            count = int(match.group(1))

            if exclusive:
                count += 1

            filters["min_bedrooms"] = count
            break

    # --------------------------------------------------
    # EXACT BEDROOMS
    # --------------------------------------------------

    if filters["min_bedrooms"] is None:

        exact_match = EXACT_BEDROOM_PATTERN.search(q)

        if exact_match:
            filters["exact_bedrooms"] = int(
                exact_match.group(1)
            )

    return filters
