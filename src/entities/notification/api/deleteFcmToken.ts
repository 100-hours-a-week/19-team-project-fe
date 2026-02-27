import { apiFetch, readAccessToken } from '@/shared/api';

const FCM_TOKENS_PATH = '/bff/notifications/fcm-tokens';

type DeleteFcmTokenResponse = {
  deleted: boolean;
};

export async function deleteFcmToken(token: string): Promise<DeleteFcmTokenResponse> {
  const accessToken = readAccessToken();
  return apiFetch<DeleteFcmTokenResponse>(FCM_TOKENS_PATH, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ token }),
  });
}
