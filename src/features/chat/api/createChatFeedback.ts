import { apiFetch, readAccessToken } from '@/shared/api';
import type { ChatFeedbackCreatedData, ChatFeedbackRequest } from '@/entities/chat';

const CHAT_FEEDBACK_PATH = '/bff/chat';

export interface CreateChatFeedbackParams {
  chatId: number;
  payload: ChatFeedbackRequest;
}

export async function createChatFeedback(
  params: CreateChatFeedbackParams,
): Promise<ChatFeedbackCreatedData> {
  const accessToken = readAccessToken();
  return apiFetch<ChatFeedbackCreatedData>(`${CHAT_FEEDBACK_PATH}/${params.chatId}/feedback`, {
    method: 'POST',
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      : { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.payload),
  });
}
