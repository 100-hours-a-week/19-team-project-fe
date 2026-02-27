import { expect, test } from '@playwright/test';

test('로그인 페이지에서 카카오 소셜 로그인 진입을 제공한다', async ({ page }) => {
  await page.goto('/login');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('로그인 후 현직자 피드백을 Report로 받아보세요')).toBeVisible();
  await expect(page.getByRole('img', { name: '카카오로 로그인' })).toBeVisible();
  await expect(page.getByRole('button', { name: '이용약관' })).toBeVisible();
});
