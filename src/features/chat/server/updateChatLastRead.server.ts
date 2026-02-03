import { BusinessError, buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const CHAT_LAST_READ_PATH = '/api/v1/chats';

export interface UpdateChatLastReadRequest {
  chatId: number;
  last_read_seq: number;
}

export async function updateChatLastRead(
  payload: UpdateChatLastReadRequest,
  accessTokenOverride?: string,
  allowRefresh: boolean = true,
): Promise<null> {
  const url = buildApiUrl(`${CHAT_LAST_READ_PATH}/${payload.chatId}/last-read-message`);
  if (process.env.NODE_ENV !== 'production') {
    console.info('[ChatLastRead] PATCH', url, {
      last_read_seq: payload.last_read_seq,
    });
  }

  const jsonInit: RequestInit = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      last_read_seq: payload.last_read_seq,
    }),
  };

  try {
    return await apiFetchWithRefresh<null>(url, jsonInit, accessTokenOverride, allowRefresh);
  } catch (error) {
    if (!(error instanceof BusinessError) || error.code !== 'INVALID_JSON_REQUEST') {
      throw error;
    }

    const fallbackUrl = new URL(url);
    fallbackUrl.searchParams.set('last_read_seq', String(payload.last_read_seq));
    const formBody = new URLSearchParams({
      last_read_seq: String(payload.last_read_seq),
    });

    if (process.env.NODE_ENV !== 'production') {
      console.info('[ChatLastRead] retry with form-encoded payload');
    }

    return apiFetchWithRefresh<null>(
      fallbackUrl.toString(),
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
      },
      accessTokenOverride,
      allowRefresh,
    );
  }
}
