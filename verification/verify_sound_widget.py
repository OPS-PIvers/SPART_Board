import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        # Launch browser with microphone permissions granted
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            permissions=['microphone'],
            viewport={'width': 1920, 'height': 1080}
        )
        page = await context.new_page()

        try:
            print("Navigating to dashboard...")
            await page.goto("http://localhost:3000")

            # Wait for dashboard to load
            await page.wait_for_timeout(2000)

            # Check if Dock is collapsed (look for Open Tools button)
            open_tools_btn = page.locator('button[title="Open Tools"]')
            if await open_tools_btn.is_visible():
                print("Dock is collapsed. Expanding...")
                await open_tools_btn.click()
                await page.wait_for_timeout(1000) # Wait for animation
            else:
                print("Dock appears to be expanded or Open Tools button not found.")

            # Locate the Noise button
            # We target the button that contains the text "Noise"
            noise_btn = page.locator('button', has_text="Noise").first

            print("Waiting for Noise button...")
            await noise_btn.wait_for(state="visible", timeout=10000)

            print("Clicking Noise button...")
            # force=True is needed because dnd-kit adds aria-disabled="true" when not in edit mode
            # which Playwright interprets as the button being disabled.
            await noise_btn.click(force=True)

            # Wait for widget to appear
            # The widget displays "0 - Silence" at 0 volume
            print("Waiting for Sound Widget to appear...")
            widget_text = page.locator('text="0 - Silence"')
            await widget_text.wait_for(state="visible", timeout=10000)

            print("Widget found! Taking screenshot...")
            await page.screenshot(path="verification/sound_widget_verified.png")
            print("Screenshot saved to verification/sound_widget_verified.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            await page.screenshot(path="verification/error_v2.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
