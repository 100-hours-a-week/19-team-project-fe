import { expect, test } from '../fixtures/e2e';
import { buildApiSuccess } from '../mocks/http';

test.describe('@critical resume async flows', () => {
  test('shows loading state then renders resumes list', async ({ page, apiMocks }) => {
    await apiMocks.authAuthed();

    await page.route('**/bff/resumes', async (route) => {
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
            resumes: [
              {
                resumeId: 1,
                title: '비동기 이력서',
                status: 'READY',
                isFresher: false,
                educationLevel: '4년제 졸업',
                fileUrl: 'https://refit.test/resume-1.pdf',
                createdAt: '2026-03-17T01:00:00.000Z',
                updatedAt: '2026-03-17T01:00:00.000Z',
              },
            ],
          }),
        ),
      });
    });

    await page.goto('/resume');

    await expect(page.getByText('이력서를 불러오는 중...')).toBeVisible();
    await expect(page.getByText('비동기 이력서')).toBeVisible();
    await expect(page.getByText('이력서를 불러오는 중...')).not.toBeVisible();
  });

  test('promotes pending parse task to created resume after async completion', async ({
    page,
    apiMocks,
  }) => {
    await apiMocks.authAuthed();

    await page.addInitScript(() => {
      sessionStorage.setItem(
        'resumeParsePendingTasks',
        JSON.stringify([
          {
            taskId: 'parse-task-1',
            fileUrl: 'https://refit.test/uploads/resume.pdf',
            createdAt: '2026-03-17T01:00:00.000Z',
          },
        ]),
      );
    });

    let resumes = [
      {
        resumeId: 1,
        title: '기존 이력서',
        status: 'READY',
        isFresher: false,
        educationLevel: '4년제 졸업',
        fileUrl: 'https://refit.test/resume-existing.pdf',
        createdAt: '2026-03-17T01:00:00.000Z',
        updatedAt: '2026-03-17T01:00:00.000Z',
      },
    ];

    await page.route('**/bff/resumes/tasks/parse-task-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(
          buildApiSuccess({
            taskId: 'parse-task-1',
            status: 'COMPLETED',
            result: {
              is_fresher: false,
              education_level: '4년제 졸업',
              content_json: {
                summary: '자동 파싱',
                careers: ['Auto Career'],
              },
            },
          }),
        ),
      });
    });

    await page.route('**/bff/resumes', async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify(buildApiSuccess({ resumes })),
        });
        return;
      }

      if (method === 'POST') {
        resumes = [
          {
            resumeId: 777,
            title: '자동 생성 이력서',
            status: 'READY',
            isFresher: false,
            educationLevel: '4년제 졸업',
            fileUrl: 'https://refit.test/resume-auto.pdf',
            createdAt: '2026-03-17T03:00:00.000Z',
            updatedAt: '2026-03-17T03:00:00.000Z',
          },
          ...resumes,
        ];
        await route.fulfill({
          status: 201,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify(
            buildApiSuccess(
              {
                resumeId: 777,
              },
              {
                code: 'CREATED',
                message: '생성 완료',
              },
            ),
          ),
        });
        return;
      }

      await route.fallback();
    });

    const parseTaskRequest = page.waitForRequest((request) => {
      return (
        request.url().includes('/bff/resumes/tasks/parse-task-1') && request.method() === 'GET'
      );
    });
    const createResumeRequest = page.waitForRequest((request) => {
      return request.url().endsWith('/bff/resumes') && request.method() === 'POST';
    });

    await page.goto('/resume');

    await parseTaskRequest;
    await createResumeRequest;
    await expect(page.getByText('자동 생성 이력서')).toBeVisible();

    const pendingTaskRaw = await page.evaluate(() =>
      sessionStorage.getItem('resumeParsePendingTasks'),
    );
    expect(pendingTaskRaw).toBe('[]');
  });

  test('loads resume detail asynchronously and renders content section', async ({
    page,
    apiMocks,
  }) => {
    await apiMocks.authAuthed();

    await page.route('**/bff/resumes/55', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(
          buildApiSuccess({
            resumeId: 55,
            title: '상세 이력서',
            isFresher: false,
            educationLevel: '4년제 졸업',
            fileUrl: 'https://refit.test/resume-detail.pdf',
            contentJson: {
              summary: '비동기 상세 로드 테스트',
              careers: ['Refit | Backend Developer'],
            },
            createdAt: '2026-03-17T01:00:00.000Z',
            updatedAt: '2026-03-17T01:00:00.000Z',
          }),
        ),
      });
    });

    await page.goto('/resume/55');

    await expect(page.getByText('이력서를 불러오는 중...')).toBeVisible();
    await expect(page.getByText('상세 이력서')).toBeVisible();
    await expect(page.getByText('비동기 상세 로드 테스트')).toBeVisible();
  });
});
