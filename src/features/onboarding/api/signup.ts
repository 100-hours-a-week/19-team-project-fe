import { apiFetch } from '@/shared/api';

import type { SignupRequest } from '@/entities/onboarding';

const SIGNUP_PATH = '/bff/auth/signup';

type SignupResult = {
  userId: number;
};

export async function signup(payload: SignupRequest): Promise<SignupResult> {
  return apiFetch<SignupResult>(SIGNUP_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    successCodes: ['OK', 'CREATED'],
  });
}
