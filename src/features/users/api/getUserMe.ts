import { apiFetch } from '@/shared/api';

export type UserCareerLevel = {
  id: number;
  level: string;
};

export type UserJob = {
  id: number;
  name: string;
};

export type UserSkill = {
  id: number;
  name: string;
  display_order: number;
};

export type UserMe = {
  id: number;
  email: string;
  nickname: string;
  user_type: string;
  career_level: UserCareerLevel | null;
  introduction: string;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
  jobs: UserJob[];
  skills: UserSkill[];
};

export async function getUserMe(): Promise<UserMe | null> {
  return apiFetch<UserMe | null>('/bff/users/me');
}
