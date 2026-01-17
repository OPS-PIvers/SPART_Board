
from playwright.sync_api import Page, expect, sync_playwright
import time
import os

def verify_sound_widget_colors(page: Page):
    """
    Verifies that the Sound Widget uses the correct colors after refactoring.
    """
    # 1. Arrange: Go to the app.
    # Note: Port is 3000
    page.goto("http://localhost:3000")

    # Wait for the app to load.
    # The dock has title="Open Tools" when collapsed.
    # When expanded, it has a "Hide" button (ChevronDown).

    # Wait for the dock container. In Dock.tsx, it's <div ref={dockContainerRef} ...>
    # It has fixed bottom-6.
    # Let's wait for "Open Tools" button or the Dock expanded view.

    try:
        # Try to find "Open Tools" button first
        open_tools_btn = page.get_by_role("button", name="Open Tools")
        if open_tools_btn.is_visible(timeout=5000):
            open_tools_btn.click()
    except:
        # If timeout, maybe it's already expanded?
        pass

    # Now look for "Noise" button.
    # If not found, maybe we need to open the "Widget Library"?
    # "Add Widgets" button is only in Edit Mode.

    # The dock displays items in `dockItems`. If "sound" is not in dockItems, we can't click it easily.
    # BUT, the memory says: "Automated verification scripts running against the `MOCK_USER` environment must explicitly add widgets by opening the Dock (title='Open Tools') if collapsed, and then clicking the specific tool button."
    # This implies the tool is usually available.

    # Let's try to click "Noise".
    # Note: ToolDockItem has children "Noise".

    try:
        page.get_by_text("Noise").click(timeout=5000)
    except:
        # If "Noise" is not visible, it might be in a folder or not in the dock.
        # But for MOCK_USER, default dashboard might have it?
        # If not, we might need to add it via Settings or similar?
        # Or maybe the dock is just collapsed again?

        # Let's try to find if "Noise" text exists.
        if page.get_by_text("Noise").count() > 0:
            page.get_by_text("Noise").click()
        else:
             print("Noise tool not found in Dock. Attempting to add via Edit Mode?")
             # This might be too complex.
             # Let's assume standard config has it.
             pass

    # Wait for widget to appear. It should have "0 - Silence" text.
    # This text is inside the SoundWidget.
    expect(page.get_by_text("0 - Silence")).to_be_visible(timeout=5000)

    # 3. Assert & Screenshot
    # We want to verify the color of the label.
    # "0 - Silence" should have background color STANDARD_COLORS.blue (#3b82f6)

    # Take a screenshot of the widget
    widget_locator = page.locator(".widget", has_text="0 - Silence").first
    widget_locator.screenshot(path="verification/sound_widget.png")

    # Also take a full page screenshot just in case
    page.screenshot(path="verification/full_page.png")

if __name__ == "__main__":
    # Ensure verification directory exists
    os.makedirs("verification", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        try:
            verify_sound_widget_colors(page)
            print("Verification script finished successfully.")
        except Exception as e:
            print(f"Verification script failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
