
from app.services.knowledge_search import KnowledgeSearch


def main():
    search = KnowledgeSearch()

    test_cases = [
        {
            "name": "All properties in Madinah",
            "params": {"city": "Madinah"}
        },
        {
            "name": "All properties in Jeddah",
            "params": {"city": "Jeddah"}
        },
        {
            "name": "Madinah under 1.5 million SAR",
            "params": {
                "city": "Madinah",
                "max_price": 1500000
            }
        },
        {
            "name": "Jeddah under 950k SAR",
            "params": {
                "city": "Jeddah",
                "max_price": 950000
            }
        },
        {
            "name": "Madinah with at least 6 bedrooms",
            "params": {
                "city": "Madinah",
                "min_bedrooms": 6
            }
        },
        {
            "name": "Madinah under 1.5m with at least 6 bedrooms",
            "params": {
                "city": "Madinah",
                "max_price": 1500000,
                "min_bedrooms": 6
            }
        },
        {
            "name": "Madinah properties with exactly 6 bedrooms",
            "params": {
                "city": "Madinah",
                "exact_bedrooms": 6
            }
        }

    ]

    for index, test in enumerate(test_cases, 1):
        print("\n" + "=" * 70)
        print(f"TEST {index}: {test['name']}")
        print("=" * 70)

        results = search.property_search(
                    **test["params"],
                    limit=100
                )

        print("Matching properties:", len(results))

        for item in results:
            print(f"Title: {item['title']}")
            print(f"City: {item['city']}")
            print(f"Price: {item['price']} {item['currency']}")
            print(f"Bedrooms: {item['bedrooms']}")
            print(f"URL: {item['source_url']}")
            print("-" * 50)


if __name__ == "__main__":
    main()
