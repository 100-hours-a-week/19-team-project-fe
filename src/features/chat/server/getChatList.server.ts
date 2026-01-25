import { cookies } from 'next/headers';

import type { ChatListData } from '@/entities/chat';
import { apiFetch, buildApiUrl } from '@/shared/api';

const CHAT_LIST_PATH = '/api/v1/chats';

export interface ChatListParams {
  status?: 'ACTIVE' | 'CLOSED';
  cursor?: number;
  size?: number;
  accessToken?: string;
}

export async function getChatList(params: ChatListParams = {}): Promise<ChatListData> {
  const cookieStore = await cookies();
  const accessToken = params.accessToken ?? cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('UNAUTHORIZED');
  }

  const { status = 'ACTIVE', cursor, size = 20 } = params;
  const url = buildApiUrl(CHAT_LIST_PATH);
  const query = new URLSearchParams();

  query.set('status', status);
  if (cursor !== null && cursor !== undefined) query.set('cursor', String(cursor));
  if (size !== null && size !== undefined) query.set('size', String(size));

  const fullUrl = `${url}?${query.toString()}`;

  return apiFetch<ChatListData>(fullUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
