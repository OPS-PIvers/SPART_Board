import { test } from '@playwright/test';
test('quick screenshot', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(5000);
  // Just click the center of the screen to enter a board if one is there
  await page.mouse.click(500, 500);
  await page.waitForTimeout(2000);
  // Click bottom center for dock
  await page.mouse.click(500, 950);
  await page.waitForTimeout(2000);
  // Click roughly where materials tool is (it was near the right)
  // Let's use locator instead for tool
  const materialTool = page.locator('[data-tool-id="materials"]');
  if (await materialTool.isVisible()) {
    await materialTool.click({ force: true });
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/verification/final_attempt.png' });
});
