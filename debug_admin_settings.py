from playwright.sync_api import sync_playwright, expect
import time

def debug_admin_settings():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        page.goto("http://localhost:3000")
        page.get_by_title("Admin Settings").click()
        # Wait for the Admin Settings panel to appear
        expect(page.get_by_text("Global Permissions")).to_be_visible(timeout=10000)
        page.screenshot(path="verification/admin_settings_debug.png")
        browser.close()

if __name__ == "__main__":
    debug_admin_settings()
