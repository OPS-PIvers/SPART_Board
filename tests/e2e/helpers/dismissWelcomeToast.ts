import type { Page } from '@playwright/test';

// The first-run "Welcome! Board created" toast overlaps the drawer's tab bar; clear it before clicking there.
export const dismissWelcomeToast = async (page: Page): Promise<void> => {
  const toast = page
    .getByRole('status')
    .filter({ hasText: 'Welcome! Board created' });
  await toast
    .first()
    .click({ force: true, timeout: 2000 })
    .catch(() => undefined);
  await toast
    .first()
    .waitFor({ state: 'hidden', timeout: 5000 })
    .catch(() => undefined);
};
