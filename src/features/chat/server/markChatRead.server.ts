import { cookies } from 'next/headers';

import { apiFetch, buildApiUrl } from '@/shared/api';

const CHAT_READ_PATH = '/api/v1/chats/messages/read';

export interface MarkChatReadRequest {
  chat_id: number;
  message_id: number;
}

export async function markChatRead(
  payload: MarkChatReadRequest,
  accessTokenOverride?: string,
): Promise<null> {
  const cookieStore = await cookies();
  const accessToken = accessTokenOverride ?? cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('UNAUTHORIZED');
  }

  const url = buildApiUrl(CHAT_READ_PATH);

  return apiFetch<null>(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
