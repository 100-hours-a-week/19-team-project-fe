import type { ChatRequestListData, ChatRequestStatus } from '@/entities/chat';
import { buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const CHAT_REQUEST_LIST_PATH = '/api/v2/chats/requests';

export interface ChatRequestListParams {
  direction: 'received' | 'sent';
  status?: ChatRequestStatus;
  cursor?: number;
  size?: number;
  accessToken?: string;
  allowRefresh?: boolean;
}

export async function getChatRequestList(
  params: ChatRequestListParams,
): Promise<ChatRequestListData> {
  const { direction, status, cursor, size = 5 } = params;
  const url = buildApiUrl(CHAT_REQUEST_LIST_PATH);
  const query = new URLSearchParams();

  query.set('direction', direction);
  if (status) query.set('status', status);
  if (cursor !== null && cursor !== undefined) query.set('cursor', String(cursor));
  if (size !== null && size !== undefined) query.set('size', String(size));

  const fullUrl = `${url}?${query.toString()}`;

  return apiFetchWithRefresh<ChatRequestListData>(
    fullUrl,
    { method: 'GET' },
    params.accessToken,
    params.allowRefresh ?? true,
  );
}
