import { expect, test } from '../fixtures/e2e';

test.describe('@error login restore flow', () => {
  test('shows restore error message when restore API fails with business error', async ({
    page,
    apiMocks,
  }) => {
    await apiMocks.authGuest();
    await apiMocks.restoreAccountBusinessError('복구 처리에 실패했습니다. 고객센터로 문의해 주세요.');

    await page.addInitScript(() => {
      sessionStorage.setItem(
        'kakaoRestoreRequired',
        JSON.stringify({
          restore_required: {
            oauth_provider: 'KAKAO',
            oauth_id: 'kakao-restore-error',
            email: 'error-user@refit.test',
            nickname: 'error-user',
            email_conflict: false,
            nickname_conflict: false,
          },
        }),
      );
    });

    await page.goto('/login');
    await page.getByRole('button', { name: '기존 계정 복구' }).click();

    await expect(page.getByText('복구 처리에 실패했습니다. 고객센터로 문의해 주세요.')).toBeVisible();
    await expect(page.getByRole('button', { name: '기존 계정 복구' })).toBeVisible();
  });
});
