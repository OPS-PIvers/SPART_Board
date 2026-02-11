from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:3000/")
        page.wait_for_selector('body', state='visible')
        print(page.title())
        page.screenshot(path="verification/home_page.png")
    except Exception as e:
        print(e)
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
