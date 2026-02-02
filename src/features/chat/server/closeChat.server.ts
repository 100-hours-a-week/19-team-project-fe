import { apiFetch, buildApiUrl } from '@/shared/api';
import { withAuthRetry } from '@/shared/api/server';

const CHAT_CLOSE_PATH = '/api/v1/chats';

export interface CloseChatParams {
  chatId: number;
  accessToken?: string;
}

export async function closeChat(params: CloseChatParams): Promise<null> {
  const url = buildApiUrl(`${CHAT_CLOSE_PATH}/${params.chatId}`);
  return withAuthRetry(
    (token) =>
      apiFetch<null>(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CLOSED' }),
      }),
    params.accessToken,
    { allowRefresh: !params.accessToken },
  );
}
