/* eslint-disable no-console */
import { test, expect } from '@playwright/test';

test('Snap Layouts verification', async ({ page }) => {
  // Explicitly set env vars in the browser context if possible,
  // but page.goto is usually enough if the server has them.
  // Using a longer wait for the root to bypass potential splash screens.
  await page.goto('http://localhost:3000/?auth_bypass=true');

  // Wait for dashboard to load
  await page.waitForSelector('#dashboard-root', { timeout: 30000 });

  // 1. Create a widget (e.g., Timer)
  console.log('Adding Timer widget...');
  const timerButton = page.locator('button[data-tool-id="time-tool"]');
  const openToolsButton = page.locator('button[aria-label="Open Tools"]');

  if (await openToolsButton.isVisible()) {
    await openToolsButton.click();
  }

  await expect(timerButton).toBeVisible();
  // dnd-kit adds aria-disabled="true" when not in edit mode, which can confuse Playwright.
  await timerButton.evaluate((el) => (el as HTMLElement).click());

  // Find the widget
  const widget = page.locator('.widget').first();
  await expect(widget).toBeVisible();

  // 1.5 Move widget to center to ensure popovers are in viewport
  const dragSurface = widget.locator('[data-testid="drag-surface"]');
  await dragSurface.hover();
  await page.mouse.down();
  await page.mouse.move(640, 450);
  await page.mouse.up();
  await page.waitForTimeout(500);

  // 2. Open the tool menu by clicking the widget
  console.log('Opening tool menu...');
  await widget.click();

  // The toolbar might be collapsed by default. Expand it.
  const expandButton = page.locator('button[aria-label="Expand Toolbar"]');
  if (await expandButton.isVisible()) {
    await expandButton.click();
  }

  // Wait for the tool menu (portal)
  const snapLayoutButton = page.locator('button[aria-label*="Snap Layout"]');
  await expect(snapLayoutButton).toBeVisible();

  // Screenshot of the tool menu with the new button
  await page.screenshot({
    path: '/home/jules/verification/step1_tool_menu.png',
  });

  // 3. Open the Snap Layout menu
  console.log('Opening Snap Layout menu...');
  // Force click because the portal container (GlassCard) might be intercepting
  // even if the button is technically visible.
  await snapLayoutButton.click({ force: true });

  const snapMenu = page.locator('text=Choose Layout');
  await expect(snapMenu).toBeVisible();

  // Screenshot of the Snap Layout menu
  await page.screenshot({
    path: '/home/jules/verification/step2_snap_menu.png',
  });

  // 4. Click a snap zone (e.g., Left Half of Split Screen)
  console.log('Snapping to Left Half...');
  const firstLayoutZone = page.locator(
    'button[aria-label*="Snap to Split Screen - left-half"]'
  );
  // Use force: true to avoid "outside of viewport" issues
  await firstLayoutZone.click({ force: true });

  // Wait for snap to apply
  await page.waitForTimeout(500);

  // Verify widget position/size (EXACT match for left half)
  const box = await widget.boundingBox();
  if (box) {
    // Playwright default viewport is 1280x720
    // PADDING=16, GAP=12, DOCK_HEIGHT=100
    // safeWidth = 1280 - 32 = 1248
    // zone.w = 0.5 -> rawW = 624
    // gap calculation: rawW - GAP/2 = 624 - 6 = 618
    const x = Math.round(box.x);
    const w = Math.round(box.width);
    expect(x).toBe(16);
    expect(w).toBe(618);
  }

  await page.screenshot({
    path: '/home/jules/verification/step3_snapped_left.png',
  });

  // 4.5. Test a new layout (e.g. Top/Bottom - bottom)
  console.log('Snapping to Bottom half...');
  await widget.click();
  await snapLayoutButton.click({ force: true });
  const bottomZone = page.locator(
    'button[aria-label*="Snap to Top/Bottom - bottom"]'
  );
  await bottomZone.click({ force: true });
  await page.waitForTimeout(500);

  const boxBottom = await widget.boundingBox();
  if (boxBottom) {
    // safeHeight = 720 - 100 - 32 = 588
    // y = PADDING + 0.5*safeHeight + GAP/2 = 16 + 294 + 6 = 316
    // h = 294 - 6 = 288
    const y = Math.round(boxBottom.y);
    const h = Math.round(boxBottom.height);
    expect(y).toBe(316);
    expect(h).toBe(288);
  }
  await page.screenshot({
    path: '/home/jules/verification/step3.5_snapped_bottom.png',
  });

  // 5. Test Drag-to-Edge Detection
  console.log('Testing Drag-to-Edge...');

  // Drag to right edge
  await dragSurface.hover();
  await page.mouse.down();
  await page.mouse.move(1275, 300, { steps: 10 });

  // Check if preview overlay exists
  const preview = page.locator('div.fixed.bg-indigo-500\\/20');
  await expect(preview).toBeVisible();
  await page.screenshot({
    path: '/home/jules/verification/step4_drag_edge_preview.png',
  });

  // Release to snap
  await page.mouse.up();
  await page.waitForTimeout(500);

  // Verify widget is now on the right with EXACT snapped bounds
  const boxRight = await widget.boundingBox();
  if (boxRight) {
    // x = PADDING + 0.5*safeWidth + GAP/2 = 16 + 624 + 6 = 646
    // w = 624 - 6 = 618
    const x = Math.round(boxRight.x);
    const w = Math.round(boxRight.width);
    expect(x).toBe(646);
    expect(w).toBe(618);
  }

  await page.screenshot({
    path: '/home/jules/verification/step5_snapped_right_edge.png',
  });
});
