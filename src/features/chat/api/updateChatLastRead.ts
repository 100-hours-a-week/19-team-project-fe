import { apiFetch, readAccessToken } from '@/shared/api';

const CHAT_LAST_READ_PATH = '/bff/chat';

export interface UpdateChatLastReadRequest {
  chatId: number;
  last_read_seq: number;
}

export async function updateChatLastRead(payload: UpdateChatLastReadRequest): Promise<null> {
  const accessToken = readAccessToken();
  return apiFetch<null>(`${CHAT_LAST_READ_PATH}/${payload.chatId}/last-read-message`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ last_read_seq: payload.last_read_seq }),
  });
}
