import 'server-only';

import { cookies } from 'next/headers';

import type { ChatDetailData } from '@/entities/chat';
import { apiFetch, buildApiUrl } from '@/shared/api';

const CHAT_DETAIL_PATH = '/api/v1/chats';

export interface ChatDetailParams {
  chatId: number;
  accessToken?: string;
}

export async function getChatDetail(params: ChatDetailParams): Promise<ChatDetailData> {
  const cookieStore = await cookies();
  const accessToken = params.accessToken ?? cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('UNAUTHORIZED');
  }

  const url = buildApiUrl(`${CHAT_DETAIL_PATH}/${params.chatId}`);

  return apiFetch<ChatDetailData>(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
