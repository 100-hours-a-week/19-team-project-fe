import { expect, test } from '../fixtures/e2e';
import { buildApiSuccess } from '../mocks/http';
import {
  createExpert,
  createExpertDetail,
  createExpertReview,
  mockExpertDetail,
  mockExpertReviews,
} from '../mocks/experts';

test.describe('@critical experts async flows', () => {
  test('shows loading state then renders expert search results', async ({ page, apiMocks }) => {
    await apiMocks.authGuest();

    await page.route('**/api/v1/experts**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(
          buildApiSuccess({
            experts: [
              createExpert({
                user_id: 101,
                nickname: '비동기현직자',
              }),
            ],
            next_cursor: null,
            has_more: false,
          }),
        ),
      });
    });

    await page.goto('/experts');
    await page.getByPlaceholder('나에게 Fit한 현직자를 찾아보세요').fill('백엔드');
    await page.getByRole('button', { name: '검색' }).click();

    await expect(page.getByText('불러오는 중...')).toBeVisible();
    await expect(page.getByText('비동기현직자')).toBeVisible();
  });

  test('loads expert detail and paginates reviews asynchronously', async ({ page, apiMocks }) => {
    await apiMocks.authAuthed();
    await apiMocks.resumesList(1);

    await mockExpertDetail(
      page,
      1,
      createExpertDetail({
        user_id: 1,
        nickname: '상세현직자',
        introduction: '상세 페이지 소개입니다.',
      }),
    );

    await mockExpertReviews(page, 1, {
      reviews: [
        createExpertReview({
          chat_review_id: 1,
          comment: '첫 번째 리뷰',
        }),
      ],
      nextCursor: '2',
      hasMore: true,
      cursor: null,
    });

    await mockExpertReviews(page, 1, {
      reviews: [
        createExpertReview({
          chat_review_id: 2,
          comment: '두 번째 리뷰',
        }),
      ],
      nextCursor: null,
      hasMore: false,
      cursor: '2',
    });

    await page.goto('/experts/1');

    await expect(page.getByText('상세현직자')).toBeVisible();
    await expect(page.getByText('첫 번째 리뷰')).toBeVisible();

    await page.getByRole('button', { name: '리뷰 더보기' }).click();
    await expect(page.getByText('두 번째 리뷰')).toBeVisible();
  });

  test('shows empty state for submitted search with no experts', async ({ page, apiMocks }) => {
    await apiMocks.authGuest();

    await page.route('**/api/v1/experts**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(
          buildApiSuccess({
            experts: [],
            next_cursor: null,
            has_more: false,
          }),
        ),
      });
    });

    await page.goto('/experts');
    await page.getByPlaceholder('나에게 Fit한 현직자를 찾아보세요').fill('없는검색어');
    await page.getByRole('button', { name: '검색' }).click();

    await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
  });
});
