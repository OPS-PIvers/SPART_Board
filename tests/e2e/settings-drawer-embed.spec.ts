import { test, expect, type Page } from '@playwright/test';
import { expectTabOrderStaysInDrawer } from './helpers/drawerTabbing';

// Runs in the default `chromium` project, where auth bypass leaves the
// settings-drawer flag on (see playwright.config.ts and settings-drawer.spec.ts).

const addEmbedWidget = async (page: Page) => {
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  await page.getByTitle('Open Tools').click();
  await page.waitForTimeout(500);

  const embedButton = page.getByRole('button', { name: /^Embed$/i }).first();
  await expect(embedButton).toBeVisible();
  await embedButton.click({ force: true });

  // Close the dock, then select the new widget: the gear only renders while selected.
  await page.mouse.click(0, 0);
  // Pin the locator to the new widget's id so it survives the empty state disappearing.
  const widgetId = await page
    .locator('.widget')
    .last()
    .getAttribute('data-widget-id');
  const embedWidget = page.locator(`.widget[data-widget-id="${widgetId}"]`);
  await expect(embedWidget).toBeVisible();
  // The fill-sized embed can report as unstable at 820px; fall back to a forced click.
  await embedWidget
    .click({ position: { x: 20, y: 20 }, timeout: 15000 })
    .catch(() =>
      embedWidget.click({ position: { x: 20, y: 20 }, force: true })
    );
  return embedWidget;
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

test.describe('embed settings drawer at 1280x800', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('changes url and refreshInterval, and the board + drawer both keep them', async ({
    page,
  }) => {
    await page.goto('/');
    const widget = await addEmbedWidget(page);

    const drawer = await openDrawer(page);

    // Content group: the URL field. Changing it should update the iframe on the board.
    const urlInput = drawer.getByLabel('Target URL');
    await expect(urlInput).toBeVisible();
    await urlInput.fill('https://example.org');
    await urlInput.blur();

    await expect(widget.locator('iframe')).toHaveAttribute(
      'src',
      'https://example.org'
    );

    // Behavior group: the refresh-interval select.
    const refreshSelect = drawer.getByLabel('Auto-Refresh');
    await expect(refreshSelect).toBeVisible();
    await refreshSelect.selectOption('5');

    // Tab from the heading through every Settings-tab field without leaving the dialog.
    const visited = await expectTabOrderStaysInDrawer(page, drawer);
    expect(visited).toEqual(
      expect.arrayContaining(['mode', 'refreshInterval'])
    );

    // Close and reopen: values persist.
    await drawer.locator('[data-testid="settings-drawer-close"]').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Re-select the widget: the gear only renders while it is selected.
    await widget.click({ position: { x: 20, y: 20 } });
    const reopened = await openDrawer(page);
    await expect(reopened.getByLabel('Target URL')).toHaveValue(
      'https://example.org'
    );
    await expect(reopened.getByLabel('Auto-Refresh')).toHaveValue('5');
  });
});

test.describe('embed settings drawer at 820x640', () => {
  test.use({ viewport: { width: 820, height: 640 } });

  test('renders as a bottom sheet with no horizontal scroll', async ({
    page,
  }) => {
    await page.goto('/');
    await addEmbedWidget(page);

    const drawer = await openDrawer(page);
    await expect(drawer).toHaveAttribute('data-placement', 'bottom');

    const overflow = await drawer.evaluate(
      (el) => el.scrollWidth <= el.clientWidth
    );
    expect(overflow).toBe(true);

    await drawer.locator('[data-testid="settings-drawer-close"]').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
