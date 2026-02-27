import { apiFetch, readAccessToken } from '@/shared/api';
import type { ChatRequestStatus, ChatRequestUpdateData } from '@/entities/chat';

const CHAT_REQUEST_STATUS_PATH = '/bff/chat/requests';

export interface UpdateChatRequestStatusParams {
  requestId: number;
  status: Extract<ChatRequestStatus, 'ACCEPTED' | 'REJECTED'>;
}

export async function updateChatRequestStatus(
  params: UpdateChatRequestStatusParams,
): Promise<ChatRequestUpdateData> {
  const accessToken = readAccessToken();
  return apiFetch<ChatRequestUpdateData>(`${CHAT_REQUEST_STATUS_PATH}/${params.requestId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ status: params.status }),
  });
}
