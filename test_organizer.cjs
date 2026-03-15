const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to the app
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Give the dashboard time to load

    // Click the bottom center button with 4 squares icon to open the dock
    // It's a button, try to find it via its specific classes or position
    const dockToggleButton = page.locator('button.w-12.h-12.rounded-full.bg-slate-800').first();

    // OR try finding by clicking the exact center bottom
    await page.mouse.click(page.viewportSize().width / 2, page.viewportSize().height - 40);
    await page.waitForTimeout(1000);

    // Add Graphic Organizer from the dock
    const tool = page.locator('button:has-text("Organizer")').first();
    if (await tool.count() > 0) {
        console.log("Clicking tool via evaluate");
        await tool.evaluate((el) => el.click());
        await page.waitForTimeout(2000);
    } else {
        console.log("Could not find organizer tool");
    }

    // Take a screenshot
    await page.screenshot({ path: path.join(__dirname, 'organizer_widget.png'), fullPage: true });
    console.log("Screenshot taken.");

  } catch (e) {
    console.error("Error during playwright test:", e);
  } finally {
    if (browser) await browser.close();
  }
})();
