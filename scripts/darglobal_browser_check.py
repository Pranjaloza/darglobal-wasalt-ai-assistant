from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        page = await browser.new_page()

        try:
            response = await page.goto(
                "https://www.darglobal.co.uk/",
                wait_until="domcontentloaded",
                timeout=60000
            )

            print("HTTP status:", response.status if response else None)

            await page.wait_for_timeout(5000)

            print("Page title:", await page.title())

            text = await page.locator("body").inner_text()

            print("\nRendered content:")
            print(text[:4000])

            await page.screenshot(
                path=str(ROOT / "scripts" / "debug" / "darglobal_browser.png"),
                full_page=True
            )

        except Exception as error:
            print("Browser error:", error)

        finally:
            await browser.close()

asyncio.run(main())
