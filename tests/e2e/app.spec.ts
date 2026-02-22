import { APP_NAME } from '../../config/constants';
import { test, expect } from '@playwright/test';

test.describe(APP_NAME, () => {
  // Increase timeout for slow CI environments
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for initial loading to finish
    await expect(page.locator('.animate-spin').first()).not.toBeVisible({
      timeout: 60000,
    });
  });

  test('has title', async ({ page }) => {
    await expect(page).toHaveTitle(new RegExp(APP_NAME, 'i'));
  });

  test('can open sidebar and view widgets', async ({ page }) => {
    // Open sidebar
    await page.waitForSelector('[title="Open Menu"]', {
      state: 'visible',
      timeout: 60000,
    });
    await page.getByTitle('Open Menu').click();

    // Verify sidebar header
    await page.waitForSelector(`text=${APP_NAME.toUpperCase()}`, {
      state: 'visible',
      timeout: 60000,
    });

    // Verify Widgets tab is active (by checking for "Available Widgets" text)
    await page.waitForSelector('text=Available Widgets', {
      state: 'visible',
      timeout: 60000,
    });
  });

  test('can add a Clock widget', async ({ page }) => {
    // Open Dock (it is minimized by default)
    await page.waitForSelector('[title="Open Tools"]', {
      state: 'visible',
      timeout: 60000,
    });
    await page.getByTitle('Open Tools').click();

    // Click Clock widget in the Dock
    // The Dock renders buttons with the tool label.
    const clockButton = page.getByRole('button', { name: /Clock/i }).first();
    await clockButton.waitFor({ state: 'visible', timeout: 60000 });
    // Use force click if element is unstable/animating
    await clockButton.click({ force: true });

    // Verify Clock widget is on the dashboard
    // The widget has class 'widget'.
    await page.waitForSelector('.widget', { state: 'visible', timeout: 60000 });

    // Optional: Verify it looks like a clock (contains a colon)
    const widget = page.locator('.widget').first();
    await expect(widget.getByText(':').first()).toBeVisible({ timeout: 10000 });
  });
});
