import { expect, test } from '../fixtures/e2e';

test.describe('@error chat flows', () => {
  test('shows inline error message when chat list request fails', async ({ page, apiMocks }) => {
    await apiMocks.authAuthed();
    await apiMocks.userMe({ id: 1, userType: 'USER', nickname: '채팅유저' });
    await apiMocks.chatListError('채팅 목록 조회 실패');
    await apiMocks.chatRequests({ receivedCount: 0, sentCount: 0 });

    await page.goto('/chat');

    await expect(page.getByText('채팅 목록 조회 실패')).toBeVisible();
  });

  test('shows inline error message when sent requests query fails', async ({ page, apiMocks }) => {
    await apiMocks.authAuthed();
    await apiMocks.userMe({ id: 1, userType: 'USER', nickname: '채팅유저' });
    await apiMocks.chatList({ activeCount: 0, closedCount: 0 });
    await apiMocks.chatRequestsError('sent', '보낸 요청 조회 실패');

    await page.goto('/chat?tab=sent');

    await expect(page.getByText('보낸 요청 조회 실패')).toBeVisible();
  });
});

