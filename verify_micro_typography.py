
import asyncio
import os
from playwright.async_api import async_playwright, expect

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720}
        )
        page = await context.new_page()

        # Mock dashboard data to ensure consistent state
        await page.route("**/dashboard", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"id": "test-dashboard", "widgets": []}'
        ))

        try:
            # Visit the app
            await page.goto("http://localhost:3000")

            # The sidebar button uses the `Menu` icon and has label "Open Menu"
            sidebar_toggle = page.locator('button[aria-label="Open Menu"]')
            await expect(sidebar_toggle).to_be_visible(timeout=10000)

            # Open sidebar
            await sidebar_toggle.click()

            # Wait for sidebar nav to be visible
            # We want to click "Configuration -> General Settings"
            # It's a button with text "General Settings"
            settings_nav = page.locator('button:has-text("General Settings")')
            await expect(settings_nav).to_be_visible()
            await settings_nav.click()

            # Wait for settings panel content to be visible
            # We look for a known element from SidebarSettings.tsx
            # "GOOGLE DRIVE INTEGRATION" label
            drive_text = page.locator('label:has-text("GOOGLE DRIVE INTEGRATION")')
            await expect(drive_text).to_be_visible()

            # Take a screenshot of the sidebar settings to verify typography
            await page.screenshot(path="verification_sidebar.png")
            print("Sidebar screenshot taken")

        except Exception as e:
            print(f"Error during verification: {e}")
            await page.screenshot(path="error_state.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
