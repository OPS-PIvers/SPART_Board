
from playwright.sync_api import sync_playwright, expect

def verify_glassmorphism():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        try:
            print("Navigating to home page...")
            page.goto("http://localhost:3000")

            # Wait for dashboard to load (look for the sidebar menu button)
            print("Waiting for sidebar...")
            expect(page.get_by_title("Open Menu")).to_be_visible(timeout=10000)

            # Open the Dock
            print("Opening Dock...")
            open_tools_btn = page.get_by_title("Open Tools")
            if open_tools_btn.is_visible():
                open_tools_btn.click()
                # Wait for animation
                page.wait_for_timeout(1000)

            # Add a Clock Widget
            print("Adding Clock Widget...")
            # The dock items are buttons with the tool label
            clock_btn = page.get_by_role("button", name="Clock").first
            expect(clock_btn).to_be_visible()
            clock_btn.click()

            # Wait for widget to appear
            print("Waiting for widget...")
            widget = page.locator(".widget").first
            expect(widget).to_be_visible()

            # Wait a bit for widget content
            page.wait_for_timeout(1000)

            # Flip widget to show settings (and opacity control)
            print("Flipping widget...")
            # Target the settings button via the icon since it lacks a title/aria-label
            # The icon is likely an svg with class 'lucide-settings'
            settings_icon = widget.locator("svg.lucide-settings")
            settings_icon.click()

            # Wait for flip animation and settings content
            page.wait_for_timeout(1000)

            # Verify Opacity control is visible
            print("Verifying Opacity control...")
            opacity_label = widget.get_by_text("Opacity")
            expect(opacity_label).to_be_visible()

            # Take screenshot
            print("Taking screenshot...")
            screenshot_path = "verification_glassmorphism.png"
            page.screenshot(path=screenshot_path, full_page=False)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="error_screenshot.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_glassmorphism()
