import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BusinessError, type ApiResponse, buildApiUrl } from '@/shared/api';
import { fetchBffUpstream } from '@/app/bff/_lib/fetchUpstream';

const RECOMMENDATIONS_PATH = '/api/v1/experts/recommendations';
const RECOMMENDATIONS_CACHE_TTL_MS = 30_000;
const RECOMMENDATIONS_STALE_IF_ERROR_MS = 5 * 60_000;
const MAX_CACHE_ENTRIES = 500;

type CachedRecommendation = {
  cachedAt: number;
  body: unknown;
};

const recommendationsCache = new Map<string, CachedRecommendation>();

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

function buildCacheKey(accessToken: string | undefined, query: string) {
  return `${accessToken ?? 'guest'}::${query || 'top_k=12'}`;
}

function getCachedRecommendation(
  cacheKey: string,
  maxAgeMs: number,
): { hit: boolean; body: unknown | null } {
  const cached = recommendationsCache.get(cacheKey);
  if (!cached) return { hit: false, body: null };
  if (Date.now() - cached.cachedAt > maxAgeMs) return { hit: false, body: null };
  return { hit: true, body: cached.body };
}

function setCachedRecommendation(cacheKey: string, body: unknown) {
  if (recommendationsCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = recommendationsCache.keys().next().value;
    if (typeof firstKey === 'string') recommendationsCache.delete(firstKey);
  }
  recommendationsCache.set(cacheKey, { cachedAt: Date.now(), body });
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);

    const url = new URL(req.url);
    const query = url.search ? url.search : '';
    const cacheKey = buildCacheKey(accessToken, query);
    const freshCache = getCachedRecommendation(cacheKey, RECOMMENDATIONS_CACHE_TTL_MS);
    if (freshCache.hit) {
      return NextResponse.json(freshCache.body, {
        headers: { 'x-recommendations-cache': 'HIT' },
      });
    }

    const res = await fetchBffUpstream(buildApiUrl(`${RECOMMENDATIONS_PATH}${query}`), {
      timeoutMs: 20000,
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const staleCache = getCachedRecommendation(cacheKey, RECOMMENDATIONS_STALE_IF_ERROR_MS);
      if (staleCache.hit) {
        return NextResponse.json(staleCache.body, {
          headers: { 'x-recommendations-cache': 'STALE_FALLBACK' },
        });
      }
      if (body && typeof body.code === 'string') {
        const response: ApiResponse<unknown> = {
          code: body.code,
          message: body.message ?? 'error',
          data: body.data ?? null,
        };
        return NextResponse.json(response, { status: res.status });
      }
      const response: ApiResponse<null> = {
        code: 'EXPERT_RECOMMENDATIONS_FAILED',
        message: 'EXPERT_RECOMMENDATIONS_FAILED',
        data: null,
      };
      return NextResponse.json(response, { status: res.status });
    }

    setCachedRecommendation(cacheKey, body ?? { code: 'OK', message: 'success', data: null });
    return NextResponse.json(body ?? { code: 'OK', message: 'success', data: null });
  } catch (error) {
    if (error instanceof BusinessError) {
      const response: ApiResponse<unknown> = {
        code: error.code,
        message: error.message,
        data: error.data ?? null,
      };
      return NextResponse.json(response);
    }

    console.error('[Expert Recommendations Error]', error);
    const response: ApiResponse<null> = {
      code: 'EXPERT_RECOMMENDATIONS_FAILED',
      message: 'EXPERT_RECOMMENDATIONS_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
