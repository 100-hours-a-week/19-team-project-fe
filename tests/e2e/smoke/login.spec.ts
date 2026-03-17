import { expect, test } from '../fixtures/e2e';

test.describe('@smoke login page', () => {
  test('renders kakao login CTA', async ({ page, apiMocks }) => {
    await apiMocks.authGuest();
    await page.goto('/login');

    await expect(
      page.getByText('로그인 후 현직자 피드백을 Report로 받아보세요'),
    ).toBeVisible();

    await expect(page.getByRole('link', { name: '카카오로 로그인' })).toBeVisible();
  });
});
