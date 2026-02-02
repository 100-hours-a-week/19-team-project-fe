import 'server-only';

import type { ChatDetailData } from '@/entities/chat';
import { buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const CHAT_DETAIL_PATH = '/api/v1/chats';

export interface ChatDetailParams {
  chatId: number;
  accessToken?: string;
  allowRefresh?: boolean;
}

export async function getChatDetail(params: ChatDetailParams): Promise<ChatDetailData> {
  const url = buildApiUrl(`${CHAT_DETAIL_PATH}/${params.chatId}`);

  return apiFetchWithRefresh<ChatDetailData>(
    url,
    { method: 'GET' },
    params.accessToken,
    params.allowRefresh ?? true,
  );
}
