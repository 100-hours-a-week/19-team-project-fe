import { apiFetch } from '@/shared/api';

import type { SignupRequest } from '@/entities/onboarding';

type SignupBackendResponse = {
  user_id: number;
  access_token: string;
  refresh_token: string;
};

type SignupResult = {
  userId: number;
  accessToken: string;
  refreshToken: string;
};

export async function signup(payload: SignupRequest): Promise<SignupResult> {
  const data = await apiFetch<SignupBackendResponse>('/bff/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    successCodes: ['OK', 'CREATED'],
  });
  return {
    userId: data.user_id,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}
