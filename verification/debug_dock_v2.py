from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000/")
    page.wait_for_timeout(2000)

    try:
        page.get_by_title("Open Tools").click()
        print("Clicked Open Tools")
        page.wait_for_timeout(1000)
    except:
        print("Open Tools button not found (maybe already expanded?)")

    try:
        dock = page.get_by_test_id("dock")
        print("Dock content:")
        print(dock.inner_text())
    except:
        print("Dock not found")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
