import { expect, type Locator, type Page } from '@playwright/test';

// Tabs from the drawer heading through every tabbable control and asserts focus never leaves the dialog.
export const expectTabOrderStaysInDrawer = async (
  page: Page,
  drawer: Locator
): Promise<string[]> => {
  await drawer.getByRole('heading').first().focus();
  const tabbable = await drawer.evaluate(
    (root) =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [tabindex]'
        )
      ).filter(
        (el) =>
          el.tabIndex >= 0 &&
          !el.hasAttribute('disabled') &&
          !el.closest('fieldset:disabled') &&
          el.getClientRects().length > 0
      ).length
  );
  expect(tabbable).toBeGreaterThan(0);

  const visitedKeys = new Set<string>();
  for (let i = 1; i <= tabbable; i += 1) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return {
        inDialog: Boolean(el?.closest('[role="dialog"]')),
        key: el?.closest('[data-field-key]')?.getAttribute('data-field-key'),
      };
    });
    expect(info.inDialog, `focus left the drawer after Tab #${i}`).toBe(true);
    if (info.key) visitedKeys.add(info.key);
  }
  return [...visitedKeys];
};
