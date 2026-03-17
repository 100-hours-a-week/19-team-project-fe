import { expect, test } from '../fixtures/e2e';
import { buildApiSuccess } from '../mocks/http';
import {
  createChatRequestItem,
  createChatSummary,
  mockChatRequestsByDirection,
  mockUpdateChatRequestStatus,
} from '../mocks/chat';

test.describe('@critical chat async flows', () => {
  test('shows loading state then renders chat list', async ({ page, apiMocks }) => {
    await apiMocks.authAuthed();
    await apiMocks.userMe({ id: 1, userType: 'USER', nickname: '채팅유저' });
    await apiMocks.chatRequests({ receivedCount: 0, sentCount: 0 });

    await page.route('**/bff/chat**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }

      const requestUrl = new URL(route.request().url());
      const status = requestUrl.searchParams.get('status');
      const chats =
        status === 'CLOSED'
          ? []
          : [
              createChatSummary({
                chat_id: 1101,
                receiver: {
                  user_id: 8,
                  nickname: '비동기 멘토',
                  profile_image_url: null,
                  user_type: 'EXPERT',
                },
                last_message: {
                  message_id: 2201,
                  content: '첫 채팅 메시지',
                  created_at: '2026-03-17T01:10:00.000Z',
                  last_message_at: '2026-03-17T01:10:00.000Z',
                },
              }),
            ];

      if (status !== 'CLOSED') {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(
          buildApiSuccess({
            chats,
            nextCursor: null,
            hasMore: false,
          }),
        ),
      });
    });

    await page.goto('/chat');

    await expect(page.getByText('불러오는 중...')).toBeVisible();
    await expect(page.getByText('비동기 멘토')).toBeVisible();
    await expect(page.getByText('첫 채팅 메시지')).toBeVisible();
  });

  test('rejects received request and removes item from list', async ({ page, apiMocks }) => {
    await apiMocks.authAuthed();
    await apiMocks.userMe({ id: 99, userType: 'EXPERT', nickname: '전문가계정' });
    await apiMocks.chatList({ activeCount: 0, closedCount: 0 });
    await mockChatRequestsByDirection(page, {
      received: [
        createChatRequestItem({
          chat_request_id: 701,
          requester: {
            user_id: 501,
            nickname: '수락대기 요청자',
            profile_image_url: null,
            user_type: 'USER',
          },
          receiver: {
            user_id: 99,
            nickname: '전문가계정',
            profile_image_url: null,
            user_type: 'EXPERT',
          },
        }),
      ],
      sent: [],
    });
    await mockUpdateChatRequestStatus(page, 701, null);

    await page.goto('/chat?tab=received');

    await expect(page.getByText('수락대기 요청자')).toBeVisible();
    await page.getByRole('button', { name: '거절' }).click();
    await expect(page.getByText('요청을 거절할까요?')).toBeVisible();

    const updateRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' && request.url().includes('/bff/chat/requests/701'),
    );
    await page.getByRole('button', { name: '확인', exact: true }).click();
    await updateRequest;

    await expect(page.getByText('수락대기 요청자')).not.toBeVisible();
  });

  test('shows loading state then renders sent requests list', async ({ page, apiMocks }) => {
    await apiMocks.authAuthed();
    await apiMocks.userMe({ id: 1, userType: 'USER', nickname: '요청자계정' });
    await apiMocks.chatList({ activeCount: 0, closedCount: 0 });

    await page.route('**/bff/chat/requests**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }

      const requestUrl = new URL(route.request().url());
      const direction = requestUrl.searchParams.get('direction');

      if (direction === 'sent') {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(
          buildApiSuccess({
            requests:
              direction === 'sent'
                ? [
                    createChatRequestItem({
                      chat_request_id: 901,
                      requester: {
                        user_id: 1,
                        nickname: '요청자계정',
                        profile_image_url: null,
                        user_type: 'USER',
                      },
                      receiver: {
                        user_id: 333,
                        nickname: '비동기 전문가',
                        profile_image_url: null,
                        user_type: 'EXPERT',
                      },
                    }),
                  ]
                : [],
            next_cursor: null,
            has_more: false,
          }),
        ),
      });
    });

    await page.goto('/chat');
    await page.getByRole('button', { name: '요청 중' }).click();

    await expect(page.getByText('불러오는 중...')).toBeVisible();
    await expect(page.getByText('비동기 전문가')).toBeVisible();
    await expect(page.getByRole('button', { name: '요청 중' })).toBeVisible();
  });
});
