import { cookies } from 'next/headers';

import type { ChatMessageListData } from '@/entities/chat';
import { apiFetch, buildApiUrl } from '@/shared/api';

const CHAT_MESSAGES_PATH = '/api/v1/chats';

export interface ChatMessagesParams {
  chatId: number;
  cursor?: number;
  size?: number;
}

export async function getChatMessages(params: ChatMessagesParams): Promise<ChatMessageListData> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('UNAUTHORIZED');
  }

  const { chatId, cursor, size = 50 } = params;
  const url = buildApiUrl(`${CHAT_MESSAGES_PATH}/${chatId}/messages`);
  const query = new URLSearchParams();

  if (cursor !== null && cursor !== undefined) query.set('cursor', String(cursor));
  if (size !== null && size !== undefined) query.set('size', String(size));

  const fullUrl = query.toString() ? `${url}?${query.toString()}` : url;

  return apiFetch<ChatMessageListData>(fullUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
