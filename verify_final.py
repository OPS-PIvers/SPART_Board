import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        print("Navigating to app...")
        await page.goto("http://localhost:3000")

        print("Waiting for app to load...")
        await page.wait_for_selector('[data-testid="dock"]', timeout=20000)

        # Check if dock is expanded. If not, click Open Tools.
        open_tools = page.locator('button[title="Open Tools"]')
        if await open_tools.is_visible():
            print("Expanding dock...")
            await open_tools.click()
            await asyncio.sleep(1)

        print("Clicking Timer tool...")
        # Use force=True because of aria-disabled="true"
        timer_button = page.locator('[data-testid="dock"] button').filter(has_text="Timer")
        await timer_button.click(force=True)

        print("Waiting for widget...")
        await page.wait_for_selector('.container-type-size', timeout=10000)

        print("Capturing digital_final.png...")
        widget = page.locator('.container-type-size')
        await widget.screenshot(path="digital_final.png")

        print("Switching to Visual mode...")
        await widget.locator('button:has-text("Visual")').click()
        await asyncio.sleep(1)

        print("Capturing visual_final.png...")
        await widget.screenshot(path="visual_final.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
