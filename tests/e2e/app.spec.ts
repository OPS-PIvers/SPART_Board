import { test, expect } from '@playwright/test';

test.describe('Classroom Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has title', async ({ page }) => {
    await expect(page).toHaveTitle(/School Boards/i);
  });

  test('can open sidebar and view widgets', async ({ page }) => {
    // Open sidebar
    const menuButton = page.getByTitle('Open Menu');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Verify sidebar header
    await expect(page.getByText('SCHOOL BOARDS')).toBeVisible();

    // Verify Widgets tab is active (by checking for "Available Widgets" text)
    await expect(page.getByText('Available Widgets')).toBeVisible();
  });

  test('can add a Clock widget', async ({ page }) => {
    // Open Dock (it is minimized by default)
    const openToolsButton = page.getByTitle('Open Tools');
    await expect(openToolsButton).toBeVisible();
    await openToolsButton.click();

    // Click Clock widget in the Dock
    // The Dock renders buttons with the tool label.
    const clockButton = page.getByRole('button', { name: /Clock/i }).first();
    await expect(clockButton).toBeVisible();
    await clockButton.click();

    // Verify Clock widget is on the dashboard
    // The widget has class 'widget'.
    const widget = page.locator('.widget').first();
    await expect(widget).toBeVisible();

    // Optional: Verify it looks like a clock (contains a colon)
    await expect(widget.getByText(':').first()).toBeVisible();
  });
});
