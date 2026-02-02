import { buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const CHAT_READ_PATH = '/api/v1/chats/messages/read';

export interface MarkChatReadRequest {
  chat_id: number;
  message_id: number;
}

export async function markChatRead(
  payload: MarkChatReadRequest,
  accessTokenOverride?: string,
  allowRefresh: boolean = true,
): Promise<null> {
  const url = buildApiUrl(CHAT_READ_PATH);

  return apiFetchWithRefresh<null>(
    url,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    accessTokenOverride,
    allowRefresh,
  );
}
