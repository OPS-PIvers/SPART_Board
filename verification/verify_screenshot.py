from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_screenshot(page: Page):
    """
    Verifies that the screenshot feature works by interacting with a widget's camera button.
    """

    # Enable console log capturing
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

    # 1. Arrange: Go to the dashboard.
    page.goto("http://localhost:3000")

    # Wait for the dashboard to load. If authentication is required, we might need to bypass it or sign in.
    # Based on the memory, VITE_AUTH_BYPASS might be needed if not set.
    # The current environment might not have it set, so we might see the Login screen.
    # If we see the login screen, we can try to bypass or just fail and inform the user.
    # However, let's see what happens.

    # Check if we are on the login screen
    if page.get_by_text("Sign in with Google").is_visible():
        print("Login screen detected. The environment might not be configured for bypass.")
        # We can't easily sign in with Google in a headless script without credentials.
        # But wait, the user instructions said "VITE_AUTH_BYPASS='true'" is available.
        # If it's not set in the environment, we might be stuck.
        # Let's assume for now the dev server was started with the env vars from the system or .env file.
        # If not, we might need to restart the server with the env var.
        pass

    # Wait for dashboard to be visible
    # We look for the dock or sidebar or something characteristic.
    try:
        expect(page.get_by_text("Waking up Classroom...")).not_to_be_visible(timeout=10000)
    except:
        pass

    # Open the Dock if not already visible (it seems visible by default based on DashboardView)

    # We need to add a widget. I don't know the exact UI to add a widget without seeing it.
    # Let's try to find a button to add a widget. Usually there is a dock with icons.
    # I'll take a screenshot first to see what the dashboard looks like.
    page.screenshot(path="verification/dashboard_initial.png")

    # Assuming there's a dock with icons. Let's try to click a known widget icon if we can guess.
    # Or maybe there's a default widget?
    # Let's try to find a widget on screen.

    # If no widgets are present, we need to add one.
    # The dock usually has icons for 'timer', 'draw', etc.
    # Let's try to find a button with an aria-label or title.
    # I'll look for "Draw" or "Timer".

    # Let's try to click a generic button in the dock.
    # Since I don't know the exact selectors, I will look for buttons in the dock area.
    # The Dock component likely renders buttons.

    # Let's try to click the first button in the dock that is not a system button.
    # Or search for "Timer" text if it exists.

    # IMPORTANT: Since I can't interactively debug, I will try to inspect the page content in the script
    # and print it if I can't find what I want.

    # Let's assume we can find a widget or add one.
    # I'll try to find a button with 'Timer' or 'Draw' tooltip or text.

    # For now, let's try to find any element with class 'widget'.
    widgets = page.locator(".widget")
    if widgets.count() == 0:
        print("No widgets found. Attempting to add one.")
        # Try to find the dock.
        dock = page.locator(".dock-container") # Guessing class name
        if dock.count() == 0:
             # Try to find by role
             pass

        # Let's try to find a button with an icon.
        # I'll try to click a button that looks like a widget launcher.
        # Maybe I can just use `page.get_by_role("button")` and print their names.
        buttons = page.get_by_role("button").all()
        print(f"Found {len(buttons)} buttons.")
        for i, btn in enumerate(buttons):
            txt = btn.text_content()
            label = btn.get_attribute("aria-label")
            title = btn.get_attribute("title")
            print(f"Button {i}: Text='{txt}', Label='{label}', Title='{title}'")

            # Heuristic to find a widget button
            if "Draw" in (label or "") or "Draw" in (title or "") or "Draw" in (txt or ""):
                print("Clicking Draw button")
                btn.click()
                break
            if "Timer" in (label or "") or "Timer" in (title or "") or "Timer" in (txt or ""):
                print("Clicking Timer button")
                btn.click()
                break

    # Try to open the Dock
    open_dock_btn = page.get_by_title("Open Tools")
    if open_dock_btn.is_visible():
        print("Clicking Open Tools button")
        open_dock_btn.click()
        # Wait for dock to expand
        time.sleep(1)

    # Click a tool to add a widget (e.g., Timer)
    # The dock items are buttons with text labels.
    # Let's try to click the button with text "TIMER"
    timer_btn = page.get_by_role("button", name="TIMER")
    if timer_btn.is_visible():
        print("Adding Timer widget")
        timer_btn.click()
    else:
        # Try finding by icon or class if text doesn't work (text is usually uppercase in CSS but maybe not in DOM)
        # The DockItem renders a span with text.
        print("Timer button not found directly. Trying text match.")
        page.get_by_text("TIMER").click()

    # Wait for a widget to appear
    expect(page.locator(".widget").first).to_be_visible(timeout=5000)

    # Get the first widget
    widget = page.locator(".widget").first

    # Find the camera button inside the widget
    camera_btn = widget.locator("button[title='Take Screenshot']")

    # Verify camera button is visible
    if not camera_btn.is_visible():
        print("Camera button not found. Maybe it's a blacklisted widget or the button isn't rendering.")
        # Take screenshot for debug
        page.screenshot(path="verification/debug_no_camera.png")
        return

    print("Camera button found.")

    # 2. Act: Click the camera button and handle download.
    with page.expect_download() as download_info:
        camera_btn.click()

    download = download_info.value
    path = download.path()
    print(f"Download started: {download.suggested_filename}")

    # Save the downloaded file to verify
    download.save_as("verification/" + download.suggested_filename)

    # 3. Screenshot the widget with the camera button
    widget.screenshot(path="verification/widget_screenshot.png")

    print("Verification successful.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_screenshot(page)
        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
