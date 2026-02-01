import { apiFetch } from '@/shared/api';
import type { UserMe } from './getUserMe';

type UpdateUserSkill = {
  skill_id: number;
  display_order: number;
};

type UpdateUserMePayload = {
  nickname?: string;
  introduction?: string;
  profile_image_url?: string;
  career_level_id?: number;
  job_ids?: number[];
  skills?: UpdateUserSkill[];
};

export async function updateUserMe(payload: UpdateUserMePayload): Promise<UserMe> {
  return apiFetch<UserMe>('/bff/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
