import type { ChatCreateRequest, ChatCreatedData } from '@/entities/chat';
import { apiFetch, buildApiUrl } from '@/shared/api';
import { withAuthRetry } from '@/shared/api/server';

const CHAT_PATH = '/api/v1/chats';

export async function createChat(
  payload: ChatCreateRequest,
  accessTokenOverride?: string,
): Promise<ChatCreatedData> {
  const url = buildApiUrl(CHAT_PATH);
  return withAuthRetry(
    (token) =>
      apiFetch<ChatCreatedData>(url, {
        method: 'POST',
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
