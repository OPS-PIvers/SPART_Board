
import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        await page.goto('http://localhost:3000')
        await asyncio.sleep(5)

        # Expand dock
        open_tools_btn = page.locator('button[title="Open Tools"]')
        if await open_tools_btn.count() > 0:
            print("Expanding dock...")
            await open_tools_btn.click()
            await asyncio.sleep(2)

        # Add Note
        print("Finding NOTE button...")
        note_btn = page.locator('button').filter(has_text="NOTE").first
        box = await note_btn.bounding_box()
        if box:
            await page.mouse.click(box['x'] + box['width']/2, box['y'] + box['height']/2)
            print("Clicked NOTE button")

        await asyncio.sleep(2)

        # Open Menu
        print("Opening Menu...")
        await page.click('button[title="Open Menu"]')
        await asyncio.sleep(1)

        # Click Style
        print("Clicking Style...")
        await page.get_by_role("button", name="Global Style").click()
        await asyncio.sleep(1)

        # Set Window Transparency to 0
        print("Setting Window Transparency to 0...")
        window_slider = page.locator('input.accent-brand-blue-primary:visible')
        await window_slider.fill("0")
        await asyncio.sleep(0.5)

        # Switch to Dock tab
        print("Switching to Dock tab...")
        await page.locator('button').filter(has_text="Dock").first.click()
        await asyncio.sleep(1)

        # Set Dock Transparency to 0
        print("Setting Dock Transparency to 0...")
        dock_slider = page.locator('input.accent-brand-blue-primary:visible')
        await dock_slider.fill("0")
        await asyncio.sleep(0.5)

        # Save styles
        print("Saving styles...")
        await page.get_by_role("button", name="Save").click()
        await asyncio.sleep(1)

        # Close sidebar using X button
        print("Closing Sidebar...")
        # Try to find the close button more reliably
        close_btn = page.locator('button:has(svg.lucide-x)').first
        if await close_btn.count() > 0:
            await close_btn.click()
        else:
            await page.keyboard.press("Escape")

        await asyncio.sleep(2)

        os.makedirs('verification', exist_ok=True)
        await page.screenshot(path='verification/invisible_containers_final.png')
        print("Screenshot saved to verification/invisible_containers_final.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
