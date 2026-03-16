import { apiFetch, readAccessToken } from '@/shared/api';

export type ExpertReview = {
  chat_review_id: number;
  chat_id: number;
  reviewer: {
    user_id: number;
    nickname: string;
    profile_image_url?: string | null;
    user_type?: string;
  };
  rating: number;
  comment: string;
  created_at: string;
};

export type ExpertReviewsResponse = {
  reviews: ExpertReview[];
  next_cursor: string | null;
  has_more: boolean;
};

export type GetExpertReviewsParams = {
  cursor?: number | string;
  size?: number;
};

export async function getExpertReviews(
  userId: number,
  params: GetExpertReviewsParams = {},
): Promise<ExpertReviewsResponse> {
  const query = new URLSearchParams();

  if (params.cursor !== undefined && params.cursor !== null && params.cursor !== '') {
    query.set('cursor', String(params.cursor));
  }
  if (params.size) {
    query.set('size', String(params.size));
  }

  const path = query.toString()
    ? `/bff/experts/${userId}/reviews?${query}`
    : `/bff/experts/${userId}/reviews`;
  const accessToken = readAccessToken();

  return apiFetch<ExpertReviewsResponse>(path, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}
