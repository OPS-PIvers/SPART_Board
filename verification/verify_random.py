from playwright.sync_api import sync_playwright, expect

def verify_random_widget():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        print("Navigating to home page...")
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")

        print("Looking for Open Tools button...")
        try:
            open_tools_btn = page.get_by_title("Open Tools")
            if open_tools_btn.is_visible():
                print("Clicking Open Tools...")
                open_tools_btn.click()
                page.wait_for_timeout(1000)
            else:
                print("Open Tools button not visible.")
        except Exception as e:
            print(f"Error clicking Open Tools: {e}")

        print("Clicking Random widget...")
        try:
            random_btn = page.get_by_role("button").filter(has_text="Random")
            if random_btn.count() > 0:
                random_btn.first.click()
            else:
                print("Random button not found in dock.")
        except Exception as e:
            print(f"Failed to click 'Random': {e}")

        page.wait_for_timeout(1000)

        # Verify "No Names Provided" content
        # Use simple locator
        content_loc = page.get_by_text("No Names Provided", exact=False)
        expect(content_loc).to_be_visible()

        print("Taking final screenshot...")
        page.screenshot(path="verification/random_widget_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_random_widget()
