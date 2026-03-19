import { expect, test } from '../fixtures/e2e';

test.describe('@error report flows', () => {
  test('shows inline error message when reports list request fails', async ({ page, apiMocks }) => {
    await apiMocks.authAuthed();
    await apiMocks.reportsListError('리포트 목록 조회 실패');

    await page.goto('/report');

    await expect(page.getByText('리포트 목록 조회 실패')).toBeVisible();
  });

  test('shows inline error message when report detail request fails', async ({ page, apiMocks }) => {
    await apiMocks.authAuthed();
    await apiMocks.reportDetailError(404, '리포트 상세 조회 실패');

    await page.goto('/report/404');

    await expect(page.getByText('리포트 상세 조회 실패')).toBeVisible();
  });
});
