import { expect, test } from '../fixtures/e2e';
import { buildApiSuccess } from '../mocks/http';
import { createReportDetail, createReportSummary } from '../mocks/report';

test.describe('@critical report async flows', () => {
  test('shows loading state then renders report list', async ({ page, apiMocks }) => {
    await apiMocks.authAuthed();

    await page.route('**/bff/reports', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 350));
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(
          buildApiSuccess({
            reports: [
              createReportSummary({
                reportId: 10,
                title: '비동기 리포트',
              }),
            ],
          }),
        ),
      });
    });

    await page.goto('/report');

    await expect(page.getByText('리포트를 불러오는 중...')).toBeVisible();
    await expect(page.getByText('비동기 리포트')).toBeVisible();
  });

  test('loads report detail asynchronously and renders final comment', async ({ page, apiMocks }) => {
    await apiMocks.authAuthed();

    await page.route('**/bff/reports/10', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(
          buildApiSuccess(
            createReportDetail({
              reportId: 10,
              title: '상세 리포트',
              resultJson: {
                basic_info: {
                  report_date: '2026-03-17',
                  job_post_title: 'Backend Engineer',
                  job_post_position: 'Backend',
                },
                final_comment: {
                  ai_comment: 'AI 코멘트입니다.',
                  mentor_comment: '멘토 코멘트입니다.',
                },
              },
            }),
          ),
        ),
      });
    });

    await page.goto('/report/10');

    await expect(page.getByText('리포트를 불러오는 중...')).toBeVisible();
    await expect(page.getByText('상세 리포트')).toBeVisible();
    await expect(page.getByText('멘토: 멘토 코멘트입니다.')).toBeVisible();
  });

  test('deletes report after confirm and removes it from list', async ({ page, apiMocks }) => {
    await apiMocks.authAuthed();

    let reports = [
      createReportSummary({ reportId: 21, title: '삭제 대상 리포트' }),
      createReportSummary({ reportId: 22, title: '유지 리포트' }),
    ];

    await page.route('**/bff/reports', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(buildApiSuccess({ reports })),
      });
    });

    await page.route('**/bff/reports/21', async (route) => {
      if (route.request().method() !== 'DELETE') {
        await route.fallback();
        return;
      }

      reports = reports.filter((report) => report.reportId !== 21);
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(buildApiSuccess({})),
      });
    });

    await page.goto('/report');

    page.once('dialog', (dialog) => {
      dialog.accept().catch(() => undefined);
    });

    await page.getByRole('button', { name: '리포트 옵션' }).first().click();

    await page.getByRole('button', { name: '삭제', exact: true }).click();

    await expect(page.getByText('삭제 대상 리포트')).not.toBeVisible();
    await expect(page.getByText('유지 리포트')).toBeVisible();
  });
});
