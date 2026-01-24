import { apiFetch, buildApiUrl } from '@/shared/api';
import type { ChatMessageListData } from '@/entities/chat';

const CHAT_MESSAGES_PATH = '/api/v1/chats';

export interface ChatMessagesParams {
  chatId: number;
  cursor?: number;
  size?: number;
}

export async function getChatMessages(params: ChatMessagesParams): Promise<ChatMessageListData> {
  const { chatId, cursor, size = 50 } = params;
  const url = buildApiUrl(`${CHAT_MESSAGES_PATH}/${chatId}/messages`);
  const query = new URLSearchParams();

  if (cursor != null) query.set('cursor', String(cursor));
  if (size != null) query.set('size', String(size));

  const fullUrl = query.toString() ? `${url}?${query.toString()}` : url;
  const accessToken =
    typeof document === 'undefined'
      ? null
      : (document.cookie
          .split(';')
          .map((item) => item.trim())
          .find((item) => item.startsWith('access_token='))
          ?.split('=')[1] ?? null);

  return apiFetch<ChatMessageListData>(fullUrl, {
    method: 'GET',
    headers: accessToken
      ? {
          Authorization: `Bearer ${decodeURIComponent(accessToken)}`,
        }
      : undefined,
  });
}
