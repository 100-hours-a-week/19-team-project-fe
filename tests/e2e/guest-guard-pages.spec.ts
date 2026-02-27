import { expect, test } from '@playwright/test';

const protectedRoutes = [
  { path: '/resume', message: '로그인이 필요합니다.' },
  { path: '/report', message: '로그인이 필요합니다.' },
  { path: '/chat', message: '로그인이 필요합니다.' },
  { path: '/me', message: '로그인이 필요합니다.' },
];

test.describe('비로그인 보호 페이지 게이트', () => {
  for (const route of protectedRoutes) {
    test(`${route.path} 진입 시 로그인 안내를 보여준다`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(`${route.path}$`));
      await expect(page.getByText(route.message).first()).toBeVisible();
    });
  }
});
