import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BusinessError, type ApiResponse, buildApiUrl } from '@/shared/api';

const LOGOUT_PATH = '/api/v1/auth/logout';

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

function clearAuthCookies(response: NextResponse) {
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: new Date(0),
  };
  response.cookies.set('access_token', '', base);
  response.cookies.set('refresh_token', '', base);
  return response;
}

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);
    if (!accessToken) {
      const response: ApiResponse<null> = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'unauthorized',
        data: null,
      };
      return clearAuthCookies(NextResponse.json(response, { status: 401 }));
    }

    const res = await fetch(buildApiUrl(LOGOUT_PATH), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      if (body && typeof body.code === 'string') {
        const response: ApiResponse<unknown> = {
          code: body.code,
          message: body.message ?? 'error',
          data: body.data ?? null,
        };
        return clearAuthCookies(NextResponse.json(response, { status: res.status }));
      }
      const response: ApiResponse<null> = {
        code: 'AUTH_LOGOUT_FAILED',
        message: 'AUTH_LOGOUT_FAILED',
        data: null,
      };
      return clearAuthCookies(NextResponse.json(response, { status: res.status }));
    }

    return clearAuthCookies(
      NextResponse.json(body ?? { code: 'OK', message: 'success', data: {} }),
    );
  } catch (error) {
    if (error instanceof BusinessError) {
      const response: ApiResponse<unknown> = {
        code: error.code,
        message: error.message,
        data: error.data ?? null,
      };
      return clearAuthCookies(NextResponse.json(response));
    }

    console.error('[Logout Error]', error);
    const response: ApiResponse<null> = {
      code: 'AUTH_LOGOUT_FAILED',
      message: 'AUTH_LOGOUT_FAILED',
      data: null,
    };
    return clearAuthCookies(NextResponse.json(response, { status: 500 }));
  }
}
