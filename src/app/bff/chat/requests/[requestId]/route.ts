import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BusinessError, type ApiResponse } from '@/shared/api';
import { updateChatRequestStatus } from '@/features/chat.server';

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

type RouteContext = { params: Promise<{ requestId: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { requestId } = await context.params;
    const parsedRequestId = Number(requestId);
    if (!Number.isFinite(parsedRequestId)) {
      const response: ApiResponse<null> = {
        code: 'INVALID_REQUEST',
        message: '요청이 올바르지 않습니다.',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const payload = (await req.json()) as { status?: string };
    const status = payload?.status;
    if (status !== 'ACCEPTED' && status !== 'REJECTED') {
      const response: ApiResponse<null> = {
        code: 'CHAT_STATUS_INVALID',
        message: '상태는 ACCEPTED 또는 REJECTED여야 합니다.',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);
    const data = await updateChatRequestStatus({
      requestId: parsedRequestId,
      status,
      accessToken,
    });

    const response: ApiResponse<typeof data> = {
      code: 'OK',
      message: 'success',
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BusinessError) {
      const response: ApiResponse<unknown> = {
        code: error.code,
        message: error.message,
        data: error.data ?? null,
      };

      const status =
        error.code === 'CHAT_STATUS_INVALID'
          ? 400
          : error.code === 'AUTH_UNAUTHORIZED' || error.code === 'AUTH_INVALID_TOKEN'
            ? 401
            : error.code === 'FORBIDDEN'
              ? 403
              : error.code === 'CHAT_NOT_FOUND'
                ? 404
                : 400;

      return NextResponse.json(response, { status });
    }

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      const response: ApiResponse<null> = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'unauthorized',
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    console.error('[Chat Request Update Error]', error);
    const response: ApiResponse<null> = {
      code: 'CHAT_REQUEST_UPDATE_FAILED',
      message: 'CHAT_REQUEST_UPDATE_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
