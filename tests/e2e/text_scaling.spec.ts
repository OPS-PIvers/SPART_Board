import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Text Widget scaling verification', async ({ page }) => {
  test.setTimeout(60000);

  // 1. Load dashboard
  await page.goto('/');

  // 2. Open Dock and Add Text Widget
  const openTools = page.getByTitle('Open Tools');
  await expect(openTools).toBeVisible({ timeout: 10000 });
  await openTools.click();

  const noteButton = page.getByRole('button', { name: /Note/i }).first();
  await expect(noteButton).toBeVisible({ timeout: 10000 });
  await noteButton.click({ force: true });

  const minimize = page.getByTitle('Minimize Toolbar');
  await expect(minimize).toBeVisible({ timeout: 10000 });
  await minimize.click();

  // 3. Locate Text Widget
  const textWidget = page
    .locator('.widget')
    .filter({ has: page.locator('[contenteditable]') })
    .first();
  await expect(textWidget).toBeVisible({ timeout: 10000 });

  // 4. Set some text
  const contentArea = textWidget.locator('[contenteditable]');
  await contentArea.fill('Scaling Test Content');
  await contentArea.blur();

  // 5. Verify initial font-size style uses cqmin
  // Use evaluate to get the actual style attribute value to avoid issues with browser normalization of style
  const style = await contentArea.evaluate((el) => el.getAttribute('style'));
  expect(style).toContain('font-size: 7.2cqmin');

  // Ensure verification directory exists
  const vDir = path.join(process.cwd(), 'verification');
  if (!fs.existsSync(vDir)) {
    fs.mkdirSync(vDir);
  }

  // 6. Resize and capture screenshots
  const resizeHandle = textWidget
    .locator('.resize-handle')
    .filter({ has: page.locator('svg') })
    .first(); // South-east handle has the icon

  // Get initial size
  const box = await textWidget.boundingBox();
  if (box) {
    // Take screenshot at base size
    await page.screenshot({ path: 'verification/text-scaling-base.png' });

    // Resize to larger
    await resizeHandle.hover();
    await page.mouse.down();
    await page.mouse.move(box.x + 600, box.y + 400);
    await page.mouse.up();

    // Wait for the resize to complete by asserting the bounding box has changed.
    await expect
      .poll(async () => await textWidget.boundingBox())
      .not.toEqual(box);

    // Take screenshot at large size
    await page.screenshot({ path: 'verification/text-scaling-large.png' });
  }

  // Final check that style is still cqmin
  const finalStyle = await contentArea.evaluate((el) =>
    el.getAttribute('style')
  );
  expect(finalStyle).toContain('font-size: 7.2cqmin');
});
