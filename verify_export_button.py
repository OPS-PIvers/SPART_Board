from playwright.sync_api import Page, expect, sync_playwright
import os

def verify_export_button(page: Page):
    print("Navigating to dashboard...")
    page.goto("http://localhost:3000/")

    # Wait for dashboard to load
    page.wait_for_timeout(3000)

    # Open Dock if needed
    print("Opening Dock...")
    try:
        open_tools_btn = page.get_by_title("Open Tools")
        if open_tools_btn.is_visible():
             open_tools_btn.click()
             page.wait_for_timeout(1000) # Wait for animation
    except:
        print("Could not find Open Tools button, maybe already open?")

    # Add Scoreboard widget
    print("Adding Scoreboard widget...")
    # Target button containing text "Scores"
    scores_tool = page.get_by_role("button", name="Scores").first
    scores_tool.click(force=True)

    # Wait for widget to appear
    print("Waiting for widget...")
    expect(page.get_by_text("Team 1", exact=False)).to_be_visible(timeout=5000)

    # Click the widget to activate it
    print("Activating widget...")
    # Target the widget using the class "widget" and filtering by text
    widget = page.locator(".widget").filter(has_text="Team 1").last
    widget.click(position={"x": 10, "y": 10})

    # Click settings button in toolbar
    print("Opening settings...")
    # Toolbar appears above. Look for settings icon.
    settings_btn = page.locator(".lucide-settings").last
    settings_btn.click()

    # Verify Export CSV button
    print("Verifying Export CSV button...")
    export_btn = page.get_by_role("button", name="Export CSV")
    export_btn.scroll_into_view_if_needed() # Ensure it's in view
    expect(export_btn).to_be_visible()

    # Take screenshot
    print("Taking screenshot...")
    os.makedirs("/home/jules/verification", exist_ok=True)
    page.screenshot(path="/home/jules/verification/scoreboard_export.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_export_button(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="/home/jules/verification/failure.png")
        finally:
            browser.close()
