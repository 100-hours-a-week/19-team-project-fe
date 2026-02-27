import { apiFetch } from '@/shared/api';

export type ExpertRecommendation = {
  user_id: number;
  nickname: string;
  company_name: string;
  verified: boolean;
  rating_avg: number;
  rating_count: number;
  response_rate: number;
  skills: string[];
  jobs: string[];
  introduction: string;
  similarity_score: number;
  filter_type: string;
  ground_truth: string;
  last_active_at: string;
  profile_image_url?: string;
};

export type ExpertRecommendationsResponse = {
  user_id: number;
  recommendations: ExpertRecommendation[];
  total_count: number;
  evaluation: Record<string, unknown>;
};

export type GetExpertRecommendationsParams = {
  topK?: number;
  verified?: boolean;
  includeEval?: boolean;
  userId?: number;
  accessToken?: string;
};

export async function getExpertRecommendations(
  params: GetExpertRecommendationsParams = {},
): Promise<ExpertRecommendationsResponse> {
  const query = new URLSearchParams();

  if (params.topK !== undefined) query.set('top_k', String(params.topK));
  if (params.verified !== undefined) query.set('verified', String(params.verified));
  if (params.includeEval !== undefined) query.set('include_eval', String(params.includeEval));
  if (params.userId !== undefined) query.set('user_id', String(params.userId));

  const path = query.toString()
    ? `/bff/experts/recommendations?${query.toString()}`
    : '/bff/experts/recommendations';

  return apiFetch<ExpertRecommendationsResponse>(path, {
    method: 'GET',
    cache: 'no-store',
    headers: params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : undefined,
  });
}
