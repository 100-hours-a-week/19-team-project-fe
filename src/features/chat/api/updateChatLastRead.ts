import { apiFetch, readAccessToken } from '@/shared/api';

const CHAT_LAST_READ_PATH = '/bff/chat';

export interface UpdateChatLastReadRequest {
  chatId: number;
  last_message_id: number;
}

export async function updateChatLastRead(payload: UpdateChatLastReadRequest): Promise<null> {
  const accessToken = readAccessToken();
  return apiFetch<null>(`${CHAT_LAST_READ_PATH}/${payload.chatId}/last-read-message`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ last_message_id: payload.last_message_id }),
  });
}
