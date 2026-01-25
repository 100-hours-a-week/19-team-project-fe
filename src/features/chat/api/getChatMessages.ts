import { apiFetch, readAccessToken } from '@/shared/api';
import type { ChatMessageListData } from '@/entities/chat';

const CHAT_MESSAGES_PATH = '/bff/chat';

export interface ChatMessagesParams {
  chatId: number;
  cursor?: number;
  size?: number;
}

export async function getChatMessages(params: ChatMessagesParams): Promise<ChatMessageListData> {
  const { chatId, cursor, size = 50 } = params;
  const url = `${CHAT_MESSAGES_PATH}/${chatId}/messages`;
  const query = new URLSearchParams();

  if (cursor !== null && cursor !== undefined) query.set('cursor', String(cursor));
  if (size !== null && size !== undefined) query.set('size', String(size));

  const fullUrl = query.toString() ? `${url}?${query.toString()}` : url;

  const accessToken = readAccessToken();
  return apiFetch<ChatMessageListData>(fullUrl, {
    method: 'GET',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}
