import { test, expect, type Locator, type Page } from '@playwright/test';

// Timer (time-tool) drawer coverage: one field per group changes the board face,
// values survive close/reopen, Tab stays inside the dialog, and the 820x640 sheet
// has no horizontal scroll. Runs in the `chromium` project (flag on via auth bypass).

const addTimerWidget = async (page: Page): Promise<Locator> => {
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  await page.getByTitle('Open Tools').click();
  await page.waitForTimeout(500);

  const timerButton = page.getByRole('button', { name: /^Timer$/i }).first();
  await expect(timerButton).toBeVisible();
  await timerButton.click({ force: true });

  // Close the dock, then select the widget: the gear only renders while selected.
  await page.mouse.click(0, 0);
  const widget = page
    .locator('.widget', { has: page.getByRole('button', { name: 'Add time' }) })
    .last();
  await expect(widget).toBeVisible();
  await widget.click({ position: { x: 20, y: 20 } });
  return widget;
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

const closeDrawer = async (page: Page) => {
  await page
    .getByRole('dialog')
    .locator('[data-testid="settings-drawer-close"]')
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
};

// The digits button carries the clock-style classes and the glow text-shadow.
const timeFace = (widget: Locator) =>
  widget.locator('button', { hasText: /\d\d\s*:\s*\d\d/ }).first();

test.describe('time-tool settings drawer at 1280x800', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('edits one field per group, reflects it on the board, and keeps values on reopen', async ({
    page,
  }) => {
    await page.goto('/');
    const widget = await addTimerWidget(page);
    let drawer = await openDrawer(page);

    // Content: sound (radiogroup) — persistence is asserted on reopen below.
    const soundGroup = drawer.getByRole('radiogroup', { name: 'Alert Sound' });
    await soundGroup.getByRole('radio', { name: /blip/i }).click();
    await expect(
      soundGroup.getByRole('radio', { name: /blip/i })
    ).toHaveAttribute('aria-checked', 'true');

    // Behavior: adjust step (number) is visible in timer mode.
    const step = drawer.getByRole('spinbutton', { name: /adjust step/i });
    await expect(step).toHaveValue('60');
    await step.fill('30');
    await expect(step).toHaveValue('30');

    // Behavior: connected-widget tips appear for every missing partner on an empty board.
    await expect(
      drawer.locator('[data-testid="time-tool-nexus-hints"] li')
    ).toHaveCount(5);

    // Display: visual ring draws the progress ring behind the digits.
    await expect(widget.locator('svg circle')).toHaveCount(0);
    await drawer
      .getByRole('radiogroup', { name: 'Display Style' })
      .getByRole('radio', { name: /visual/i })
      .click();
    await expect(widget.locator('svg circle').first()).toBeVisible();

    // Display: LCD number style applies its tracking class to the digits.
    await drawer
      .getByRole('radiogroup', { name: 'Number Style' })
      .getByRole('radio', { name: /lcd/i })
      .click();
    await expect(timeFace(widget)).toHaveClass(/tracking-widest/);

    // Content: mode switch to stopwatch hides the +/- adjust controls and the step field.
    await drawer
      .getByRole('radiogroup', { name: 'Mode' })
      .getByRole('radio', { name: /stopwatch/i })
      .click();
    await expect(widget.getByRole('button', { name: 'Add time' })).toHaveCount(
      0
    );
    await expect(
      drawer.getByRole('spinbutton', { name: /adjust step/i })
    ).toHaveCount(0);

    await closeDrawer(page);

    // Reopen: every change is still shown.
    await widget.click({ position: { x: 20, y: 20 } });
    drawer = await openDrawer(page);
    await expect(
      drawer
        .getByRole('radiogroup', { name: 'Alert Sound' })
        .getByRole('radio', { name: /blip/i })
    ).toHaveAttribute('aria-checked', 'true');
    await expect(
      drawer
        .getByRole('radiogroup', { name: 'Mode' })
        .getByRole('radio', { name: /stopwatch/i })
    ).toHaveAttribute('aria-checked', 'true');
    await expect(
      drawer
        .getByRole('radiogroup', { name: 'Display Style' })
        .getByRole('radio', { name: /visual/i })
    ).toHaveAttribute('aria-checked', 'true');
    await expect(
      drawer
        .getByRole('radiogroup', { name: 'Number Style' })
        .getByRole('radio', { name: /lcd/i })
    ).toHaveAttribute('aria-checked', 'true');

    // Back to timer mode: the step value entered earlier is still stored.
    await drawer
      .getByRole('radiogroup', { name: 'Mode' })
      .getByRole('radio', { name: /timer/i })
      .click();
    await expect(
      drawer.getByRole('spinbutton', { name: /adjust step/i })
    ).toHaveValue('30');
  });

  test('tabs from the heading through every Settings-tab field without leaving the dialog', async ({
    page,
  }) => {
    await page.goto('/');
    await addTimerWidget(page);
    const drawer = await openDrawer(page);

    const heading = drawer.getByRole('heading').first();
    await heading.focus();
    await expect(heading).toBeFocused();

    const fieldKeys = await drawer
      .locator('[data-field-key]')
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute('data-field-key'))
      );
    expect(fieldKeys.length).toBeGreaterThan(0);

    const visited = new Set<string>();
    for (let i = 0; i < 80 && visited.size < fieldKeys.length; i += 1) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        const dialog = el?.closest('[role="dialog"]');
        const field = el?.closest('[data-field-key]');
        return {
          inDialog: Boolean(dialog),
          key: field?.getAttribute('data-field-key') ?? null,
        };
      });
      expect(info.inDialog, `tab stop ${i} left the dialog`).toBe(true);
      if (info.key) visited.add(info.key);
    }
    expect([...visited].sort()).toEqual([...fieldKeys].sort());
  });
});

test.describe('time-tool settings drawer at 820x640', () => {
  test.use({ viewport: { width: 820, height: 640 } });

  test('renders the schema in the bottom sheet with no horizontal scroll', async ({
    page,
  }) => {
    await page.goto('/');
    await addTimerWidget(page);
    const drawer = await openDrawer(page);
    await expect(drawer).toHaveAttribute('data-placement', 'bottom');
    await expect(
      drawer.getByRole('radiogroup', { name: 'Alert Sound' })
    ).toBeVisible();

    const overflow = await drawer.evaluate((root) => {
      const scrollers = [
        root,
        ...Array.from(root.querySelectorAll<HTMLElement>('*')),
      ];
      return scrollers
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .filter((el) => getComputedStyle(el).overflowX !== 'visible')
        .map((el) => `${el.tagName}.${el.className}`);
    });
    expect(overflow).toEqual([]);
    const body = drawer.locator('[data-testid="settings-drawer-body"]');
    if ((await body.count()) > 0) {
      const dims = await body.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      expect(dims.scrollWidth).toBeLessThanOrEqual(dims.clientWidth);
    }
  });
});
