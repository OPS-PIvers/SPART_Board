
import asyncio
import os
import sys

# Ensure Playwright is installed
try:
    from playwright.async_api import async_playwright, expect
except ImportError:
    print("Playwright not installed. Installing...")
    os.system("pip install playwright")
    os.system("playwright install chromium")
    from playwright.async_api import async_playwright, expect

async def verify_dice_scoreboard_connection():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()

        print("Navigating to application...")
        # Assuming the dev server is running on port 5173 (default for Vite)
        # We need to make sure the app is running first.
        try:
            await page.goto("http://localhost:5173", timeout=60000)
            await page.wait_for_load_state("networkidle")
        except Exception as e:
            print(f"Failed to load page: {e}")
            await browser.close()
            return

        print("Adding Scoreboard Widget...")
        # Open sidebar/dock if necessary or drag/drop.
        # Assuming there is a way to add widgets.
        # Based on codebase, there might be a "Dock" with "Add Widget" buttons.
        # We need to simulate adding a Scoreboard and a Dice widget.

        # Strategy: Look for "Add Widget" buttons in the dock.
        # We might need to click the "+" button first if it exists.

        # Let's try to find the dock items.
        # Scoreboard icon might have an aria-label or title.

        try:
            # Click "Scoreboard" in Dock
            scoreboard_btn = page.get_by_role("button", name="Scoreboard")
            if await scoreboard_btn.count() > 0:
                await scoreboard_btn.click()
            else:
                 # Try finding by title
                await page.click('[title="Scoreboard"]')

            print("Scoreboard added.")
            await page.wait_for_timeout(500)

            # Click "Dice" in Dock
            dice_btn = page.get_by_role("button", name="Dice")
            if await dice_btn.count() > 0:
                await dice_btn.click()
            else:
                await page.click('[title="Dice"]')

            print("Dice added.")
            await page.wait_for_timeout(500)

            # Now we should have both widgets on the dashboard.

            # Locate the Dice widget. It should have a "Roll Dice" button.
            roll_btn = page.get_by_role("button", name="Roll Dice")
            await expect(roll_btn).to_be_visible()

            print("Rolling Dice...")
            await roll_btn.click()

            # Wait for roll to finish (it takes ~1s + logic)
            # The "Roll Dice" button becomes "Rolling..." and then back to "Roll Dice"
            # We want to wait for the "Assign X Points" buttons to appear.

            print("Waiting for roll to finish and assign buttons to appear...")

            # The assign buttons have "Assign X Points" text or similar.
            # In code: "Assign {totalValue} Points"
            # We can look for the Trophy icon or text "Assign"

            # Wait for at least 2 seconds for animation
            await page.wait_for_timeout(2000)

            assign_header = page.get_by_text("Assign", exact=False)
            await expect(assign_header).to_be_visible()

            print("Assign buttons visible.")

            # Take screenshot of the Dice widget with the Assign buttons
            await page.screenshot(path="/app/verification_dice_scoreboard.png", full_page=True)
            print("Screenshot saved to /app/verification_dice_scoreboard.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            await page.screenshot(path="/app/verification_error.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_dice_scoreboard_connection())
