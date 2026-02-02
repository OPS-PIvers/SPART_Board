from playwright.sync_api import sync_playwright, expect
import time

def verify_instructional_routines():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000")

            # Wait for any of the main UI elements
            page.wait_for_selector('button[title="Open Menu"]', timeout=30000)
            print("App loaded.")

            # 1. Verify Admin Builder
            print("Opening Admin Menu...")
            page.get_by_title("Admin Settings").click()

            # Wait for Admin Settings modal
            expect(page.get_by_text("Admin Settings")).to_be_visible(timeout=10000)

            print("Opening Instructional Routines Library...")
            # Scroll down to find the Routines card
            routines_label = page.get_by_text("instructionalRoutines")
            routines_label.scroll_into_view_if_needed()

            # Click the settings button in the Routines card
            card = page.locator("div").filter(has=routines_label).filter(has=page.get_by_title("Edit widget configuration")).last
            card.get_by_title("Edit widget configuration").click()

            # Wait for Library modal
            expect(page.get_by_text("Instructional Routines Library")).to_be_visible(timeout=10000)
            print("Library modal visible.")

            print("Editing Chalk Talk...")
            page.locator("div").filter(has_text="Chalk Talk").get_by_title("Edit Routine").last.click()

            # Wait for builder
            expect(page.get_by_text("Structure & Audience")).to_be_visible(timeout=5000)
            time.sleep(1) # Wait for animation
            page.screenshot(path="/home/jules/verification/admin_builder.png")
            print("Admin builder screenshot saved.")

            # 2. Verify Widget Rendering
            print("Returning to Dashboard...")
            page.keyboard.press("Escape") # Close builder
            time.sleep(0.5)
            page.keyboard.press("Escape") # Close library
            time.sleep(0.5)
            page.keyboard.press("Escape") # Close Admin Settings
            time.sleep(1)

            print("Opening Tools from Dock...")
            page.get_by_title("Open Tools").click()
            time.sleep(1)

            # Try to find Routines in Dock
            routines_btn = page.get_by_role("button", name="Routines", exact=True).last
            if not routines_btn.is_visible():
                routines_btn = page.get_by_text("Routines", exact=True).last

            print("Clicking Routines...")
            routines_btn.click(force=True)

            # Select Chalk Talk from the widget's internal library
            print("Selecting Chalk Talk in widget...")
            # Click on the widget area first to activate menu if needed
            expect(page.get_by_text("Chalk Talk").last).to_be_visible(timeout=10000)
            page.get_by_text("Chalk Talk").last.click(force=True)

            # Take a screenshot of the widget in Linear mode
            time.sleep(1)
            page.screenshot(path="/home/jules/verification/widget_linear.png")
            print("Widget linear screenshot saved.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_instructional_routines()
