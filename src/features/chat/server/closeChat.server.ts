import { cookies } from 'next/headers';

import { apiFetch, buildApiUrl } from '@/shared/api';

const CHAT_CLOSE_PATH = '/api/v1/chats';

export interface CloseChatParams {
  chatId: number;
  accessToken?: string;
}

export async function closeChat(params: CloseChatParams): Promise<null> {
  const cookieStore = await cookies();
  const accessToken = params.accessToken ?? cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('UNAUTHORIZED');
  }

  const url = buildApiUrl(`${CHAT_CLOSE_PATH}/${params.chatId}`);

  return apiFetch<null>(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'CLOSED' }),
  });
}
