import type { Page } from '@playwright/test';

export async function disableFirstVisitSplash(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('splashSeen', 'true');
  });
}
