import 'server-only';

import type { ChatFeedbackCreatedData, ChatFeedbackRequest } from '@/entities/chat';
import { buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const CHAT_FEEDBACK_PATH = '/api/v2/chats';

export interface CreateChatFeedbackParams {
  chatId: number;
  payload: ChatFeedbackRequest;
  accessToken?: string;
  allowRefresh?: boolean;
}

export async function createChatFeedback(
  params: CreateChatFeedbackParams,
): Promise<ChatFeedbackCreatedData> {
  const url = buildApiUrl(`${CHAT_FEEDBACK_PATH}/${params.chatId}/feedback`);

  return apiFetchWithRefresh<ChatFeedbackCreatedData>(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params.payload),
    },
    params.accessToken,
    params.allowRefresh ?? true,
  );
}
