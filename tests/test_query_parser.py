
from app.services.query_parser import extract_property_filters


test_queries = [
    "Find villas in Madinah below 1.5 million SAR with at least 6 bedrooms",

    "Find properties in Jeddah under 950k with 6 bedrooms",

    "Find villas below 1,500,000 SAR with 5+ bedrooms",

    "Find houses in Madinah up to 1.25m with exactly 6 bedrooms",

    "Find properties in Jeddah with more than 5 bedrooms",

    "Find apartments within SAR 900k with 3 bedrooms",

    "Find villas in Medina with at least 4 bedrooms",

    "Find villas in Jeddah below 1.5 million SAR",
]


for question in test_queries:
    print("\nQuestion:", question)
    print("Filters:", extract_property_filters(question))
