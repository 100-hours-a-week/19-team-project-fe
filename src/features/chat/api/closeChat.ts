import { apiFetch, readAccessToken } from '@/shared/api';

const CHAT_CLOSE_PATH = '/bff/chat';

export interface CloseChatParams {
  chatId: number;
}

export async function closeChat(params: CloseChatParams): Promise<null> {
  const url = `${CHAT_CLOSE_PATH}/${params.chatId}`;
  const accessToken = readAccessToken();
  return apiFetch<null>(url, {
    method: 'PATCH',
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'CLOSED' }),
  });
}
