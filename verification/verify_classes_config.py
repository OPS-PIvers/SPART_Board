from playwright.sync_api import Page, expect, sync_playwright

def verify_feature(page: Page):
    page.goto("http://localhost:3000/")
    page.wait_for_timeout(2000)

    # Open Settings Modal
    settings_button = page.locator(
        "button",
        has=page.locator("svg.lucide-settings"),
    ).first
    expect(settings_button).to_be_visible()
    settings_button.click()

    # Click Feature Permissions Tab
    feature_permissions_tab = page.get_by_role("tab", name="Feature Permissions")
    expect(feature_permissions_tab).to_be_visible()
    feature_permissions_tab.click()

    # Filter to specific widget to simplify UI (Classes)
    # The actual search input isn't a simple text box, we can just click the settings cog directly
    # for the Classes widget card using the complex locator from memory:
    settings_cog = (
        page.locator("div.bg-white")
        .filter(
            has=page.locator(
                "p.text-xs.text-slate-500",
                has_text="classes",
            )
        )
        .last.locator("button", has=page.locator("svg.lucide-settings"))
    )
    expect(settings_cog).to_be_visible()
    settings_cog.click()

    # Verify our new configuration panel is visible
    building_defaults_header = page.get_by_text("Building Defaults").first
    expect(building_defaults_header).to_be_visible()

    # Try interacting with the default roster source toggles
    classlink_button = page.get_by_role(
        "button",
        name="ClassLink Integration",
    ).first
    expect(classlink_button).to_be_visible()
    expect(classlink_button).to_be_enabled()
    classlink_button.click()

    manual_lists_button = page.get_by_role(
        "button",
        name="Manual Lists",
    ).first
    expect(manual_lists_button).to_be_visible()
    expect(manual_lists_button).to_be_enabled()
    manual_lists_button.click()

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
