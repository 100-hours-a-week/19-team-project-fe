import { apiFetch } from '@/shared/api';

type LogoutResponse = Record<string, never>;

export async function logout(): Promise<LogoutResponse> {
  return apiFetch<LogoutResponse>('/bff/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    successCodes: ['OK'],
  });
}
