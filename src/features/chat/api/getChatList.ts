import { apiFetch, readAccessToken } from '@/shared/api';
import { normalizeChatListData, type ChatListData } from '@/entities/chat';

const CHAT_LIST_PATH = '/bff/chat';

export interface ChatListParams {
  status?: 'ACTIVE' | 'CLOSED';
  cursor?: number;
  size?: number;
}

export async function getChatList(params: ChatListParams = {}): Promise<ChatListData> {
  const { status = 'ACTIVE', cursor, size = 20 } = params;
  const url = CHAT_LIST_PATH;
  const query = new URLSearchParams();

  query.set('status', status);
  if (cursor !== null && cursor !== undefined) query.set('cursor', String(cursor));
  if (size !== null && size !== undefined) query.set('size', String(size));

  const fullUrl = `${url}?${query.toString()}`;
  const accessToken = readAccessToken();
  const data = await apiFetch<ChatListData>(fullUrl, {
    method: 'GET',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return normalizeChatListData(data as ChatListData);
}
