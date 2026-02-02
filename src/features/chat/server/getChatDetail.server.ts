import 'server-only';

import type { ChatDetailData } from '@/entities/chat';
import { apiFetch, buildApiUrl } from '@/shared/api';
import { withAuthRetry } from '@/shared/api/server';

const CHAT_DETAIL_PATH = '/api/v1/chats';

export interface ChatDetailParams {
  chatId: number;
  accessToken?: string;
}

export async function getChatDetail(params: ChatDetailParams): Promise<ChatDetailData> {
  const url = buildApiUrl(`${CHAT_DETAIL_PATH}/${params.chatId}`);
  return withAuthRetry(
    (token) =>
      apiFetch<ChatDetailData>(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    params.accessToken,
    { allowRefresh: !params.accessToken },
  );
}
