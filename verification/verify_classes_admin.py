import time
from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to dashboard...")
        page.goto("http://localhost:3000/")
        time.sleep(2)

        print("Opening Admin Settings...")
        page.get_by_title('Admin Settings').click()
        time.sleep(1)

        print("Switching to Feature Permissions tab...")
        page.get_by_role('tab', name='Feature Permissions').click()
        time.sleep(1)

        print("Looking for Classes widget card gear button...")

        # In the previous run, we clicked the 'Save' icon (the last button).
        # The gear icon is the second to last button.
        classes_card = page.locator('div.bg-white').filter(has_text='Class').filter(has_text='classes').last

        # Get the gear button specifically (it's next to the save button, so it's the second to last)
        buttons = classes_card.locator('button')
        # Wait for the buttons to be ready
        time.sleep(1)

        # The gear button has a settings icon, we can try to find it by SVG class or just use nth(-2)
        gear_button = buttons.nth(buttons.count() - 2)

        print(f"Clicking gear button for Classes widget...")
        gear_button.click(force=True)
        time.sleep(1)

        print("Taking screenshot of configuration modal...")
        modal = page.locator('.fixed.inset-0.z-modal').last
        expect(modal).to_be_visible()

        # Take a screenshot showing the modal
        page.screenshot(path="/app/verification/classes_admin_config.png")
        print("Screenshot saved to /app/verification/classes_admin_config.png")

        print("Verification completed successfully!")
        browser.close()

if __name__ == "__main__":
    run()
