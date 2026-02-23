import { apiFetch, readAccessToken } from '@/shared/api';

const FCM_TOKENS_PATH = '/bff/notifications/fcm-tokens';

type RegisterFcmTokenResponse = {
  fcm_token_id: number;
  token: string;
  created_at: string;
  updated_at: string;
};

export async function registerFcmToken(token: string): Promise<RegisterFcmTokenResponse> {
  const accessToken = readAccessToken();
  return apiFetch<RegisterFcmTokenResponse>(FCM_TOKENS_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ token }),
  });
}
