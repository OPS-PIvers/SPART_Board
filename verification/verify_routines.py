from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 1280, 'height': 720}
    )
    page = context.new_page()

    # 1. Navigate to the app
    print("Navigating to app...")
    page.goto("http://localhost:3000")

    # 2. Wait for Dashboard
    # The dashboard usually has a grid or some element.
    # Let's wait for the Open Tools button or the Dock.
    print("Waiting for Dock/Tools button...")

    # Try to find "Open Tools" button
    open_tools_btn = page.get_by_title("Open Tools")
    if open_tools_btn.is_visible():
        print("Clicking Open Tools...")
        open_tools_btn.click()

    # 3. Add Instructional Routines Widget
    print("Adding Instructional Routines widget...")
    # The dock item has label "Routines"
    # It's a button with text "Routines"
    routines_btn = page.get_by_role("button", name="Routines")
    expect(routines_btn).to_be_visible()
    routines_btn.click()

    # 4. Wait for widget to appear
    print("Waiting for widget...")
    # The widget initial state has "Library" text
    expect(page.get_by_text("Library", exact=False).first).to_be_visible()

    # 5. Take screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
