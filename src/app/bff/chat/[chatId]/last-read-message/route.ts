import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BusinessError, type ApiResponse } from '@/shared/api';
import { updateChatLastRead } from '@/features/chat.server';

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

export async function PATCH(
  req: Request,
  context?: { params?: { chatId?: string } },
) {
  try {
    const rawChatId = context?.params?.chatId;
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const fallbackChatId = pathSegments.at(-2);
    const chatId = Number(rawChatId ?? fallbackChatId);
    if (Number.isNaN(chatId)) {
      const response: ApiResponse<null> = {
        code: 'INVALID_REQUEST',
        message: '요청이 올바르지 않습니다.',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const payload = await req.json();
    const rawLastMessageId = payload?.last_message_id;
    const lastMessageId =
      typeof rawLastMessageId === 'string' ? Number(rawLastMessageId) : rawLastMessageId;
    if (!Number.isFinite(lastMessageId)) {
      const response: ApiResponse<null> = {
        code: 'INVALID_REQUEST',
        message: '요청이 올바르지 않습니다.',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);

    const data = await updateChatLastRead(
      { chatId, last_message_id: lastMessageId },
      accessToken,
      false,
    );
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

    console.error('[Chat Last Read Error]', error);
    const response: ApiResponse<null> = {
      code: 'CHAT_LAST_READ_FAILED',
      message: 'CHAT_LAST_READ_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
