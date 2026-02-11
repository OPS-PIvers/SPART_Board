from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000/")
    page.wait_for_timeout(2000) # Wait for animations

    print("Listing buttons:")
    for btn in page.get_by_role("button").all():
        try:
            label = btn.get_attribute("aria-label") or "No Label"
            text = btn.text_content()
            print(f"Button: Label='{label}', Text='{text}'")
        except:
            pass

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
