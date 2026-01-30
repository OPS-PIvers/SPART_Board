from playwright.sync_api import Page, expect, sync_playwright
import time
import re

def test_schedule_reset(page: Page):
    print("Navigating to app...")
    page.goto("http://localhost:3000")

    print("Waiting for Open Tools button...")
    try:
        page.wait_for_selector("button[title='Open Tools']", timeout=15000)
        print("App loaded.")
    except:
        print("Timeout waiting for app load.")
        page.screenshot(path="verification/timeout_load.png")

    # Check if collapsed
    open_tools_btn = page.get_by_title("Open Tools")
    if open_tools_btn.is_visible():
        print("Dock is collapsed. Opening...")
        open_tools_btn.click()
        time.sleep(1) # Animation

    # Now check for Schedule widget
    schedule_widget = page.locator(".widget").filter(has_text="Morning Meeting").first

    if not schedule_widget.is_visible():
        print("Schedule widget not found. Attempting to add it...")

        schedule_dock_btn = page.locator("button").filter(has_text="Schedule").last

        if schedule_dock_btn.count() > 0:
             print("Found Schedule button in dock, clicking...")
             schedule_dock_btn.click(force=True)
        else:
             print("Schedule button not found in visible dock items.")
             page.screenshot(path="verification/dock_state.png")
             pass

    # Wait for it to appear
    try:
        expect(schedule_widget).to_be_visible(timeout=5000)
    except:
        print("Schedule widget still not visible.")
        page.screenshot(path="verification/missing_widget.png")
        raise

    # Verify items exist
    print("Verifying items...")
    expect(page.get_by_text("Morning Meeting")).to_be_visible()

    # Click on "Morning Meeting" to mark as done
    print("Marking item as done...")
    page.get_by_text("Morning Meeting").click()

    # Verify it is struck through or styled as done.
    meeting_text = page.get_by_text("Morning Meeting")
    expect(meeting_text).to_have_class(re.compile(r"line-through"))

    # Hover over widget to show reset button
    print("Hovering to show Reset button...")
    # Hover over the text to ensure we are inside the widget
    page.get_by_text("Morning Meeting").hover()
    time.sleep(1) # Wait for transition

    # Verify reset button is visible
    reset_btn = schedule_widget.locator("button[title='Reset all items']")

    # Debug: Check if attached
    if reset_btn.count() == 0:
        print("Reset button not found in DOM!")
        page.screenshot(path="verification/debug_no_button.png")
    else:
        print("Reset button found in DOM.")

    expect(reset_btn).to_be_visible()

    # Take screenshot BEFORE reset
    page.screenshot(path="verification/schedule_before_reset.png")

    # Click reset
    print("Clicking Reset...")
    reset_btn.click()

    # Verify item is NOT done
    print("Verifying reset...")
    expect(meeting_text).not_to_have_class(re.compile(r"line-through"))

    # Take screenshot AFTER reset
    page.screenshot(path="verification/schedule_after_reset.png")
    print("Verification complete.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_schedule_reset(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
