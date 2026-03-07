import { cookies } from 'next/headers';

import type { ExpertRecommendationsResponse } from '@/entities/experts';
import { apiFetch, buildApiUrl } from '@/shared/api';
import { cacheTags } from '@/shared/lib/cache/tags';

import ExpertRecommendations from './ExpertRecommendations';

const RECOMMENDATIONS_CACHE_TTL_MS = 30_000;
const RECOMMENDATIONS_STALE_IF_ERROR_MS = 5 * 60_000;
const GUEST_RECOMMENDATIONS_REVALIDATE_SECONDS = 60;
const MAX_CACHE_ENTRIES = 500;

const FALLBACK_DATA: ExpertRecommendationsResponse = {
  user_id: 0,
  recommendations: [],
  total_count: 0,
  evaluation: {},
};

type CachedRecommendation = {
  cachedAt: number;
  body: ExpertRecommendationsResponse;
};

const recommendationsCache = new Map<string, CachedRecommendation>();

function nowMs() {
  return performance.now();
}

function buildCacheKey(accessToken: string | undefined, query: string) {
  return `${accessToken ?? 'guest'}::${query || 'top_k=12'}`;
}

function getCachedRecommendation(
  cacheKey: string,
  maxAgeMs: number,
): { hit: boolean; body: ExpertRecommendationsResponse | null } {
  const cached = recommendationsCache.get(cacheKey);
  if (!cached) return { hit: false, body: null };
  if (Date.now() - cached.cachedAt > maxAgeMs) return { hit: false, body: null };
  return { hit: true, body: cached.body };
}

function setCachedRecommendation(cacheKey: string, body: ExpertRecommendationsResponse) {
  if (recommendationsCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = recommendationsCache.keys().next().value;
    if (typeof firstKey === 'string') recommendationsCache.delete(firstKey);
  }
  recommendationsCache.set(cacheKey, { cachedAt: Date.now(), body });
}

export default async function ExpertRecommendationsServer() {
  const startMs = nowMs();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const hasAuth = Boolean(accessToken);
  const query = new URLSearchParams({ top_k: '12' });
  const queryString = query.toString();
  const cacheKey = buildCacheKey(accessToken, queryString);
  const freshCache = getCachedRecommendation(cacheKey, RECOMMENDATIONS_CACHE_TTL_MS);
  if (freshCache.hit && freshCache.body) {
    console.info('[SSR_EXPERT_RECOMMENDATIONS]', {
      event: 'ssr_expert_recommendations',
      cache: 'HIT',
      hasAuth,
      query: queryString,
      count: freshCache.body.recommendations.length,
      durationMs: nowMs() - startMs,
      path: '/api/v1/experts/recommendations',
    });
    return <ExpertRecommendations recommendations={freshCache.body.recommendations} />;
  }

  const url = buildApiUrl(`/api/v1/experts/recommendations?${queryString}`);
  let data = FALLBACK_DATA;
  let degraded = false;

  try {
    const upstreamStartMs = nowMs();
    data = await apiFetch<ExpertRecommendationsResponse>(
      url,
      accessToken
        ? {
            method: 'GET',
            cache: 'no-store',
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        : {
            method: 'GET',
            next: {
              revalidate: GUEST_RECOMMENDATIONS_REVALIDATE_SECONDS,
              tags: [cacheTags.homeGuestRecommendations],
            },
          },
    );
    setCachedRecommendation(cacheKey, data);
    console.info('[SSR_EXPERT_RECOMMENDATIONS]', {
      event: 'ssr_expert_recommendations',
      cache: 'MISS_FETCHED',
      hasAuth,
      query: queryString,
      count: data.recommendations.length,
      upstreamDurationMs: nowMs() - upstreamStartMs,
      durationMs: nowMs() - startMs,
      path: '/api/v1/experts/recommendations',
    });
  } catch (error) {
    const staleCache = getCachedRecommendation(cacheKey, RECOMMENDATIONS_STALE_IF_ERROR_MS);
    if (staleCache.hit && staleCache.body) {
      data = staleCache.body;
      degraded = true;
      console.warn('[SSR_EXPERT_RECOMMENDATIONS]', {
        event: 'ssr_expert_recommendations',
        cache: 'STALE_FALLBACK',
        hasAuth,
        query: queryString,
        count: data.recommendations.length,
        durationMs: nowMs() - startMs,
        path: '/api/v1/experts/recommendations',
      });
    } else {
      degraded = true;
      console.warn('[SSR_EXPERT_RECOMMENDATIONS]', {
        event: 'ssr_expert_recommendations',
        cache: 'MISS_ERROR_NO_STALE',
        hasAuth,
        query: queryString,
        durationMs: nowMs() - startMs,
        path: '/api/v1/experts/recommendations',
      });
    }

    console.error('[SSR_EXPERT_RECOMMENDATIONS_FALLBACK]', {
      event: 'ssr_expert_recommendations_fallback',
      degraded,
      reason: error instanceof Error ? error.message : 'unknown',
      path: '/api/v1/experts/recommendations',
    });
  }

  return <ExpertRecommendations recommendations={data.recommendations} />;
}
