import { expect, test } from '@playwright/test';
import { disableFirstVisitSplash } from './support/bootstrap';

test('홈 랜딩에서 핵심 진입 요소가 노출된다', async ({ page }) => {
  await disableFirstVisitSplash(page);
  await page.goto('/');

  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByText('RE:FIT에 오신 걸 환영합니다.')).toBeVisible();
  await expect(page.getByRole('button', { name: '알림' })).toBeVisible();
  await expect(page.getByRole('link', { name: '홈' })).toBeVisible();
});
