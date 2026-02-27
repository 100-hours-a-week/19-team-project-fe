import { expect, test } from '@playwright/test';

test('전문가 탐색 페이지에서 검색/가이드가 노출된다', async ({ page }) => {
  await page.goto('/experts');

  await expect(page).toHaveURL(/\/experts$/);
  await expect(page.getByPlaceholder('나에게 Fit한 현직자를 찾아보세요')).toBeVisible();
  await expect(page.getByText('현직자 검색')).toBeVisible();
  await expect(page.getByRole('button', { name: '다음' })).toBeVisible();
});
