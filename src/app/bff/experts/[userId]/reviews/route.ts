import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { buildApiUrl, type ApiResponse } from '@/shared/api';
import { fetchBffUpstream } from '@/app/bff/_lib/fetchUpstream';

type Params = {
  userId: string;
};

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

export async function GET(req: Request, context: { params: Params }) {
  try {
    const pathnameParts = new URL(req.url).pathname.split('/').filter(Boolean);
    const fallbackUserId = pathnameParts.length >= 3 ? pathnameParts[pathnameParts.length - 2] : '';
    const params = await context.params;
    const rawUserId = params?.userId ?? fallbackUserId;
    const userId = Number(rawUserId);

    if (Number.isNaN(userId)) {
      const response: ApiResponse<null> = {
        code: 'INVALID_USER_ID',
        message: 'INVALID_USER_ID',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);
    const query = new URL(req.url).search;
    const upstreamUrl = buildApiUrl(`/api/v3/experts/${userId}/reviews${query}`);

    const res = await fetchBffUpstream(upstreamUrl, {
      timeoutMs: 20000,
      method: 'GET',
      bffPath: '/bff/experts/[userId]/reviews',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });

    const body = await res.json().catch(() => null);
    if (body && typeof body === 'object') {
      return NextResponse.json(body, { status: res.status });
    }

    const fallback: ApiResponse<null> = {
      code: res.ok ? 'OK' : 'EXPERT_REVIEWS_FAILED',
      message: res.ok ? 'success' : 'EXPERT_REVIEWS_FAILED',
      data: null,
    };
    return NextResponse.json(fallback, { status: res.status });
  } catch (error) {
    console.error('[Expert Reviews Error]', error);
    const response: ApiResponse<null> = {
      code: 'EXPERT_REVIEWS_FAILED',
      message: 'EXPERT_REVIEWS_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
