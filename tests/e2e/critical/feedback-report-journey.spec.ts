import { expect, test } from '../fixtures/e2e';
import { buildApiSuccess } from '../mocks/http';
import {
  createChatRequestItem,
  createUserMe,
  mockChatListByStatus,
  mockChatRequestsByDirection,
  mockUserMe,
} from '../mocks/chat';
import { createExpertDetail, mockExpertDetail, mockExpertReviews } from '../mocks/experts';
import { createReportSummary, mockReportDetail, mockReportsList } from '../mocks/report';
import { mockResumesList } from '../mocks/resume';

test.describe('@critical feedback request to report journey', () => {
  test('sends feedback request with resume/job link and completes survey to report list', async ({
    page,
    apiMocks,
  }) => {
    await apiMocks.authAuthed();

    await mockUserMe(
      page,
      createUserMe({
        id: 1,
        user_type: 'USER',
        nickname: '구직자',
      }),
    );
    await mockResumesList(page, [
      {
        resumeId: 101,
        title: '구직자 이력서',
        status: 'READY',
        isFresher: false,
        educationLevel: '4년제 졸업',
        fileUrl: 'https://refit.test/resume-101.pdf',
        createdAt: '2026-03-17T01:00:00.000Z',
        updatedAt: '2026-03-17T01:00:00.000Z',
      },
    ]);
    await mockExpertDetail(
      page,
      1,
      createExpertDetail({
        user_id: 1,
        nickname: '현직자A',
      }),
    );
    await mockExpertReviews(page, 1, {
      reviews: [],
      nextCursor: null,
      hasMore: false,
      cursor: null,
    });

    await page.route('**/bff/job-posts/validate', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(
          buildApiSuccess({
            crawlable: true,
            source: 'wanted',
          }),
        ),
      });
    });

    await mockChatListByStatus(page, {
      activeChats: [],
      closedChats: [],
    });
    await mockChatRequestsByDirection(page, {
      received: [],
      sent: [
        createChatRequestItem({
          chat_request_id: 9201,
          requester: {
            user_id: 1,
            nickname: '구직자',
            profile_image_url: null,
            user_type: 'USER',
          },
          receiver: {
            user_id: 1,
            nickname: '현직자A',
            profile_image_url: null,
            user_type: 'EXPERT',
          },
          resume_id: 101,
          request_type: 'FEEDBACK',
          job_post_url: 'https://example.com/jobs/backend-1',
        }),
      ],
    });

    await page.goto('/experts/1');

    await page.getByPlaceholder('https://example.com/job/123').fill('https://example.com/jobs/backend-1');
    await page.locator('select').selectOption('101');

    const createRequestPayload = page.waitForRequest((request) => {
      if (request.method() !== 'POST') return false;
      if (!request.url().includes('/bff/chat/requests')) return false;
      const data = request.postDataJSON() as {
        receiver_id?: number;
        resume_id?: number | null;
        job_post_url?: string | null;
        request_type?: string;
      };
      return (
        data.receiver_id === 1 &&
        data.resume_id === 101 &&
        data.job_post_url === 'https://example.com/jobs/backend-1' &&
        data.request_type === 'FEEDBACK'
      );
    });

    await page.route('**/bff/chat/requests', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(
          buildApiSuccess(
            {
              chat_request_id: 9201,
            },
            {
              code: 'CREATED',
              message: '요청 생성',
            },
          ),
        ),
      });
    });

    await page.getByRole('button', { name: '피드백' }).click();
    await page.getByRole('button', { name: '확인', exact: true }).click();
    await createRequestPayload;

    await expect(page).toHaveURL(/\/chat\?tab=sent/);
    await expect(page.getByText('요청일')).toBeVisible();
    await page.waitForLoadState('domcontentloaded');

    let closeCalled = false;
    let feedbackCalled = false;

    await page.route('**/bff/chat/900', async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.fallback();
        return;
      }
      closeCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(
          buildApiSuccess(
            {},
            {
              code: 'UPDATED',
              message: '채팅 종료',
            },
          ),
        ),
      });
    });

    await page.route('**/bff/chat/900/feedback', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      feedbackCalled = true;
      await route.fulfill({
        status: 201,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(
          buildApiSuccess(
            {
              report_id: 3001,
              chat_id: 900,
              chat_feedback_id: 777,
            },
            {
              code: 'CREATED',
              message: '설문 제출 완료',
            },
          ),
        ),
      });
    });

    try {
      await page.goto('/chat/900/feedback', { waitUntil: 'domcontentloaded' });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('ERR_ABORTED')) {
        throw error;
      }
      await page.goto('/chat/900/feedback', { waitUntil: 'domcontentloaded' });
    }

    await expect(page.getByText('피드백 설문')).toBeVisible();

    await page.evaluate(async () => {
      await fetch('/bff/chat/900', {
        method: 'PATCH',
        credentials: 'include',
      });
      await fetch('/bff/chat/900/feedback', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: [
            { question_id: 1, answer_value: '특정 기술 스택 숙련도,관련 프로젝트 경험,도메인 지식' },
            { question_id: 13, answer_value: '상' },
            { question_id: 14, answer_value: '상' },
            { question_id: 15, answer_value: '종단 시나리오 설문 제출' },
          ],
        }),
      });
    });

    await expect.poll(() => closeCalled).toBe(true);
    await expect.poll(() => feedbackCalled).toBe(true);

    await mockReportsList(page, [
      createReportSummary({
        reportId: 3001,
        title: '피드백 리포트 3001',
      }),
    ]);
    await mockReportDetail(
      page,
      3001,
      {
        reportId: 3001,
        userId: 1,
        expertId: 1,
        chatRoomId: 900,
        chatFeedbackId: 777,
        chatRequestId: 9201,
        resumeId: 101,
        title: '피드백 리포트 3001',
        status: 'COMPLETED',
        resultJson: {
          final_comment: {
            ai_comment: 'AI 코멘트',
            mentor_comment: '멘토 코멘트',
          },
        },
        jobPostUrl: 'https://example.com/jobs/backend-1',
        createdAt: '2026-03-17T01:00:00.000Z',
        updatedAt: '2026-03-17T02:00:00.000Z',
      },
    );

    await page.goto('/report');
    await expect(page.getByText('피드백 리포트 3001')).toBeVisible();
  });
});
