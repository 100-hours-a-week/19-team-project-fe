import type { ChatMessageListData } from '@/entities/chat';
import { buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const CHAT_MESSAGES_PATH = '/api/v1/chats';

export interface ChatMessagesParams {
  chatId: number;
  cursor?: number;
  size?: number;
  accessToken?: string;
  allowRefresh?: boolean;
}

export async function getChatMessages(params: ChatMessagesParams): Promise<ChatMessageListData> {
  const { chatId, cursor, size = 50 } = params;
  const url = buildApiUrl(`${CHAT_MESSAGES_PATH}/${chatId}/messages`);
  const query = new URLSearchParams();

  if (cursor !== null && cursor !== undefined) query.set('cursor', String(cursor));
  if (size !== null && size !== undefined) query.set('size', String(size));

  const fullUrl = query.toString() ? `${url}?${query.toString()}` : url;

  return apiFetchWithRefresh<ChatMessageListData>(
    fullUrl,
    { method: 'GET' },
    params.accessToken,
    params.allowRefresh ?? true,
  );
}
