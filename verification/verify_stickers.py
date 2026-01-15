from playwright.sync_api import sync_playwright
import time

def verify_stickers():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        connected = False
        for url in ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"]:
            try:
                print(f"Trying {url}...")
                page.goto(url, timeout=5000)
                connected = True
                print(f"Connected to {url}")
                break
            except Exception as e:
                print(f"Failed {url}: {e}")

        if not connected:
            print("Could not connect to any port")
            return

        try:
            page.wait_for_load_state("networkidle")

            # Open Tools
            try:
                btn = page.get_by_role("button", name="Open Tools")
                if btn.is_visible():
                    btn.click(timeout=3000)
                    print("Clicked Open Tools")
            except:
                print("Dock might be open or button not found")

            # Click Stickers
            page.get_by_role("button", name="Stickers").click()
            print("Clicked Stickers")

            # Wait for Sticker Book
            page.wait_for_selector("text=Sticker Collection")
            print("Sticker book open")

            # Drag
            source = page.locator(".grid > div").first
            target = page.locator("#dashboard-root")

            print("Dragging sticker...")
            source.drag_to(target, target_position={"x": 300, "y": 300})

            page.wait_for_timeout(1000)

            page.screenshot(path="verification/stickers.png")
            print("Screenshot saved")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_stickers()
