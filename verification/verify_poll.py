
from playwright.sync_api import Page, expect, sync_playwright

def test_poll_widget_magic_ui(page: Page):
  """
  This test verifies that the Magic Generation UI is present in the Poll Widget settings.
  """

  print("Step 1: Navigate to application")
  page.goto("http://localhost:3000")

  print("Step 2: Wait for app load")
  expect(page.get_by_title("Open Menu")).to_be_visible(timeout=10000)

  # Close the "Welcome! Board created" toast if it exists, as it might block clicks
  toast_close = page.locator("button.Toastify__close-button")
  if toast_close.is_visible():
      toast_close.click()

  print("Step 3: Open Tools Dock")
  dock_toggle = page.get_by_title("Open Tools")
  if dock_toggle.is_visible():
      dock_toggle.click()
      page.wait_for_timeout(500) # Wait for animation

  print("Step 4: Add Poll Widget")
  # Click the 'Poll' button in the dock
  # Force click in case of overlay/pointer-events issues
  page.get_by_text("Poll", exact=False).click(force=True)

  print("Step 5: Locate the widget")
  # Wait for widget to appear
  poll_text = page.get_by_text("VOTE NOW", exact=False)
  expect(poll_text).to_be_visible(timeout=10000)

  # Locate the widget container (GlassCard)
  # We can find the parent of the text.
  # The structure is GlassCard -> div.flip-container -> div.flipper -> div.front -> div.overflow-auto -> div.flex-col -> text
  # We can just click the text itself; the event bubbles up to GlassCard.

  print("Step 6: Click widget to open tools menu")
  # Ensure we don't click a button inside the widget
  poll_text.click()

  print("Step 7: Click Settings button")
  # The menu is rendered in a Portal, so it's at the body level.
  # It has a button with title="Settings". Use exact=True to avoid 'Admin Settings'.
  settings_btn = page.get_by_title("Settings", exact=True)
  expect(settings_btn).to_be_visible(timeout=5000)
  settings_btn.click()

  print("Step 8: Verify Magic Generation UI")
  # The widget flips to show settings.
  magic_header = page.get_by_text("Magic Generation")
  expect(magic_header).to_be_visible(timeout=5000)

  print("Step 9: Verify Magic Input fields")
  # Verify the MagicInput component is rendered
  placeholder = page.get_by_placeholder("e.g. 4 options for a math quiz about fractions")
  expect(placeholder).to_be_visible()

  print("Success: Magic UI found.")
  page.screenshot(path="/app/verification/poll_magic_ui_success.png")

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    # Set viewport size to ensure things are visible
    page.set_viewport_size({"width": 1280, "height": 720})

    try:
      test_poll_widget_magic_ui(page)
      print("Verification successful!")
    except Exception as e:
      print(f"Verification failed: {e}")
      page.screenshot(path="/app/verification/failure_retry_2.png")
      raise
    finally:
      browser.close()
