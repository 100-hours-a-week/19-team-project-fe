import { expect, test } from '../fixtures/e2e';
import { mockExpertDetailError, mockExpertsSearchError } from '../mocks/experts';

test.describe('@error experts flows', () => {
  test('shows search error message when experts query fails', async ({ page, apiMocks }) => {
    await apiMocks.authGuest();
    await mockExpertsSearchError(page, '검색에 실패했습니다.');

    await page.goto('/experts');
    await page.getByPlaceholder('나에게 Fit한 현직자를 찾아보세요').fill('백엔드');
    await page.getByRole('button', { name: '검색' }).click();

    await expect(
      page.getByText('네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'),
    ).toBeVisible();
  });

  test('shows detail error message when expert detail query fails', async ({ page, apiMocks }) => {
    await apiMocks.authAuthed();
    await apiMocks.resumesList(1);
    await mockExpertDetailError(page, 999, '상세 조회 실패');

    await page.goto('/experts/999');

    await expect(page.getByText('에러: 상세 조회 실패')).toBeVisible();
  });
});
