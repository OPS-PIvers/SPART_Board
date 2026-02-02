from playwright.sync_api import sync_playwright
import time

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 400, 'height': 800})
        page = context.new_page()
        page.goto('http://localhost:3000/')
        page.locator('button').last.click()
        time.sleep(1)
        page.get_by_role("button", name="Routines").click(force=True)
        time.sleep(1)
        page.screenshot(path='verification/final_verification.png')
        browser.close()

if __name__ == '__main__':
    verify()
