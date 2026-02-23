import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { buildApiUrl, BusinessError, type ApiResponse } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

const NOTIFICATIONS_PATH = '/api/v2/notifications';

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

type Params = {
  params: Promise<{
    notificationId: string;
  }>;
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { notificationId } = await params;
    const payload = await req.json();
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);

    const data = await apiFetchWithRefresh<{
      notification_id: number;
      is_read: boolean;
      read_at: string | null;
    }>(
      buildApiUrl(`${NOTIFICATIONS_PATH}/${notificationId}`),
      {
        method: 'PATCH',
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
        error.code === 'AUTH_UNAUTHORIZED'
          ? 401
          : error.code === 'NOTIFICATION_NOT_FOUND'
            ? 404
            : error.code === 'NOTIFICATION_ALREADY_READ'
              ? 409
              : 400;
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

    console.error('[Read Notification Error]', error);
    const response: ApiResponse<null> = {
      code: 'NOTIFICATION_READ_FAILED',
      message: 'NOTIFICATION_READ_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
