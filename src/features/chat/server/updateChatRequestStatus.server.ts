import type { ChatRequestStatus, ChatRequestUpdateData } from '@/entities/chat';
import { buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const CHAT_REQUEST_STATUS_PATH = '/api/v2/chats/requests';

export interface UpdateChatRequestStatusParams {
  requestId: number;
  status: Extract<ChatRequestStatus, 'ACCEPTED' | 'REJECTED'>;
  accessToken?: string;
  allowRefresh?: boolean;
}

export async function updateChatRequestStatus(
  params: UpdateChatRequestStatusParams,
): Promise<ChatRequestUpdateData> {
  const url = buildApiUrl(`${CHAT_REQUEST_STATUS_PATH}/${params.requestId}`);
  return apiFetchWithRefresh<ChatRequestUpdateData>(
    url,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: params.status }),
    },
    params.accessToken,
    params.allowRefresh ?? true,
  );
}
