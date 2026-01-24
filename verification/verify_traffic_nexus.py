import time
import re
import os
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 720})
    page = context.new_page()

    # Enable console logs
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

    print("Navigating to app...")
    page.goto("http://localhost:3000")

    # Wait for app to load
    page.wait_for_selector('button[title="Open Tools"]', state="visible", timeout=20000)

    # 2. Open Dock
    print("Opening Dock...")
    page.get_by_title("Open Tools").click()
    time.sleep(1)

    # 3. Add Widgets
    print("Adding Timer from Dock...")
    # Use exact text matching if possible or role to be more specific
    page.locator("button").filter(has_text="Timer").first.click(force=True)
    time.sleep(1)

    print("Adding Traffic from Dock...")
    page.locator("button").filter(has_text="Traffic").first.click(force=True)
    time.sleep(1)

    # Close dock
    print("Closing Dock...")
    page.get_by_title("Minimize Toolbar").click()
    time.sleep(1)

    # 4. Configure Nexus
    print("Finding Traffic Light Widget...")
    # We look for the green light button to confirm widget exists, then go up to the main container
    green_light = page.locator(".light-green").first
    expect(green_light).to_be_visible()

    # The widget container is the GlassCard (absolute positioned div)
    # We can find it by going up from the light button
    widget_card = green_light.locator("xpath=ancestor::div[contains(@class, 'widget')]").first

    print("Clicking Traffic Widget 'safe spot' to show tools...")
    box = widget_card.bounding_box()
    if box:
        # Click near top-left to avoid the inner buttons (lights)
        # The widget has p-2 (8px) padding, so clicking at 5,5 is inside the card but outside the inner content
        print(f"Clicking at {box['x'] + 10}, {box['y'] + 10}")
        page.mouse.click(box["x"] + 10, box["y"] + 10)
    else:
        print("Bounding box not found, trying element click...")
        widget_card.click(position={"x": 10, "y": 10})

    time.sleep(1)

    # Check for Settings button in the portal
    print("Waiting for Settings button...")
    try:
        # The tool menu is rendered in a portal at the body level
        settings_btn = page.locator("button[title='Settings']").last
        expect(settings_btn).to_be_visible(timeout=5000)
        settings_btn.click()
    except:
        print("Settings button not visible! Dumping page.")
        page.screenshot(path="verification/debug_no_settings_2.png")
        raise

    print("Settings opened. Toggling Sync...")
    time.sleep(1) # Animation

    # Toggle Sync
    # We need to find the specific switch. Since we just opened this widget's settings,
    # and it should be the only one active or on top.

    # Sometimes "Sync with Timer" might not be immediately visible if we didn't flip?
    # Settings button flips the card.

    try:
        page.wait_for_selector("text=Sync with Timer", timeout=5000)
        page.get_by_role("switch").click()
    except:
        print("Switch not found. Screenshotting.")
        page.screenshot(path="verification/debug_settings_flip.png")
        raise

    print("Closing Settings...")
    # Click the DONE button inside the traffic widget card
    widget_card.get_by_text("DONE").click()
    time.sleep(1)

    # 5. Test Interaction
    print("Starting Timer...")
    # Find Timer Start Button.
    # Note: If multiple timers, this finds the first. We only added one.
    start_btn = page.get_by_text("START")
    start_btn.click()

    print("Verifying Green Light Active...")
    # The light gets 'active' class and 'bg-green-500'
    # The selector '.light-green' is the button.
    # We check if it has 'active' class.
    expect(green_light).to_have_class(re.compile(r"active"), timeout=5000)

    print("Success! Traffic light turned green on timer start.")

    # Optional: Test Pause -> Yellow
    print("Pausing Timer...")
    # The button text changes to STOP or we can look for the pause/stop icon/text.
    # Usually the timer toggle button changes content.
    # Let's assume hitting the same main button pauses it if it's a toggle,
    # or there is a separate pause.
    # Reading TimeToolWidget would verify, but let's stick to the core Nexus requirement (Start -> Green).

    page.screenshot(path="verification/traffic_nexus_verified.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
