import { apiFetch, readAccessToken } from '@/shared/api';

const CHAT_READ_PATH = '/api/chat/messages/read';

export interface MarkChatReadRequest {
  chat_id: number;
  message_id: number;
}

export async function markChatRead(payload: MarkChatReadRequest): Promise<null> {
  const accessToken = readAccessToken();
  return apiFetch<null>(CHAT_READ_PATH, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}
