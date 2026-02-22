import { APP_NAME } from '../../config/constants';
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

    await page.waitForSelector(`text=${APP_NAME}`, {
      state: 'visible',
      timeout: 60000,
    });
    await page
      .getByRole('button', { name: 'Boards Manage and switch between' })
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
    });
    await page.addInitScript(() => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText = (text) =>
          (window as any).mockWriteText(text);
      } else {
        (navigator as any).clipboard = {
          writeText: (text: string) => (window as any).mockWriteText(text),
        };
      }
    });

    await shareButton.click();

    await expect(page.getByText('Board link copied')).toBeVisible({
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
      .getByRole('button', { name: 'Boards Manage and switch between' })
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
