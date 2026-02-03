import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BusinessError, type ApiResponse, buildApiUrl } from '@/shared/api';

const USER_ME_PATH = '/api/v1/users/me';

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

    const res = await fetch(buildApiUrl(USER_ME_PATH), {
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
        return NextResponse.json(response, { status: res.status });
      }
      const response: ApiResponse<null> = {
        code: 'USER_ME_FAILED',
        message: 'USER_ME_FAILED',
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

    console.error('[User Me Error]', error);
    const response: ApiResponse<null> = {
      code: 'USER_ME_FAILED',
      message: 'USER_ME_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
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

    const res = await fetch(buildApiUrl(USER_ME_PATH), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
        code: 'USER_UPDATE_FAILED',
        message: 'USER_UPDATE_FAILED',
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

    console.error('[User Update Error]', error);
    const response: ApiResponse<null> = {
      code: 'USER_UPDATE_FAILED',
      message: 'USER_UPDATE_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
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

    const res = await fetch(buildApiUrl(USER_ME_PATH), {
      method: 'DELETE',
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
        code: 'USER_DELETE_FAILED',
        message: 'USER_DELETE_FAILED',
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

    console.error('[User Delete Error]', error);
    const response: ApiResponse<null> = {
      code: 'USER_DELETE_FAILED',
      message: 'USER_DELETE_FAILED',
      data: null,
    };
    return clearAuthCookies(NextResponse.json(response, { status: 500 }));
  }
}
