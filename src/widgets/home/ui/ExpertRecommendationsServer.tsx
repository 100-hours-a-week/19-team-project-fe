import { cookies, headers } from 'next/headers';

import type { ExpertRecommendationsResponse } from '@/entities/experts';
import { apiFetch } from '@/shared/api';

import ExpertRecommendations from './ExpertRecommendations';

const FALLBACK_DATA: ExpertRecommendationsResponse = {
  user_id: 0,
  recommendations: [],
  total_count: 0,
  evaluation: {},
};

async function buildBffUrl(path: string): Promise<string> {
  const explicitBase = process.env.NEXT_PUBLIC_APP_URL;
  if (explicitBase) return `${explicitBase}${path}`;

  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');
  if (!host) return `http://localhost:3000${path}`;

  const proto = headerStore.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}${path}`;
}

export default async function ExpertRecommendationsServer() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const query = new URLSearchParams({ top_k: '12' });
  const url = await buildBffUrl(`/bff/experts/recommendations?${query.toString()}`);
  let data = FALLBACK_DATA;
  let degraded = false;

  try {
    data = await apiFetch<ExpertRecommendationsResponse>(url, {
      method: 'GET',
      cache: 'no-store',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
  } catch (error) {
    degraded = true;
    console.error('[SSR_EXPERT_RECOMMENDATIONS_FALLBACK]', {
      event: 'ssr_expert_recommendations_fallback',
      degraded,
      reason: error instanceof Error ? error.message : 'unknown',
      path: '/bff/experts/recommendations',
    });
  }

  return <ExpertRecommendations recommendations={data.recommendations} degraded={degraded} />;
}
