import { apiFetch } from '@/shared/api';
import type { UserMe } from './getUserMe';

export async function deleteProfileImage(): Promise<UserMe> {
  return apiFetch<UserMe>('/bff/users/me/profile-image', {
    method: 'DELETE',
  });
}
