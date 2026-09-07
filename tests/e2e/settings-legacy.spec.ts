import { test, expect } from '@playwright/test';

// Runs only in the `legacy-settings` Playwright project, which sets
// localStorage authBypassFeatureOverrides = {"settings-drawer":false}
// before each test (see playwright.config.ts) — this asserts the
// pre-drawer (flip-to-back) settings UI still works when the flag is off.
test('legacy widget settings panel opens when settings-drawer is overridden off', async ({
  page,
}) => {
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });

  await page.goto('/');

  await page.getByTitle('Open Tools').click();
  await page.waitForTimeout(500);

  const noteButton = page.getByRole('button', { name: /Note/i }).first();
  await expect(noteButton).toBeVisible();
  await noteButton.click({ force: true });

  // Close the dock by clicking outside it, then click inside the new
  // widget's body to select it — the settings gear only renders while
  // the widget is selected (DraggableWindow's isSelectedWidget gate).
  await page.mouse.click(0, 0);

  const noteWidget = page
    .locator('.widget', { has: page.locator('[contenteditable]') })
    .last();
  await expect(noteWidget).toBeVisible();
  await noteWidget.click({ position: { x: 20, y: 20 } });

  const settingsGear = page.getByRole('button', {
    name: 'Settings (Alt+S)',
    exact: true,
  });
  await expect(settingsGear).toBeVisible();
  await settingsGear.click({ force: true });

  const legacyPanel = page.locator('[data-widget-portal]');
  await expect(legacyPanel).toBeVisible();

  const closeSettingsButton = page.getByRole('button', {
    name: /close settings/i,
  });
  await expect(closeSettingsButton.first()).toBeVisible();

  await expect(
    page.locator('[data-testid="settings-drawer-close"]')
  ).toHaveCount(0);
});

// Clock is migrated to WIDGET_SETTINGS_SCHEMAS (no WIDGET_SETTINGS_COMPONENTS
// entry) — with the flag off this asserts SchemaSettingsFallback renders the
// schema's fields instead of the "Standard settings available." placeholder.
test('legacy panel renders the clock schema fields when settings-drawer is off', async ({
  page,
}) => {
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });

  await page.goto('/');

  await page.getByTitle('Open Tools').click();
  await page.waitForTimeout(500);

  const clockButton = page.getByRole('button', { name: /^Clock$/ }).first();
  await expect(clockButton).toBeVisible();
  await clockButton.click({ force: true });

  await page.mouse.click(0, 0);
  const clockWidget = page
    .locator('.widget', { has: page.getByTestId('clock-time-container') })
    .last();
  await expect(clockWidget).toBeVisible();
  await clockWidget.click({ position: { x: 20, y: 20 } });

  const settingsGear = page.getByRole('button', {
    name: 'Settings (Alt+S)',
    exact: true,
  });
  await expect(settingsGear).toBeVisible();
  await settingsGear.click({ force: true });

  const legacyPanel = page.locator('[data-widget-portal]');
  await expect(legacyPanel).toBeVisible();
  await expect(
    legacyPanel.getByRole('switch', { name: 'Show Seconds' })
  ).toBeVisible();
  await expect(
    legacyPanel.getByRole('radiogroup', { name: 'Display Style' })
  ).toBeVisible();
});
