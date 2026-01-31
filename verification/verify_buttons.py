import os
from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to http://localhost:3000")
        try:
            page.goto("http://localhost:3000")
        except Exception as e:
            print(f"Error navigating: {e}")
            return

        # Wait for Dock to load (Open Tools button)
        print("Waiting for Open Tools button")
        try:
            open_tools_btn = page.get_by_role("button", name="Open Tools")
            expect(open_tools_btn).to_be_visible(timeout=20000)
            open_tools_btn.click()
        except:
             open_tools_btn = page.get_by_title("Open Tools")
             expect(open_tools_btn).to_be_visible(timeout=20000)
             open_tools_btn.click()

        # Click Routines
        print("Clicking Routines")
        routines_btn = page.get_by_role("button", name="Routines")
        try:
            expect(routines_btn).to_be_visible()
            # Force click because dnd-kit might set aria-disabled
            routines_btn.click(force=True)
        except Exception as e:
            print(f"Routines button click failed: {e}")
            page.screenshot(path="verification/error_routines.png")
            return

        # Wait for Widget to appear
        print("Waiting for Widget")
        try:
            # Match "Library (ALL)" loosely or by partial text
            library_header = page.get_by_text("Library (ALL)")
            expect(library_header).to_be_visible(timeout=5000)
        except Exception as e:
            print(f"Library header not found: {e}")
            page.screenshot(path="verification/error_widget.png")
            return

        # Check buttons
        print("Checking buttons")
        try:
            clear_btn = page.get_by_role("button", name="Clear Board")
            expect(clear_btn).to_be_visible()

            manage_btn = page.get_by_role("button", name="Manage")
            expect(manage_btn).to_be_visible()
        except Exception as e:
            print(f"Buttons verification failed: {e}")
            page.screenshot(path="verification/error_buttons.png")
            return

        # Take screenshot
        os.makedirs("verification", exist_ok=True)
        page.screenshot(path="verification/buttons.png")
        print("Screenshot taken at verification/buttons.png")

        browser.close()

if __name__ == "__main__":
    run()
