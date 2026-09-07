import { test, expect, type Page } from '@playwright/test';

// Clock is migrated to the schema-driven settings drawer (see
// tests/e2e/settings-drawer.spec.ts for the generic chrome coverage this
// spec doesn't repeat).

const addClockWidget = async (page: Page) => {
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  await page.getByTitle('Open Tools').click();
  await page.waitForTimeout(500);

  const clockButton = page.getByRole('button', { name: /^Clock$/ }).first();
  await expect(clockButton).toBeVisible();
  await clockButton.click({ force: true });

  // Close the dock, then select the new widget: the gear only renders while selected.
  await page.mouse.click(0, 0);
  const clockWidget = page
    .locator('.widget', { has: page.getByTestId('clock-time-container') })
    .last();
  await expect(clockWidget).toBeVisible();
  await clockWidget.click({ position: { x: 20, y: 20 } });
  return clockWidget;
};

const openDrawer = async (page: Page) => {
  const gear = page.getByRole('button', {
    name: 'Settings (Alt+S)',
    exact: true,
  });
  await expect(gear).toBeVisible();
  await gear.click({ force: true });
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible({ timeout: 10000 });
  return drawer;
};

test.describe('clock settings drawer at 1280x800', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('changes a behavior and a display field, persists them across a close/reopen', async ({
    page,
  }) => {
    await page.goto('/');
    const clockWidget = await addClockWidget(page);
    const timeContainer = clockWidget.getByTestId('clock-time-container');

    const beforeText = (await timeContainer.textContent())?.trim() ?? '';
    // Default config shows seconds (HH:MM:SS); the toggle below removes them.
    expect(beforeText.length).toBeGreaterThan(0);

    const drawer = await openDrawer(page);

    // Behavior group: showSeconds off -> the rendered time string shortens.
    const showSecondsToggle = drawer.getByRole('switch', {
      name: 'Show Seconds',
    });
    await expect(showSecondsToggle).toHaveAttribute('aria-checked', 'true');
    await showSecondsToggle.click();
    await expect(showSecondsToggle).toHaveAttribute('aria-checked', 'false');
    await expect
      .poll(async () => (await timeContainer.textContent())?.trim().length)
      .toBeLessThan(beforeText.length);

    // Display group: clockStyle -> lcd shows the LCD ghost-digits background.
    const lcdOption = drawer.getByRole('radio', { name: 'LCD Panel' });
    await lcdOption.click();
    await expect(lcdOption).toHaveAttribute('aria-checked', 'true');
    await expect(clockWidget.getByTestId('clock-lcd-background')).toBeVisible();

    await drawer.locator('[data-testid="settings-drawer-close"]').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Reopen: both values are still shown.
    const reopened = await openDrawer(page);
    await expect(
      reopened.getByRole('switch', { name: 'Show Seconds' })
    ).toHaveAttribute('aria-checked', 'false');
    await expect(
      reopened.getByRole('radio', { name: 'LCD Panel' })
    ).toHaveAttribute('aria-checked', 'true');
  });

  test('tabs from the heading through every Settings-tab field without leaving the dialog', async ({
    page,
  }) => {
    await page.goto('/');
    await addClockWidget(page);
    const drawer = await openDrawer(page);

    await drawer.getByRole('heading').first().focus();
    // The Settings tab holds: find-a-setting, both tabs, format24 + showSeconds
    // toggles, the clockStyle segmented control, the glow toggle, and the
    // themeColor/dateColor accent-color pickers (radio swatches + custom
    // color swatch + hex input each) -- comfortably under 40 stops.
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      const stillInDrawer = await page.evaluate(() => {
        const active = document.activeElement;
        const dialog = document.querySelector('[role="dialog"]');
        return !!active && !!dialog && dialog.contains(active);
      });
      expect(stillInDrawer, `focus left the drawer after Tab #${i + 1}`).toBe(
        true
      );
    }
    await expect(drawer).toBeVisible();
  });
});

test.describe('clock settings drawer at 820x640', () => {
  test.use({ viewport: { width: 820, height: 640 } });

  test('renders the schema with no horizontal scroll', async ({ page }) => {
    await page.goto('/');
    await addClockWidget(page);
    const drawer = await openDrawer(page);
    await expect(drawer).toHaveAttribute('data-placement', 'bottom');

    const overflow = await page.evaluate(
      () => document.body.scrollWidth <= document.body.clientWidth
    );
    expect(overflow).toBe(true);
  });
});
