import { apiFetch, readAccessToken } from '@/shared/api';
import type { ChatCreateRequest, ChatCreatedData } from '@/entities/chat';

const CHAT_PATH = '/api/chat';

export async function createChat(payload: ChatCreateRequest): Promise<ChatCreatedData> {
  const accessToken = readAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return apiFetch<ChatCreatedData>(CHAT_PATH, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}
