import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BusinessError, HttpError, type ApiResponse, buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';
import type { UserMe } from '@/features/users';

type AuthErrorCode =
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_INVALID_TOKEN'
  | 'AUTH_UNAUTHORIZED'
  | 'UNAUTHORIZED';

const AUTH_ERROR_CODES = new Set<AuthErrorCode>([
  'AUTH_TOKEN_EXPIRED',
  'AUTH_INVALID_TOKEN',
  'AUTH_UNAUTHORIZED',
  'UNAUTHORIZED',
]);

function isAuthError(error: unknown): boolean {
  if (error instanceof BusinessError) {
    return AUTH_ERROR_CODES.has(error.code as AuthErrorCode);
  }
  if (error instanceof HttpError) {
    return error.status === 401;
  }
  if (error instanceof Error) {
    return error.message === 'UNAUTHORIZED';
  }
  return false;
}

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
        code: 'OK',
        message: 'unauthenticated',
        data: null,
      };
      return NextResponse.json(response, { status: 200 });
    }

    try {
      const data = await apiFetchWithRefresh<UserMe>(
        buildApiUrl('/api/v1/users/me'),
        undefined,
        accessToken,
        true,
      );
      const response: ApiResponse<UserMe> = {
        code: 'OK',
        message: 'ok',
        data,
      };
      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      if (isAuthError(error)) {
        const response: ApiResponse<null> = {
          code: 'OK',
          message: 'unauthenticated',
          data: null,
        };
        return NextResponse.json(response, { status: 200 });
      }
      throw error;
    }
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
