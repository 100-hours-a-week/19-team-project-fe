import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BusinessError, type ApiResponse, buildApiUrl } from '@/shared/api';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;

    const authHeader = req.headers.get('authorization');
    const rawToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (authHeader ?? undefined);

    const accessToken = rawToken?.trim() || cookieToken?.trim() || undefined;
    if (!accessToken) {
      const response: ApiResponse<null> = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'unauthorized',
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    const res = await fetch(buildApiUrl('/api/v1/users/me'), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
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

    const body = await res.json();
    return NextResponse.json(body);
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

    const authHeader = req.headers.get('authorization');
    const rawToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (authHeader ?? undefined);

    const accessToken = rawToken?.trim() || cookieToken?.trim() || undefined;
    if (!accessToken) {
      const response: ApiResponse<null> = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'unauthorized',
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    const payload = await req.json();
    const res = await fetch(buildApiUrl('/api/v1/users/me'), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      if (body && typeof body.code === 'string') {
        const response: ApiResponse<unknown> = {
          code: body.code,
          message: body.message ?? 'error',
          data: body.data ?? null,
        };
        return NextResponse.json(response, { status: res.status });
      }
      const response: ApiResponse<null> = {
        code: 'USER_ME_UPDATE_FAILED',
        message: 'USER_ME_UPDATE_FAILED',
        data: null,
      };
      return NextResponse.json(response, { status: res.status });
    }

    const body = await res.json();
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof BusinessError) {
      const response: ApiResponse<unknown> = {
        code: error.code,
        message: error.message,
        data: error.data ?? null,
      };
      return NextResponse.json(response);
    }

    console.error('[User Me Update Error]', error);
    const response: ApiResponse<null> = {
      code: 'USER_ME_UPDATE_FAILED',
      message: 'USER_ME_UPDATE_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
