import { NextResponse } from 'next/server';

import { BusinessError, type ApiResponse } from '@/shared/api';
import { markChatRead } from '@/features/chat.server';

export async function PATCH(req: Request) {
  try {
    const payload = await req.json();
    const authHeader = req.headers.get('authorization');
    const rawToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (authHeader ?? undefined);
    const accessToken = rawToken?.trim() || undefined;

    const data = await markChatRead(payload, accessToken);
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
        error.code === 'INVALID_REQUEST'
          ? 400
          : error.code === 'AUTH_UNAUTHORIZED'
            ? 401
            : error.code === 'FORBIDDEN'
              ? 403
              : error.code === 'MESSAGE_NOT_FOUND'
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

    console.error('[Chat Read Error]', error);
    const response: ApiResponse<null> = {
      code: 'CHAT_READ_FAILED',
      message: 'CHAT_READ_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
