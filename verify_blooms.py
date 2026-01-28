from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a large viewport to ensure widgets fit
        page = browser.new_page(viewport={"width": 1920, "height": 1080})

        # 1. Open Dashboard
        print("Navigating to dashboard...")
        page.goto("http://localhost:3000")

        # Wait for dashboard to load (look for the Dock or similar)
        # The 'Open Tools' button is a good indicator
        print("Waiting for dashboard load...")
        open_tools_btn = page.get_by_title("Open Tools")
        open_tools_btn.wait_for()

        # 2. Open Dock
        print("Opening dock...")
        open_tools_btn.click()

        # 3. Add Instructional Routines Widget
        print("Adding Instructional Routines widget...")
        routines_btn = page.get_by_text("Routines", exact=True) # exact=True to avoid partial matches
        routines_btn.click(force=True)

        # 4. Wait for widget to appear
        # The widget title usually appears
        print("Waiting for widget...")
        page.get_by_text("Library (ALL)").wait_for()

        # 5. Select Bloom's Taxonomy
        print("Selecting Bloom's Taxonomy...")
        # It's a button with text "Bloom's Taxonomy"
        page.get_by_text("BLOOM'S TAXONOMY").click()
        # Note: The text is uppercase in the UI (font-black uppercase leading-tight)

        # 6. Click Key Words
        print("Clicking Key Words...")
        page.get_by_role("button", name="Key Words").click()

        # 7. Wait for Text Widget with content
        print("Waiting for Text Widget...")
        # The new widget should contain "Bloom's Key Words"
        # We look for the h3 with that text.
        header = page.get_by_role("heading", name="Bloom's Key Words")
        header.wait_for()

        # 8. Take Screenshot
        print("Taking screenshot...")
        # We can try to screenshot just the new widget if we can find it, or the whole page.
        # Let's screenshot the whole page to show context.
        page.screenshot(path="/home/jules/verification/blooms_verification.png")

        print("Verification complete.")
        browser.close()

if __name__ == "__main__":
    run()
