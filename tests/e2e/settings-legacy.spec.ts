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

  await page.mouse.click(0, 0);

  const settingsGear = page.getByRole('button', { name: /^Settings/i }).first();
  await expect(settingsGear).toBeVisible();
  await settingsGear.click();

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
