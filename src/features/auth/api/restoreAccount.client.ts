import { apiFetch } from '@/shared/api';

type RestoreAccountPayload = {
  oauth_provider: 'KAKAO';
  oauth_id: string;
  email: string;
  nickname: string;
};

type RestoreAccountResult = {
  user_id: number;
  user_type: string;
  access_token: string;
  refresh_token: string;
};

export async function restoreAccount(
  payload: RestoreAccountPayload,
): Promise<RestoreAccountResult> {
  return apiFetch<RestoreAccountResult>('/bff/auth/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
