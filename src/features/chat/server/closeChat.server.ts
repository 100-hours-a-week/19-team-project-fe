import { buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const CHAT_CLOSE_PATH = '/api/v1/chats';

export interface CloseChatParams {
  chatId: number;
  accessToken?: string;
  allowRefresh?: boolean;
}

export async function closeChat(params: CloseChatParams): Promise<null> {
  const url = buildApiUrl(`${CHAT_CLOSE_PATH}/${params.chatId}`);

  return apiFetchWithRefresh<null>(
    url,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'CLOSED' }),
    },
    params.accessToken,
    params.allowRefresh ?? true,
  );
}
