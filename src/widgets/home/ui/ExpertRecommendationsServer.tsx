import { cookies, headers } from 'next/headers';

import type { ExpertRecommendationsResponse } from '@/entities/experts';
import { apiFetch } from '@/shared/api';

import ExpertRecommendations from './ExpertRecommendations';

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

  const recommendations = await apiFetch<ExpertRecommendationsResponse>(url, {
    method: 'GET',
    cache: 'no-store',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  })
    .then((data) => data.recommendations)
    .catch(() => []);

  return <ExpertRecommendations recommendations={recommendations} />;
}
