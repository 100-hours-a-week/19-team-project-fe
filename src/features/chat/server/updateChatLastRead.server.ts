import { buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const CHAT_LAST_READ_PATH = '/api/v1/chats';

export interface UpdateChatLastReadRequest {
  chatId: number;
  last_message_id: number;
}

export async function updateChatLastRead(
  payload: UpdateChatLastReadRequest,
  accessTokenOverride?: string,
  allowRefresh: boolean = true,
): Promise<null> {
  const url = buildApiUrl(`${CHAT_LAST_READ_PATH}/${payload.chatId}/last-read-message`);

  return apiFetchWithRefresh<null>(
    url,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        last_message_id: payload.last_message_id,
      }),
    },
    accessTokenOverride,
    allowRefresh,
  );
}
