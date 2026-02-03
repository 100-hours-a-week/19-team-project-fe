import { apiFetch } from '@/shared/api';

type DeleteMeResponse = Record<string, never>;

export async function deleteMe(): Promise<DeleteMeResponse> {
  return apiFetch<DeleteMeResponse>('/bff/users/me', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    successCodes: ['OK'],
  });
}
