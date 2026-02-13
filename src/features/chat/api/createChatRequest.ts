import { apiFetch, readAccessToken } from '@/shared/api';
import type { ChatCreateRequest, ChatRequestCreatedData } from '@/entities/chat';

const CHAT_REQUEST_PATH = '/bff/chat/requests';

export async function createChatRequest(
  payload: ChatCreateRequest,
): Promise<ChatRequestCreatedData> {
  const accessToken = readAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return apiFetch<ChatRequestCreatedData>(CHAT_REQUEST_PATH, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}
