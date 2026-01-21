import { apiFetch, buildApiUrl } from '@/shared/api';

import type { SignupRequest, SignupResponse } from './types';

const SIGNUP_PATH = '/api/v3/auth/signup';

export async function signup(payload: SignupRequest): Promise<SignupResponse> {
  const url = buildApiUrl(SIGNUP_PATH);
  return apiFetch<SignupResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    successCodes: ['CREATED'],
  });
}
