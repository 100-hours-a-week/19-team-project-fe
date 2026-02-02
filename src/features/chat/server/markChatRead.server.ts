import { apiFetch, buildApiUrl } from '@/shared/api';
import { withAuthRetry } from '@/shared/api/server';

const CHAT_READ_PATH = '/api/v1/chats/messages/read';

export interface MarkChatReadRequest {
  chat_id: number;
  message_id: number;
}

export async function markChatRead(
  payload: MarkChatReadRequest,
  accessTokenOverride?: string,
): Promise<null> {
  const url = buildApiUrl(CHAT_READ_PATH);
  return withAuthRetry(
    (token) =>
      apiFetch<null>(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }),
    accessTokenOverride,
    { allowRefresh: !accessTokenOverride },
  );
}
