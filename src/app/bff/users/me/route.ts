import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BusinessError, HttpError, type ApiResponse, buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const USER_ME_PATH = '/api/v1/users/me';
const cookieDomain = process.env.NODE_ENV === 'production' ? '.re-fit.kr' : undefined;

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
    domain: cookieDomain,
  };
  response.cookies.set('access_token', '', base);
  response.cookies.set('refresh_token', '', base);
  return response;
}

function isAuthError(error: unknown): boolean {
  return (
    (error instanceof BusinessError &&
      ['AUTH_UNAUTHORIZED', 'AUTH_INVALID_TOKEN', 'AUTH_TOKEN_EXPIRED', 'UNAUTHORIZED'].includes(
        error.code,
      )) ||
    (error instanceof HttpError && (error.status === 401 || error.status === 403)) ||
    (error instanceof Error && error.message === 'UNAUTHORIZED')
  );
}

function toErrorResponse(error: unknown, fallbackCode: string): NextResponse {
  if (error instanceof BusinessError) {
    const status = isAuthError(error) ? 401 : 400;
    const response: ApiResponse<unknown> = {
      code: error.code,
      message: error.message,
      data: error.data ?? null,
    };
    const json = NextResponse.json(response, { status });
    return status === 401 ? clearAuthCookies(json) : json;
  }

  if (error instanceof HttpError) {
    const status = error.status;
    const mappedCode = status === 401 || status === 403 ? 'AUTH_UNAUTHORIZED' : fallbackCode;
    const response: ApiResponse<null> = {
      code: mappedCode,
      message: mappedCode,
      data: null,
    };
    const json = NextResponse.json(response, { status });
    return mappedCode === 'AUTH_UNAUTHORIZED' ? clearAuthCookies(json) : json;
  }

  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    const response: ApiResponse<null> = {
      code: 'AUTH_UNAUTHORIZED',
      message: 'unauthorized',
      data: null,
    };
    return clearAuthCookies(NextResponse.json(response, { status: 401 }));
  }

  console.error('[User Me Error]', error);
  const response: ApiResponse<null> = {
    code: fallbackCode,
    message: fallbackCode,
    data: null,
  };
  return NextResponse.json(response, { status: 500 });
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
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
      return NextResponse.json(response, { status: 401 });
    }

    const data = await apiFetchWithRefresh<unknown>(
      buildApiUrl(USER_ME_PATH),
      { method: 'GET' },
      accessToken,
    );

    return NextResponse.json({ code: 'OK', message: 'success', data });
  } catch (error) {
    return toErrorResponse(error, 'USER_ME_FAILED');
  }
}

export async function PATCH(req: Request) {
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
      return NextResponse.json(response, { status: 401 });
    }

    const payload = await req.json().catch(() => null);
    if (!payload) {
      const response: ApiResponse<null> = {
        code: 'INVALID_REQUEST',
        message: 'invalid request body',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const data = await apiFetchWithRefresh<unknown>(
      buildApiUrl(USER_ME_PATH),
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      accessToken,
    );

    return NextResponse.json({ code: 'OK', message: 'success', data });
  } catch (error) {
    return toErrorResponse(error, 'USER_UPDATE_FAILED');
  }
}

export async function DELETE(req: Request) {
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

    const data = await apiFetchWithRefresh<unknown>(
      buildApiUrl(USER_ME_PATH),
      { method: 'DELETE' },
      accessToken,
    );

    return clearAuthCookies(NextResponse.json({ code: 'OK', message: 'success', data }));
  } catch (error) {
    const response = toErrorResponse(error, 'USER_DELETE_FAILED');
    return clearAuthCookies(response);
  }
}
