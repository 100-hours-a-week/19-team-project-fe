import { cookies } from 'next/headers';

import type { ChatCreateRequest, ChatCreatedData } from '@/entities/chat';
import { apiFetch, buildApiUrl } from '@/shared/api';

const CHAT_PATH = '/api/v1/chats';

export async function createChat(payload: ChatCreateRequest): Promise<ChatCreatedData> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('UNAUTHORIZED');
  }

  const url = buildApiUrl(CHAT_PATH);

  return apiFetch<ChatCreatedData>(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
