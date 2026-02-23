import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { buildApiUrl } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';
import { BusinessError, type ApiResponse } from '@/shared/api';

const FCM_TOKENS_PATH = '/api/v2/notifications/fcm-tokens';

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

type FcmTokenPayload = {
  token: string;
};

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as FcmTokenPayload;
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);

    const data = await apiFetchWithRefresh<{
      fcm_token_id: number;
      token: string;
      created_at: string;
      updated_at: string;
    }>(
      buildApiUrl(FCM_TOKENS_PATH),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      accessToken,
      false,
    );

    const response: ApiResponse<typeof data> = { code: 'OK', message: 'success', data };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BusinessError) {
      const status =
        error.code === 'INVALID_REQUEST' ? 400 : error.code === 'AUTH_UNAUTHORIZED' ? 401 : 400;
      const response: ApiResponse<unknown> = {
        code: error.code,
        message: error.message,
        data: error.data ?? null,
      };
      return NextResponse.json(response, { status });
    }

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      const response: ApiResponse<null> = {
        code: 'AUTH_UNAUTHORIZED',
        message: '인증이 필요합니다.',
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    console.error('[Register FCM Token Error]', error);
    const response: ApiResponse<null> = {
      code: 'FCM_TOKEN_REGISTER_FAILED',
      message: 'FCM_TOKEN_REGISTER_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const payload = (await req.json()) as FcmTokenPayload;
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);

    const data = await apiFetchWithRefresh<{ deleted: boolean }>(
      buildApiUrl(FCM_TOKENS_PATH),
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      accessToken,
      false,
    );

    const response: ApiResponse<typeof data> = { code: 'OK', message: 'success', data };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BusinessError) {
      const status =
        error.code === 'INVALID_REQUEST' ? 400 : error.code === 'AUTH_UNAUTHORIZED' ? 401 : 400;
      const response: ApiResponse<unknown> = {
        code: error.code,
        message: error.message,
        data: error.data ?? null,
      };
      return NextResponse.json(response, { status });
    }

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      const response: ApiResponse<null> = {
        code: 'AUTH_UNAUTHORIZED',
        message: '인증이 필요합니다.',
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    console.error('[Delete FCM Token Error]', error);
    const response: ApiResponse<null> = {
      code: 'FCM_TOKEN_DELETE_FAILED',
      message: 'FCM_TOKEN_DELETE_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
