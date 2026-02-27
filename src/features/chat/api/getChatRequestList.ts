import { apiFetch, readAccessToken } from '@/shared/api';
import type { ChatRequestListData, ChatRequestStatus } from '@/entities/chat';

const CHAT_REQUEST_LIST_PATH = '/bff/chat/requests';

export interface ChatRequestListParams {
  direction: 'received' | 'sent';
  status?: ChatRequestStatus;
  cursor?: number;
  size?: number;
}

export async function getChatRequestList(
  params: ChatRequestListParams,
): Promise<ChatRequestListData> {
  const { direction, status, cursor, size = 5 } = params;
  const query = new URLSearchParams();

  query.set('direction', direction);
  if (status) query.set('status', status);
  if (cursor !== null && cursor !== undefined) query.set('cursor', String(cursor));
  if (size !== null && size !== undefined) query.set('size', String(size));

  const fullUrl = `${CHAT_REQUEST_LIST_PATH}?${query.toString()}`;
  const accessToken = readAccessToken();
  return apiFetch<ChatRequestListData>(fullUrl, {
    method: 'GET',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}
