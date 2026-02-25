import { apiFetch, readAccessToken } from '@/shared/api';
import { normalizeChatDetail, type ChatDetailData } from '@/entities/chat';

const CHAT_DETAIL_PATH = '/bff/chat';

export interface ChatDetailParams {
  chatId: number;
}

export async function getChatDetail(params: ChatDetailParams): Promise<ChatDetailData> {
  const url = `${CHAT_DETAIL_PATH}/${params.chatId}`;
  const accessToken = readAccessToken();
  const data = await apiFetch<ChatDetailData>(url, {
    method: 'GET',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return normalizeChatDetail(data);
}
