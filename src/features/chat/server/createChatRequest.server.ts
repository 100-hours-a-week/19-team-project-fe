import type { ChatCreateRequest, ChatRequestCreatedData } from '@/entities/chat';
import { buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const CHAT_REQUEST_PATH = '/api/v2/chats/requests';

export async function createChatRequest(
  payload: ChatCreateRequest,
  accessTokenOverride?: string,
  allowRefresh: boolean = true,
): Promise<ChatRequestCreatedData> {
  const url = buildApiUrl(CHAT_REQUEST_PATH);

  return apiFetchWithRefresh<ChatRequestCreatedData>(
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
