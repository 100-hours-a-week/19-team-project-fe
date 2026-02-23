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

type NotificationItem = {
  notification_id: number;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

type NotificationListData = {
  notifications: NotificationItem[];
  next_cursor: string | null;
  has_more: boolean;
  unread_count: number;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const size = searchParams.get('size');
    const query = new URLSearchParams();
    if (cursor) query.set('cursor', cursor);
    if (size) query.set('size', size);

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);

    const url = `${buildApiUrl(NOTIFICATIONS_PATH)}${query.size > 0 ? `?${query.toString()}` : ''}`;
    const data = await apiFetchWithRefresh<NotificationListData>(
      url,
      { method: 'GET' },
      accessToken,
      false,
    );
    const response: ApiResponse<NotificationListData> = { code: 'OK', message: 'success', data };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BusinessError) {
      const status = error.code === 'AUTH_UNAUTHORIZED' ? 401 : 400;
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

    console.error('[Get Notifications Error]', error);
    const response: ApiResponse<null> = {
      code: 'NOTIFICATIONS_FETCH_FAILED',
      message: 'NOTIFICATIONS_FETCH_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const payload = await req.json();
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);

    const data = await apiFetchWithRefresh<{ updated_count: number }>(
      buildApiUrl(NOTIFICATIONS_PATH),
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
          : error.code === 'NOTIFICATION_IS_READ_INVALID'
            ? 400
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

    console.error('[Read All Notifications Error]', error);
    const response: ApiResponse<null> = {
      code: 'NOTIFICATIONS_READ_ALL_FAILED',
      message: 'NOTIFICATIONS_READ_ALL_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
