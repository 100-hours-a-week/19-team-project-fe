import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { type ApiResponse, buildApiUrl } from '@/shared/api';

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

export async function GET(req: Request) {
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

    const upstreamRes = await fetch(buildApiUrl('/api/v2/reports'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const body = await upstreamRes.json().catch(() => null);
    if (!body) {
      const response: ApiResponse<null> = {
        code: 'REPORT_LIST_FAILED',
        message: 'REPORT_LIST_FAILED',
        data: null,
      };
      return NextResponse.json(response, { status: upstreamRes.status || 500 });
    }

    return NextResponse.json(body, { status: upstreamRes.status });
  } catch (error) {
    console.error('[Report List Error]', error);
    const response: ApiResponse<null> = {
      code: 'REPORT_LIST_FAILED',
      message: 'REPORT_LIST_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
