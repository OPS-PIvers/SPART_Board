from playwright.sync_api import Page, expect, sync_playwright

def verify_feature(page: Page):
    page.goto("http://localhost:3000/")
    page.wait_for_timeout(2000)

    # Open Settings Modal
    page.locator('button', has=page.locator('svg.lucide-settings')).first.click()
    page.wait_for_timeout(1000)

    # Click Feature Permissions Tab
    page.get_by_role('tab', name='Feature Permissions').click(force=True)
    page.wait_for_timeout(1000)

    # Filter to specific widget to simplify UI (Classes)
    # The actual search input isn't a simple text box, we can just click the settings cog directly
    # for the Classes widget card using the complex locator from memory:
    settings_cog = page.locator('div.bg-white').filter(has=page.locator('p.text-xs.text-slate-500', has_text='classes')).last.locator('button', has=page.locator('svg.lucide-settings'))
    settings_cog.click(force=True)
    page.wait_for_timeout(1000)

    # Verify our new configuration panel is visible
    expect(page.get_by_text('Building Defaults').first).to_be_visible()
    page.wait_for_timeout(1000)

    # Try interacting with the default roster source toggles
    page.get_by_role('button', name='ClassLink Integration').first.click(force=True)
    page.wait_for_timeout(1000)

    page.get_by_role('button', name='Manual Lists').first.click(force=True)
    page.wait_for_timeout(1000)

    page.screenshot(path="verification/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="verification/video")
        page = context.new_page()
        try:
            verify_feature(page)
        finally:
            context.close()
            browser.close()
