import { apiFetch, readAccessToken } from '@/shared/api';
import type { ChatReviewCreatedData, ChatReviewRequest } from '@/entities/chat';

const CHAT_REVIEW_PATH = '/bff/chat';

export interface CreateChatReviewParams {
  chatId: number;
  payload: ChatReviewRequest;
}

export async function createChatReview(
  params: CreateChatReviewParams,
): Promise<ChatReviewCreatedData> {
  const accessToken = readAccessToken();
  return apiFetch<ChatReviewCreatedData>(`${CHAT_REVIEW_PATH}/${params.chatId}/reviews`, {
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
