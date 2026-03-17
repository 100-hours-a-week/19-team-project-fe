import { expect, test } from '../fixtures/e2e';

test.describe('@error resume flows', () => {
  test('shows inline error message when resumes list request fails', async ({ page, apiMocks }) => {
    await apiMocks.authAuthed();
    await apiMocks.resumesListError('이력서 목록 조회에 실패했습니다.');

    await page.goto('/resume');

    await expect(page.getByText('이력서 목록 조회에 실패했습니다.')).toBeVisible();
  });

  test('shows inline error message when resume detail request fails', async ({
    page,
    apiMocks,
  }) => {
    await apiMocks.authAuthed();

    await page.route('**/bff/resumes/404', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          code: 'RESUME_DETAIL_FAILED',
          message: '상세 조회에 실패했습니다.',
          data: null,
        }),
      });
    });

    await page.goto('/resume/404');

    await expect(page.getByText('상세 조회에 실패했습니다.')).toBeVisible();
  });
});
