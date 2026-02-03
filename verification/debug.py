
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
        os.makedirs('verification', exist_ok=True)
        await page.screenshot(path='verification/debug.png')
        print("Debug screenshot saved.")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
