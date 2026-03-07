import { apiFetch, buildApiUrl } from '@/shared/api';

export type ExpertDetail = {
  user_id: number;
  nickname: string;
  profile_image_url: string;
  introduction: string;
  company_name: string;
  verified: boolean;
  verified_at: string | null;
  career_level: {
    id: number;
    level: string;
  };
  jobs: Array<{
    id: number;
    name: string;
  }>;
  skills: Array<{
    id: number;
    name: string;
    display_order: number;
  }>;
  rating_avg: number;
  rating_count: number;
  last_active_at: string;
};

const EXPERT_DETAIL_REVALIDATE_SECONDS = 600;

export async function getExpertDetail(userId: number): Promise<ExpertDetail> {
  const requestInit =
    typeof window === 'undefined'
      ? { next: { revalidate: EXPERT_DETAIL_REVALIDATE_SECONDS } }
      : undefined;

  return apiFetch<ExpertDetail>(buildApiUrl(`/api/v1/experts/${userId}`), requestInit);
}
