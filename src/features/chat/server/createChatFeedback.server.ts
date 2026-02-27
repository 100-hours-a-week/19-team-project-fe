import 'server-only';

import type { ChatFeedbackCreatedData, ChatFeedbackRequest } from '@/entities/chat';
import { buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const CHAT_FEEDBACK_PATH = '/api/v2/chats';
const REPORTS_PATH = '/api/v2/reports';
const REPORT_CREATE_TIMEOUT_MS = 30000;

export interface CreateChatFeedbackParams {
  chatId: number;
  payload: ChatFeedbackRequest;
  accessToken?: string;
  allowRefresh?: boolean;
}

export async function createChatFeedback(
  params: CreateChatFeedbackParams,
): Promise<ChatFeedbackCreatedData> {
  const feedbackUrl = buildApiUrl(`${CHAT_FEEDBACK_PATH}/${params.chatId}/feedback`);

  return apiFetchWithRefresh<ChatFeedbackCreatedData>(
    feedbackUrl,
    {
      method: 'POST',
      signal: AbortSignal.timeout(REPORT_CREATE_TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params.payload),
    },
    params.accessToken,
    params.allowRefresh ?? true,
  );
}

export async function requestReportCreate(
  params: Omit<CreateChatFeedbackParams, 'payload'>,
): Promise<ChatFeedbackCreatedData> {
  const reportUrl = buildApiUrl(REPORTS_PATH);
  return apiFetchWithRefresh<ChatFeedbackCreatedData>(
    reportUrl,
    {
      method: 'POST',
      signal: AbortSignal.timeout(REPORT_CREATE_TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chat_room_id: params.chatId }),
    },
    params.accessToken,
    params.allowRefresh ?? true,
  );
}
