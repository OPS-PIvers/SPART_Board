const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the dashboard
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Wait for the app to load
    await page.waitForSelector('.dashboard-container', { timeout: 10000 }).catch(() => {});

    // Open the tools dock
    const toolsButton = await page.$('button[aria-label="Tools"]');
    if (toolsButton) {
        await toolsButton.click();
        await page.waitForTimeout(1000);

        // Find and click the organizer tool
        const organizerTool = await page.getByText('Organizer').first();
        if (organizerTool) {
            await organizerTool.click();
            await page.waitForTimeout(2000);
        }
    }

    // Take a screenshot
    await page.screenshot({ path: path.join(__dirname, 'organizer_widget.png'), fullPage: true });
    console.log("Screenshot taken.");

  } catch (e) {
    console.error("Error during playwright test:", e);
  } finally {
    await browser.close();
  }
})();
