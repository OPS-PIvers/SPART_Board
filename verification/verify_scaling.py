from playwright.sync_api import sync_playwright
import time

def verify_scaling():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})

        # 1. Load the app
        print("Loading app...")
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")

        # 2. Check for "Open Tools" button and click it
        try:
            open_tools_btn = page.get_by_title("Open Tools")
            if open_tools_btn.count() > 0:
                print("Clicking 'Open Tools'...")
                open_tools_btn.click(force=True) # Maybe force here too just in case
                time.sleep(1) # Animation
        except Exception as e:
            print(f"Error opening tools: {e}")

        # 3. Look for 'Routines' widget
        routines_btn = page.get_by_text("Routines")
        if routines_btn.count() > 0:
            print("Found 'Routines', clicking...")
            routines_btn.click(force=True) # Use force=True for dnd-kit items
            time.sleep(1) # Wait for widget to appear

            # 4. Now we have the widget.
            page.screenshot(path="verification/scaling_default.png")
            print("Screenshot taken: verification/scaling_default.png")

            # 5. Select a routine
            print("Selecting a routine...")
            try:
                # Find "Think-Pair-Share"
                tps = page.get_by_text("Think-Pair-Share").first
                if tps.count() > 0:
                   tps.click(force=True)
                   time.sleep(1)
                   page.screenshot(path="verification/scaling_content.png")
                   print("Screenshot taken: verification/scaling_content.png")
                else:
                    print("Think-Pair-Share not found. Dumping text:")
                    # print(page.inner_text("body"))

                # 6. Test Scaling
                print("Resizing window to small size (600x600)...")
                page.set_viewport_size({"width": 600, "height": 600})
                time.sleep(1)
                page.screenshot(path="verification/scaling_small.png")
                print("Screenshot taken: verification/scaling_small.png")

            except Exception as e:
                print(f"Could not select routine: {e}")

        else:
            print("Routines tool not found in dock.")

        browser.close()

if __name__ == "__main__":
    verify_scaling()
