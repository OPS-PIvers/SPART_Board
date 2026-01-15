from playwright.sync_api import sync_playwright

def debug_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")
        page.wait_for_timeout(5000) # Wait 5 seconds
        page.screenshot(path="verification/debug_home.png")
        print("Debug screenshot taken.")
        browser.close()

if __name__ == "__main__":
    debug_page()
