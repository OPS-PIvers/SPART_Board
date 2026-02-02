import os
import time
from playwright.sync_api import sync_playwright, expect

def verify_drawing():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        try:
            print("Navigating...")
            page.goto("http://localhost:3000/")

            page.wait_for_selector('button[title="Open Tools"]', timeout=20000).click()
            time.sleep(1)

            print("Adding Drawing widget...")
            page.get_by_text("Draw", exact=True).click(force=True)

            time.sleep(2)

            widgets = page.locator('.widget')
            draw_widget = widgets.nth(0)

            # Resize Drawing widget to be 2x larger
            print("Resizing Drawing widget...")
            handle = draw_widget.locator('.resize-handle.absolute.bottom-0.right-0').first
            box = handle.bounding_box()
            page.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2)
            page.mouse.down()
            page.mouse.move(box['x'] + 400, box['y'] + 300)
            page.mouse.up()

            time.sleep(1)

            # Draw something
            print("Drawing...")
            canvas = draw_widget.locator('canvas')
            c_box = canvas.bounding_box()

            # Draw a square in the middle of the canvas
            start_x = c_box['x'] + c_box['width'] * 0.25
            start_y = c_box['y'] + c_box['height'] * 0.25
            end_x = c_box['x'] + c_box['width'] * 0.75
            end_y = c_box['y'] + c_box['height'] * 0.75

            page.mouse.move(start_x, start_y)
            page.mouse.down()
            page.mouse.move(end_x, start_y)
            page.mouse.move(end_x, end_y)
            page.mouse.move(start_x, end_y)
            page.mouse.move(start_x, start_y)
            page.mouse.up()

            time.sleep(1)
            print("Taking screenshot...")
            page.screenshot(path="verification/drawing_verification.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="verification/drawing_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_drawing()
