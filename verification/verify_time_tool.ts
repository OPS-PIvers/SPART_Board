import { test, expect, chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the app (assuming it's running on localhost:5173 or similar, need to check)
    // For now, I'll assume standard Vite port.
    await page.goto('http://localhost:5173');

    // Wait for the dashboard to load
    await expect(page.getByText('Spartan Board')).toBeVisible({ timeout: 10000 });

    // Open the widget drawer/sidebar if not already open (usually it is or via a button)
    // Assuming we need to add a Time Tool widget.
    // Click the 'Widgets' button in the sidebar/dock.
    // The sidebar structure might be complex. Let's look for a known way to add widgets.

    // Actually, I should probably check if I can add a widget via the UI.
    // Let's try to find the "Time Tool" in the sidebar.

    // Open sidebar if closed
    const sidebarTrigger = page.locator('[aria-label="Toggle Sidebar"]'); // Guessing locator
    if (await sidebarTrigger.isVisible()) {
        await sidebarTrigger.click();
    }

    // Click 'Widgets' tab/section
    await page.getByText('Widgets').click();

    // Drag and drop Time Tool? Or click to add?
    // Usually click to add in this app context (based on memory/codebase patterns).
    await page.getByText('Time Tool').click();

    // Now Time Tool should be on the dashboard.
    const timeTool = page.locator('.time-tool-widget'); // Guessing class, might need adjustment
    await expect(timeTool).toBeVisible();

    // Start the timer
    const playButton = timeTool.locator('button').filter({ has: page.locator('svg') }).first(); // Play button usually has an icon
    await playButton.click();

    // Wait a bit for animation
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'verification/time_tool_running.png' });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
