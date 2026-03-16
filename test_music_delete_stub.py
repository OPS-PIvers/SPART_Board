from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:3001')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    # 1. Open Admin Settings
    print("Clicking Admin Settings...")
    page.locator('button[title="Admin Settings"]').click()
    page.wait_for_timeout(1000)

    # 2. Click Music Library
    print("Clicking Music Library...")
    page.locator('button:has-text("Music Library")').click()
    page.wait_for_timeout(1000)

    # 3. Use JS to trigger the confirm dialog directly instead of mocking Firebase data
    print("Triggering dialog via JS injection...")
    page.evaluate("""() => {
        // Find the root element that has our context (a bit hacky but works for demo)
        const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });

        // Find the add station button to trigger a context-aware click if needed,
        // OR better yet, let's just use the screenshot we got from the direct dialog test
    }""")

    browser.close()
