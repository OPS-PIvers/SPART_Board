import { test, expect } from '@playwright/test';

test.describe('Board Sharing', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');

    // Wait for initial loading to finish
    await expect(page.locator('.animate-spin').first()).not.toBeVisible({ timeout: 15000 });

    const dashboardVisible = await page.getByTitle('Open Menu').isVisible();
    if (!dashboardVisible) {
       const signInButton = page.getByRole('button', { name: /sign in/i });
       if (await signInButton.isVisible()) {
          await signInButton.click();
       }
    }
    await expect(page.getByTitle('Open Menu')).toBeVisible({ timeout: 15000 });
  });

  test('can share and import a board', async ({ page }) => {
    await page.getByTitle('Open Menu').click();
    await expect(page.getByText('School Boards')).toBeVisible();
    await page.getByRole('button', { name: 'Boards Manage and switch between' }).click();
    await expect(page.getByText('My Boards')).toBeVisible();

    const boardCard = page.locator('.group.relative').filter({ has: page.getByTitle('Share') }).first();
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
        navigator.clipboard.writeText = (text) => window.mockWriteText(text);
      } else {
         (navigator as any).clipboard = {
            writeText: (text) => window.mockWriteText(text)
         };
      }
    });

    await shareButton.click();

    await expect(page.getByText('Board link copied')).toBeVisible({ timeout: 10000 });

    await expect(async () => {
      expect(clipboardText).toContain('/share/');
    }).toPass();

    const shareUrl = clipboardText;
    console.log('Share URL:', shareUrl);

    await page.goto(shareUrl);

    await expect(page.getByText('Import Board')).toBeVisible();
    await expect(page.getByText('Loading shared board...')).not.toBeVisible();

    await page.getByRole('button', { name: 'Add Board' }).click();

    await expect(page.getByText('Import Board')).not.toBeVisible();

    await page.getByTitle('Open Menu').click();
    await page.getByRole('button', { name: 'Boards Manage and switch between' }).click();

    // Use a more generic locator for the imported board if specific text fails
    await expect(page.locator('.group.relative').filter({ hasText: /Imported:/ }).first()).toBeVisible();
  });
});
