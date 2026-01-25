import { apiFetch } from '@/shared/api';
import type { ChatCreateRequest, ChatCreatedData } from '@/entities/chat';

const CHAT_PATH = '/api/chat';

export async function createChat(payload: ChatCreateRequest): Promise<ChatCreatedData> {
  return apiFetch<ChatCreatedData>(CHAT_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
