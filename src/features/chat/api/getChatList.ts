import { apiFetch, buildApiUrl } from '@/shared/api';
import type { ChatListData } from '@/entities/chat';

const CHAT_LIST_PATH = '/api/v1/chats';

export interface ChatListParams {
  status?: 'ACTIVE' | 'CLOSED';
  cursor?: number;
  size?: number;
}

export async function getChatList(params: ChatListParams = {}): Promise<ChatListData> {
  const { status = 'ACTIVE', cursor, size = 20 } = params;
  const url = buildApiUrl(CHAT_LIST_PATH);
  const query = new URLSearchParams();

  query.set('status', status);
  if (cursor != null) query.set('cursor', String(cursor));
  if (size != null) query.set('size', String(size));

  const fullUrl = `${url}?${query.toString()}`;
  const accessToken =
    typeof document === 'undefined'
      ? null
      : document.cookie
          .split(';')
          .map((item) => item.trim())
          .find((item) => item.startsWith('access_token='))
          ?.split('=')[1] ?? null;

  return apiFetch<ChatListData>(fullUrl, {
    method: 'GET',
    headers: accessToken
      ? {
          Authorization: `Bearer ${decodeURIComponent(accessToken)}`,
        }
      : undefined,
  });
}
