
import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        print("Navigating to app...")
        await page.goto('http://localhost:3000')

        await asyncio.sleep(5)

        print("Expanding dock...")
        open_tools_btn = page.locator('button[title="Open Tools"]')
        if await open_tools_btn.count() > 0:
            await open_tools_btn.click()
            await asyncio.sleep(2)

        buttons = await page.query_selector_all('button')
        print(f"Found {len(buttons)} buttons")
        for btn in buttons:
            label = await btn.get_attribute('aria-label')
            title = await btn.get_attribute('title')
            text = await btn.inner_text()
            if text or label or title:
                print(f"Button: label={label}, title={title}, text={text}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
