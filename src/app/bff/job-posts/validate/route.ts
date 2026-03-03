import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { type ApiResponse, buildApiUrl } from '@/shared/api';
import { fetchBffUpstream } from '@/app/bff/_lib/fetchUpstream';

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);

    if (!accessToken) {
      const response: ApiResponse<null> = {
        code: 'AUTH_UNAUTHORIZED',
        message: '인증이 필요합니다.',
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    const payload = (await req.json().catch(() => null)) as { url?: unknown } | null;
    const url = typeof payload?.url === 'string' ? payload.url.trim() : '';
    if (!url) {
      const response: ApiResponse<null> = {
        code: 'INVALID_REQUEST',
        message: '요청이 올바르지 않습니다.',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const upstreamRes = await fetchBffUpstream(buildApiUrl('/api/v2/job-posts/validate'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      bffPath: '/bff/job-posts/validate',
    });

    const body = await upstreamRes.json().catch(() => null);
    if (!body) {
      const response: ApiResponse<null> = {
        code: 'JOB_POST_VALIDATE_FAILED',
        message: 'JOB_POST_VALIDATE_FAILED',
        data: null,
      };
      return NextResponse.json(response, { status: upstreamRes.status || 500 });
    }

    return NextResponse.json(body, { status: upstreamRes.status });
  } catch (error) {
    console.error('[Job Post Validate Error]', error);
    const response: ApiResponse<null> = {
      code: 'JOB_POST_VALIDATE_FAILED',
      message: 'JOB_POST_VALIDATE_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
