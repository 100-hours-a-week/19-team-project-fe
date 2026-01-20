import { apiFetch, buildApiUrl } from '@/shared/api';

import type { SignupRequest } from './types';

const SIGNUP_PATH = '/api/v1/auth/signup';

export async function signup(payload: SignupRequest): Promise<void> {
  const url = buildApiUrl(SIGNUP_PATH);
  await apiFetch<void>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    successCodes: ['OK'],
  });
}
