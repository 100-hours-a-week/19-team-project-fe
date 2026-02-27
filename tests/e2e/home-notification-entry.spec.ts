import { expect, test } from '@playwright/test';
import { disableFirstVisitSplash } from './support/bootstrap';

test('홈 알림 버튼으로 알림 페이지에 진입할 수 있다', async ({ page }) => {
  await disableFirstVisitSplash(page);
  await page.goto('/');

  await page.getByRole('button', { name: '알림' }).click();

  await expect(page).toHaveURL(/\/notifications$/);
  await expect(page.getByText('푸시 알림 허용')).toBeVisible();
  await expect(page.getByText('로그인 후 알림을 확인할 수 있어요.')).toBeVisible();
});
