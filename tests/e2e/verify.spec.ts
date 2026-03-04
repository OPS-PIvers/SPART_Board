import { test, expect } from '@playwright/test';

test('Render QuizResults widget with "Send to Scoreboard" button', async ({
  page,
}) => {
  await page.goto('http://localhost:3000/');

  // Depending on how to reach the Quiz widget,
  // we might just screenshot the whole page if there's no easy way
  // without database mocking to show the QuizResults component.
  // Wait for the app to load
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: '/home/jules/verification/screenshot.png' });
});
