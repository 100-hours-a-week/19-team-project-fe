import { apiFetch, buildApiUrl } from '@/shared/api';

export type ExpertCareerLevel = {
  id: number;
  level: string;
};

export type ExpertJob = {
  id: number;
  name: string;
};

export type ExpertSkill = {
  id: number;
  name: string;
  display_order?: number;
};

export type Expert = {
  user_id: number;
  nickname: string;
  profile_image_url: string;
  introduction: string;
  career_level: ExpertCareerLevel;
  company_name: string;
  verified: boolean;
  rating_avg: number;
  rating_count: number;
  jobs: ExpertJob[];
  skills: ExpertSkill[];
  last_active_at: string;
};

export type ExpertsResponse = {
  experts: Expert[];
  next_cursor: string | null;
  has_more: boolean;
};

export type GetExpertsParams = {
  keyword?: string;
  jobId?: number;
  skillId?: number;
  careerLevel?: number;
  cursor?: number;
  size?: number;
};

export async function getExperts(params: GetExpertsParams = {}): Promise<ExpertsResponse> {
  const query = new URLSearchParams();

  if (params.keyword) query.set('keyword', params.keyword);
  if (params.jobId) query.set('job_id', String(params.jobId));
  if (params.skillId) query.set('skill_id', String(params.skillId));
  if (params.careerLevel) query.set('career_level', String(params.careerLevel));
  if (params.cursor) query.set('cursor', String(params.cursor));
  if (params.size) query.set('size', String(params.size));

  const path = query.toString() ? `/api/v1/experts?${query}` : '/api/v1/experts';
  return apiFetch<ExpertsResponse>(buildApiUrl(path));
}
