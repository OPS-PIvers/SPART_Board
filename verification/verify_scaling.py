import os
import time
from playwright.sync_api import sync_playwright, expect

def verify_scaling():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        try:
            print("Navigating...")
            page.goto("http://localhost:3000/")

            page.wait_for_selector('button[title="Open Tools"]', timeout=20000).click()
            time.sleep(1)

            print("Adding widgets...")
            page.get_by_text("Clock", exact=True).click(force=True)
            page.get_by_text("Traffic", exact=True).click(force=True)
            page.get_by_text("Note", exact=True).click(force=True)

            time.sleep(2)

            widgets = page.locator('.widget')

            # Move Traffic widget
            traffic = widgets.nth(1)
            box = traffic.bounding_box()
            page.mouse.move(box['x'] + 50, box['y'] + 10)
            page.mouse.down()
            page.mouse.move(box['x'] + 300, box['y'] + 10)
            page.mouse.up()

            # Move Note widget
            note = widgets.nth(2)
            box = note.bounding_box()
            page.mouse.move(box['x'] + 50, box['y'] + 10)
            page.mouse.down()
            page.mouse.move(box['x'] + 600, box['y'] + 10)
            page.mouse.up()

            # Resize Clock
            clock = widgets.nth(0)
            handle = clock.locator('.resize-handle.absolute.bottom-0.right-0').first
            box = handle.bounding_box()
            page.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2)
            page.mouse.down()
            page.mouse.move(box['x'] + 200, box['y'] + 100)
            page.mouse.up()

            # Resize Traffic Light (now at index 1)
            traffic = widgets.nth(1)
            handle = traffic.locator('.resize-handle.absolute.bottom-0.right-0').first
            box = handle.bounding_box()
            page.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2)
            page.mouse.down()
            page.mouse.move(box['x'] + 100, box['y'] + 300)
            page.mouse.up()

            time.sleep(2)
            print("Taking final screenshot...")
            page.screenshot(path="verification/resized_widgets_v2.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="verification/error_screenshot.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_scaling()
