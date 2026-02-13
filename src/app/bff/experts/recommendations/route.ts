import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BusinessError, type ApiResponse, buildApiUrl } from '@/shared/api';

const RECOMMENDATIONS_PATH = '/api/v1/experts/recommendations';

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);

    const url = new URL(req.url);
    const query = url.search ? url.search : '';

    const res = await fetch(buildApiUrl(`${RECOMMENDATIONS_PATH}${query}`), {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
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
