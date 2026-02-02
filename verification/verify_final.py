from playwright.sync_api import sync_playwright, expect

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 400, 'height': 800})
        page = context.new_page()
        page.goto('http://localhost:3000/')

        # Open Tools via title
        page.get_by_title("Open Tools").click()

        # Click Routines
        page.get_by_role("button", name="Routines").click()

        # Wait for the library to be visible
        expect(page.get_by_text("Library (")).to_be_visible()

        page.screenshot(path='verification/final_verification.png')
        browser.close()

if __name__ == '__main__':
    verify()
