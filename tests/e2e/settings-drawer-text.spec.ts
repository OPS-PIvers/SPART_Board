import { test, expect, type Page } from '@playwright/test';

// Runs in the default `chromium` project, where auth bypass leaves the
// settings-drawer flag on (see playwright.config.ts). Helpers copied from
// tests/e2e/settings-drawer.spec.ts.

const addNoteWidget = async (page: Page) => {
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  await page.getByTitle('Open Tools').click();
  await page.waitForTimeout(500);

  const noteButton = page.getByRole('button', { name: /Note/i }).first();
  await expect(noteButton).toBeVisible();
  await noteButton.click({ force: true });

  // Close the dock, then select the new widget: the gear only renders while selected.
  await page.mouse.click(0, 0);
  const noteWidget = page
    .locator('.widget', { has: page.locator('[contenteditable]') })
    .last();
  await expect(noteWidget).toBeVisible();
  await noteWidget.click({ position: { x: 20, y: 20 } });
  return noteWidget;
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

test.describe('Note settings drawer at 1280x800', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('changes the content group and the style tab, and keeps them on reopen', async ({
    page,
  }) => {
    await page.goto('/');
    const noteWidget = await addNoteWidget(page);
    const editable = noteWidget.locator('[contenteditable]');

    const gear = page.getByRole('button', {
      name: 'Settings (Alt+S)',
      exact: true,
    });
    const drawer = await openDrawer(page);

    // Content group: applying a template writes sanitized HTML into the widget.
    await drawer.getByRole('button', { name: 'Spartan Scholar' }).click();
    await expect(editable).toContainText('Spartan Scholar Code');

    // Style tab: fontColor is a universal style field driven by `styleKeys`.
    await drawer.getByRole('tab', { name: 'Style' }).click();
    await drawer
      .getByRole('radio', { name: 'Select font color Brand blue' })
      .click();
    await expect(editable).toHaveCSS('color', 'rgb(45, 63, 137)');

    // Close, reopen: the applied content and style persist.
    await drawer.locator('[data-testid="settings-drawer-close"]').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(gear).toBeFocused();

    const reopened = await openDrawer(page);
    await expect(editable).toContainText('Spartan Scholar Code');
    await reopened.getByRole('tab', { name: 'Style' }).click();
    await expect(
      reopened.getByRole('radio', { name: 'Select font color Brand blue' })
    ).toHaveAttribute('aria-checked', 'true');
  });

  test('tabs from the heading through every Settings-tab field without leaving the drawer', async ({
    page,
  }) => {
    await page.goto('/');
    await addNoteWidget(page);
    const drawer = await openDrawer(page);

    const heading = drawer.getByRole('heading').first();
    await heading.focus();

    // Heading -> building toggle/help/close chrome -> filter -> tabs -> the
    // single template-grid field. Walk until the first template button is
    // reached, asserting focus never escapes the dialog along the way.
    let reachedField = false;
    for (let i = 0; i < 20 && !reachedField; i += 1) {
      await page.keyboard.press('Tab');
      const state = await page.evaluate(() => {
        const active = document.activeElement;
        return {
          inDialog: active?.closest('[role="dialog"]') !== null,
          text: active?.textContent ?? '',
        };
      });
      expect(state.inDialog).toBe(true);
      if (state.text.includes('Integrity Code')) reachedField = true;
    }
    expect(reachedField).toBe(true);
  });
});

test.describe('Note settings drawer at 820x640', () => {
  test.use({ viewport: { width: 820, height: 640 } });

  test('renders the schema in the bottom sheet with no horizontal scroll', async ({
    page,
  }) => {
    await page.goto('/');
    await addNoteWidget(page);
    const drawer = await openDrawer(page);
    await expect(drawer).toHaveAttribute('data-placement', 'bottom');
    await expect(
      drawer.getByRole('button', { name: 'Spartan Scholar' })
    ).toBeVisible();

    const overflow = await page.evaluate(
      () => document.body.scrollWidth <= document.body.clientWidth
    );
    expect(overflow).toBe(true);
  });
});
