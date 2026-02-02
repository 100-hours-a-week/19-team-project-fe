import type { ChatCreateRequest, ChatCreatedData } from '@/entities/chat';
import { buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const CHAT_PATH = '/api/v1/chats';

export async function createChat(
  payload: ChatCreateRequest,
  accessTokenOverride?: string,
  allowRefresh: boolean = true,
): Promise<ChatCreatedData> {
  const url = buildApiUrl(CHAT_PATH);

  return apiFetchWithRefresh<ChatCreatedData>(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    accessTokenOverride,
    allowRefresh,
  );
}
