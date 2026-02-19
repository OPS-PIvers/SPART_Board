import { APP_NAME } from '../../config/constants';
import { test, expect } from '@playwright/test';

test.describe(APP_NAME, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has title', async ({ page }) => {
    await expect(page).toHaveTitle(new RegExp(APP_NAME, 'i'));
  });

  test('can open sidebar and view widgets', async ({ page }) => {
    // Open sidebar
    const menuButton = page.getByTitle('Open Menu');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Verify sidebar header
    // The sidebar header displays "Classroom Manager" when in the main section
    await expect(page.getByText('Classroom Manager')).toBeVisible();

    // Verify Widgets tab is active (by checking for "Available Widgets" text)
    // Note: Widgets are in the 'main' section now under "Workspace" -> "Widgets" button to navigate?
    // Wait, the Sidebar implementation shows navigation buttons first.
    // "Workspace" -> "Widgets" button.
    const widgetsButton = page.getByRole('button', { name: 'Widgets' });
    await expect(widgetsButton).toBeVisible();
    await widgetsButton.click();

    // Now we should see "Available Widgets"
    await expect(page.getByText('Available Widgets')).toBeVisible();
  });

  test('can add a Clock widget', async ({ page }) => {
    // Open Dock (it is minimized by default)
    const openToolsButton = page.getByTitle('Open Tools');
    await expect(openToolsButton).toBeVisible();
    await openToolsButton.click();

    // Click Clock widget in the Dock
    // The Dock renders buttons with the tool label.
    // Use force: true to bypass aria-disabled from dnd-kit
    const clockButton = page.getByRole('button', { name: /Clock/i }).first();
    await expect(clockButton).toBeVisible();
    await clockButton.click({ force: true });

    // Verify Clock widget is on the dashboard
    // The widget has class 'widget'.
    const widget = page.locator('.widget').first();
    await expect(widget).toBeVisible();

    // Optional: Verify it looks like a clock (contains a colon)
    await expect(widget.getByText(':').first()).toBeVisible();
  });
});
