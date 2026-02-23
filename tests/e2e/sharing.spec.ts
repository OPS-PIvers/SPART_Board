/* eslint-disable @typescript-eslint/require-await */
import { test, expect } from '@playwright/test';

test.describe('Board Sharing', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // eslint-disable-next-line no-console
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');

    // Wait for initial loading to finish
    await expect(page.locator('.animate-spin').first()).not.toBeVisible({
      timeout: 60000,
    });

    try {
      await page.waitForSelector('[title="Open Menu"]', {
        state: 'visible',
        timeout: 15000,
      });
    } catch {
      const signInButton = page.getByRole('button', { name: /sign in/i });
      if (await signInButton.isVisible()) {
        await signInButton.click();
      }
      await page.waitForSelector('[title="Open Menu"]', {
        state: 'visible',
        timeout: 15000,
      });
    }
  });

  test('can share and import a board', async ({ page }) => {
    await page.waitForSelector('[title="Open Menu"]', {
      state: 'visible',
      timeout: 60000,
    });
    await page.getByTitle('Open Menu').click();

    await page.waitForSelector('text=Classroom Manager', {
      state: 'visible',
      timeout: 60000,
    });
    await page
      .getByRole('button', { name: /^Boards/ })
      .first()
      .click();
    await page.waitForSelector('text=My Boards', {
      state: 'visible',
      timeout: 60000,
    });

    const boardCard = page
      .locator('.group.relative')
      .filter({ has: page.getByTitle('Share') })
      .first();
    await expect(boardCard).toBeVisible();
    await boardCard.hover();

    const shareButton = boardCard.getByTitle('Share');
    await expect(shareButton).toBeVisible();

    let clipboardText = '';
    await page.exposeFunction('mockWriteText', (text: string) => {
      clipboardText = text;
      return Promise.resolve();
    });
    // Override clipboard in current page context (addInitScript only affects future navigations)
    await page.evaluate(() => {
      const origWriteText = navigator.clipboard?.writeText?.bind(
        navigator.clipboard
      );
      navigator.clipboard.writeText = async (text: string) => {
        (window as unknown as Record<string, (t: string) => Promise<void>>)
          ['mockWriteText'](text)
          .catch(() => {
            /* ignore */
          });
        if (origWriteText) {
          try {
            return await origWriteText(text);
          } catch {
            /* clipboard write failed, ignore */
          }
        }
        return Promise.resolve();
      };
    });

    await shareButton.click();

    await expect(
      page.getByText(/Link copied to clipboard!|Board is now shared!/)
    ).toBeVisible({
      timeout: 10000,
    });

    await expect(async () => {
      expect(clipboardText).toContain('/share/');
    }).toPass();

    const shareUrl = clipboardText;
    // eslint-disable-next-line no-console
    console.log('Share URL:', shareUrl);

    await page.goto(shareUrl);

    await expect(page.getByText('Import Board')).toBeVisible();
    await expect(page.getByText('Loading shared board...')).not.toBeVisible();

    await page.getByRole('button', { name: 'Add Board' }).click();

    await expect(page.getByText('Import Board')).not.toBeVisible();

    await page.getByTitle('Open Menu').click();
    await page
      .getByRole('button', { name: /^Boards/ })
      .first()
      .click();

    // Use a more generic locator for the imported board if specific text fails
    await expect(
      page
        .locator('.group.relative')
        .filter({ hasText: /Imported:/ })
        .first()
    ).toBeVisible();
  });
});
