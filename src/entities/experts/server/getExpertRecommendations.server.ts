import 'server-only';

import { headers } from 'next/headers';

import { apiFetch } from '@/shared/api';
import type {
  ExpertRecommendationsResponse,
  GetExpertRecommendationsParams,
} from '../api/getExpertRecommendations';

async function buildBffUrl(path: string): Promise<string> {
  const explicitBase = process.env.NEXT_PUBLIC_APP_URL;
  if (explicitBase) return `${explicitBase}${path}`;

  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');
  if (!host) return `http://localhost:3000${path}`;

  const proto = headerStore.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}${path}`;
}

export async function getExpertRecommendationsServer(
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

  const url = await buildBffUrl(path);

  const data = await apiFetch<ExpertRecommendationsResponse>(url, {
    method: 'GET',
    cache: 'no-store',
    headers: params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : undefined,
  });
  return data;
}
