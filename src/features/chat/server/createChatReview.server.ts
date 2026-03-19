import 'server-only';

import type { ChatReviewCreatedData, ChatReviewRequest } from '@/entities/chat';
import { buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const CHAT_REVIEW_PATH = '/api/v3/chats';
const CHAT_REVIEW_TIMEOUT_MS = 30000;

export interface CreateChatReviewParams {
  chatId: number;
  payload: ChatReviewRequest;
  accessToken?: string;
  allowRefresh?: boolean;
}

export async function createChatReview(
  params: CreateChatReviewParams,
): Promise<ChatReviewCreatedData> {
  const reviewUrl = buildApiUrl(`${CHAT_REVIEW_PATH}/${params.chatId}/reviews`);

  return apiFetchWithRefresh<ChatReviewCreatedData>(
    reviewUrl,
    {
      method: 'POST',
      signal: AbortSignal.timeout(CHAT_REVIEW_TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params.payload),
    },
    params.accessToken,
    params.allowRefresh ?? true,
  );
}
