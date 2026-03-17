import { expect, test } from '../fixtures/e2e';

test.describe('@critical login ui interactions', () => {
  test('opens and closes terms bottom sheet', async ({ page, apiMocks }) => {
    await apiMocks.authGuest();
    await page.goto('/login');

    await page.getByRole('button', { name: '이용약관' }).click();
    await expect(page.getByRole('heading', { name: '이용약관' })).toBeVisible();
    await expect(page.getByText('RE:FIT 이용약관').first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: '이용약관' })).not.toBeVisible();
  });

  test('shows restore bottom sheet from kakao restore session', async ({ page, apiMocks }) => {
    await apiMocks.authGuest();
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'kakaoRestoreRequired',
        JSON.stringify({
          restore_required: {
            oauth_provider: 'KAKAO',
            oauth_id: 'kakao-1234',
            email: 'restore-user@refit.test',
            nickname: 'restore-user',
            email_conflict: false,
            nickname_conflict: false,
          },
        }),
      );
    });

    await page.goto('/login');

    await expect(page.getByRole('heading', { name: '탈퇴 계정 복구' })).toBeVisible();
    await expect(page.getByText('restore-user@refit.test')).toBeVisible();
    await expect(page.getByRole('button', { name: '기존 계정 복구' })).toBeVisible();
  });

  test('sends restore request and navigates to home on success', async ({ page, apiMocks }) => {
    await apiMocks.authGuest();
    await apiMocks.restoreAccountSuccess();

    await page.addInitScript(() => {
      sessionStorage.setItem(
        'kakaoRestoreRequired',
        JSON.stringify({
          restore_required: {
            oauth_provider: 'KAKAO',
            oauth_id: 'kakao-restore-success',
            email: 'success-user@refit.test',
            nickname: 'success-user',
            email_conflict: false,
            nickname_conflict: false,
          },
        }),
      );
    });

    await page.goto('/login');

    const requestPromise = page.waitForRequest((request) => {
      return request.url().includes('/bff/auth/restore') && request.method() === 'POST';
    });

    await page.getByRole('button', { name: '기존 계정 복구' }).click();

    const request = await requestPromise;
    const payload = request.postDataJSON() as {
      oauth_provider: string;
      oauth_id: string;
      email: string;
      nickname: string;
    };

    expect(payload.oauth_provider).toBe('KAKAO');
    expect(payload.oauth_id).toBe('kakao-restore-success');
    expect(payload.email).toBe('success-user@refit.test');
    expect(payload.nickname).toBe('success-user');

    await expect(page).toHaveURL('/');
  });
});
