import { test, expect } from '@playwright/test';

test('Nexus: Text Widget to QR Widget Sync', async ({ page }) => {
  // 1. Load dashboard
  await page.goto('/');

  // 2. Open Dock and Add Widgets
  // The dock button might need waiting or finding by title
  await page.getByTitle('Open Tools').click();

  // Add Text Widget (Note)
  const noteButton = page.getByRole('button', { name: /Note/i }).first();
  await noteButton.click({ force: true });

  // Add QR Widget
  const qrButton = page.getByRole('button', { name: /QR/i }).first();
  await qrButton.click({ force: true });

  // Close dock (Minimize)
  await page.getByTitle('Minimize Toolbar').click();

  // Move QR Widget to avoid overlap
  // The QR widget is likely on top because it was added last.
  const qrWidget = page
    .locator('.widget')
    .filter({ hasText: 'https://google.com' })
    .first();
  const qrBox = await qrWidget.boundingBox();
  if (qrBox) {
    await page.mouse.move(
      qrBox.x + qrBox.width / 2,
      qrBox.y + qrBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(qrBox.x + 400, qrBox.y + 100); // Move right
    await page.mouse.up();
  }

  // 3. Edit Text Widget
  // Text widget has a contentEditable div.
  const textWidget = page
    .locator('.widget')
    .filter({ has: page.locator('[contenteditable]') })
    .last();
  const contentArea = textWidget.locator('[contenteditable]');

  await contentArea.click();
  // Clear and type new URL
  await contentArea.fill('https://nexus.test/link');
  await contentArea.blur(); // Trigger save

  // 4. Configure QR Widget
  // Find QR widget by its default content
  // qrWidget is already defined above
  await expect(qrWidget).toBeVisible();

  // Activate widget to show toolbar
  await qrWidget.click({ position: { x: 20, y: 20 } });

  // Click Settings button in the toolbar (it appears in DOM when active)
  // We target the button with title "Settings" which is unique to the widget toolbar
  // (Admin settings has title "Admin Settings")
  const settingsButton = page.getByRole('button', {
    name: 'Settings',
    exact: true,
  });
  await settingsButton.click();

  // 5. Enable Sync
  // The settings panel is open.
  // Find the checkbox for sync.
  const syncToggle = page.locator('input[type="checkbox"]').first();
  // Or better, find by text nearby
  await expect(page.getByText('Sync with Text Widget')).toBeVisible();

  // Click the checkbox (toggle)
  // Input is hidden (sr-only), so we force the check
  // Retry if check doesn't take immediately (state update race)
  await syncToggle.evaluate((el) => (el as HTMLInputElement).click());
  await expect(syncToggle).toBeChecked();

  // 6. Verify Sync
  // Input should be disabled
  const urlInput = page.locator(
    'input[type="text"][placeholder="https://..."]'
  );
  await expect(urlInput).toBeDisabled();

  // Input value should match text widget
  await expect(urlInput).toHaveValue('https://nexus.test/link');

  // 7. Verify Widget Display
  // The widget content has changed, so we need to re-locate it or use a broader locator.
  // We can find it by the "DONE" button which is currently visible in the settings mode.
  // Or better, find the widget by the new synced text if it updated already in the background?
  // But the "DONE" button is what we need to click.
  // The 'qrWidget' locator was based on 'https://google.com' which might be gone.

  // Let's find the widget that contains the synced text OR the settings input with that value.
  const syncedWidget = page
    .locator('.widget')
    .filter({ has: page.locator('input[value="https://nexus.test/link"]') })
    .first();

  // Close settings
  await syncedWidget.getByText('DONE').click();

  // Verify "Linked" badge exists in the widget
  const linkedBadge = syncedWidget.locator('text=Linked');
  await expect(linkedBadge).toBeVisible();

  // Verify URL text in widget updated
  await expect(syncedWidget).toContainText('https://nexus.test/link');

  // 8. Verify Repeater Functionality (Update Text -> Update QR)
  // Go back to text widget and change text
  await contentArea.click();
  await contentArea.fill('https://nexus.test/updated');
  await contentArea.blur(); // Trigger save

  // Verify QR widget updates automatically
  // Need to wait for sync to happen
  // Note: syncedWidget locator relies on the OLD value, so we must find it again or use a stable locator.
  const updatedWidget = page
    .locator('.widget')
    .filter({ hasText: 'https://nexus.test/updated' })
    .first();
  await expect(updatedWidget).toBeVisible();
});
