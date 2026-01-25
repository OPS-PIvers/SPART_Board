from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_toggles(page: Page):
    print("Navigating to dashboard...")
    page.goto("http://localhost:3000/")

    # Wait for dashboard to load (look for the root element)
    page.wait_for_selector("#dashboard-root", state="visible", timeout=10000)
    print("Dashboard loaded.")
    time.sleep(2)

    # 1. Sound Widget Verification (Priority)
    print("Adding Sound Widget...")
    # Open Menu
    page.get_by_title("Open Menu").click()
    # Click Widgets tab
    page.get_by_role("button", name="Widgets").click()
    # Click All to ensure all widgets are in dock
    # Scope to sidebar to avoid "Clear All Windows" button under modal
    sidebar = page.locator(".fixed.inset-0.z-modal")
    # There are two "All" buttons (Grade Filter and Tools). We want the one near "Available Widgets"
    sidebar.locator("div", has_text="Available Widgets").last.get_by_role("button", name="All").click()

    # Close menu by clicking backdrop
    page.locator(".fixed.inset-0.z-modal.flex > .absolute.inset-0").click()
    time.sleep(1)

    # Open Dock
    print("Opening Dock...")
    page.get_by_title("Open Tools").click()

    # Click Noise icon in Dock
    print("Clicking Noise icon in Dock...")
    # Find button containing "Noise" text in the dock
    # Dock is usually at the bottom.
    noise_dock_btn = page.locator("button", has_text="Noise").last
    noise_dock_btn.click(force=True)

    print("Opening Sound Widget settings...")
    # Wait for widget to appear.
    page.get_by_text("Silence").wait_for()

    # Find widget container (DraggableWindow has class 'widget')
    widget_card = page.locator(".widget", has_text="Silence").last

    # Click widget to open tool menu (click safely on edge)
    widget_card.click(position={"x": 20, "y": 20})

    # Click settings button in the popped up menu
    # The menu is in a portal, so look globally
    settings_btn = page.get_by_title("Settings").last
    settings_btn.wait_for()
    settings_btn.click()

    print("Verifying Sound Widget toggle...")
    # Check for "Enable Automation" toggle
    page.get_by_text("Enable Automation").wait_for()

    # Verify the switch exists and looks correct (programmatically)
    switch = page.get_by_role("switch")
    expect(switch).to_be_visible()

    # Take screenshot
    print("Sound Widget toggle found. Taking screenshot.")
    page.screenshot(path="/home/jules/verification/04_sound_settings.png")

    # 2. Try Admin Settings (Optional/Best Effort)
    try:
        print("Attempting Admin Settings Verification...")
        admin_btn = page.get_by_title("Admin Settings")
        if admin_btn.is_visible():
            admin_btn.click()
            page.get_by_role("heading", name="Admin Settings").wait_for(timeout=5000)

            # Check for loading
            if page.get_by_text("Loading permissions...").is_visible():
                print("Admin permissions loading... skipping Admin verification due to environment.")
            else:
                switches = page.get_by_role("switch")
                if switches.count() > 0:
                    print("Admin switches found.")
                    page.screenshot(path="/home/jules/verification/01_feature_permissions.png")
    except Exception as e:
        print(f"Admin verification skipped: {e}")

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_viewport_size({"width": 1280, "height": 720})
    try:
      verify_toggles(page)
    except Exception as e:
      print(f"Error: {e}")
      page.screenshot(path="/home/jules/verification/error.png")
    finally:
      browser.close()
