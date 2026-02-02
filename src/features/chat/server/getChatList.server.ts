import type { ChatListData } from '@/entities/chat';
import { buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const CHAT_LIST_PATH = '/api/v1/chats';

export interface ChatListParams {
  status?: 'ACTIVE' | 'CLOSED';
  cursor?: number;
  size?: number;
  accessToken?: string;
  allowRefresh?: boolean;
}

export async function getChatList(params: ChatListParams = {}): Promise<ChatListData> {
  const { status = 'ACTIVE', cursor, size = 20 } = params;
  const url = buildApiUrl(CHAT_LIST_PATH);
  const query = new URLSearchParams();

  query.set('status', status);
  if (cursor !== null && cursor !== undefined) query.set('cursor', String(cursor));
  if (size !== null && size !== undefined) query.set('size', String(size));

  const fullUrl = `${url}?${query.toString()}`;

  return apiFetchWithRefresh<ChatListData>(
    fullUrl,
    { method: 'GET' },
    params.accessToken,
    params.allowRefresh ?? true,
  );
}
