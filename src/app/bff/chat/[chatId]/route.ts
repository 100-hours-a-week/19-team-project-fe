import { NextResponse } from 'next/server';

import { BusinessError, type ApiResponse } from '@/shared/api';
import { closeChat, getChatDetail } from '@/features/chat.server';

type Params = {
  chatId: string;
};

export async function GET(req: Request, context: { params: Params }) {
  try {
    const pathnameParts = new URL(req.url).pathname.split('/').filter(Boolean);
    const fallbackChatId = pathnameParts.length >= 2 ? pathnameParts[pathnameParts.length - 1] : '';
    const params = await context.params;
    const rawChatId = params?.chatId ?? fallbackChatId;
    const chatId = Number(rawChatId);
    if (Number.isNaN(chatId)) {
      const response: ApiResponse<null> = {
        code: 'INVALID_CHAT_ID',
        message: 'INVALID_CHAT_ID',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    const rawToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (authHeader ?? undefined);
    const accessToken = rawToken?.trim() || undefined;
    const data = await getChatDetail({ chatId, accessToken });
    const response: ApiResponse<typeof data> = {
      code: 'OK',
      message: '',
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
        error.code === 'AUTH_UNAUTHORIZED' ||
        error.code === 'AUTH_INVALID_TOKEN' ||
        error.code === 'AUTH_TOKEN_EXPIRED'
          ? 401
          : error.code === 'AUTH_FORBIDDEN' || error.code === 'FORBIDDEN'
            ? 403
            : error.code === 'INVALID_REQUEST'
              ? 400
              : 200;
      return NextResponse.json(response, status === 200 ? undefined : { status });
    }

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      const response: ApiResponse<null> = {
        code: 'UNAUTHORIZED',
        message: 'UNAUTHORIZED',
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    console.error('[Chat Detail Error]', error);
    const response: ApiResponse<null> = {
      code: 'CHAT_DETAIL_FAILED',
      message: 'CHAT_DETAIL_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Params }) {
  try {
    const pathnameParts = new URL(req.url).pathname.split('/').filter(Boolean);
    const fallbackChatId = pathnameParts.length >= 2 ? pathnameParts[pathnameParts.length - 1] : '';
    const params = await context.params;
    const rawChatId = params?.chatId ?? fallbackChatId;
    const chatId = Number(rawChatId);
    if (Number.isNaN(chatId)) {
      const response: ApiResponse<null> = {
        code: 'INVALID_CHAT_ID',
        message: 'INVALID_CHAT_ID',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    const rawToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (authHeader ?? undefined);
    const accessToken = rawToken?.trim() || undefined;
    const data = await closeChat({ chatId, accessToken });
    const response: ApiResponse<typeof data> = {
      code: 'OK',
      message: '',
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
      return NextResponse.json(response);
    }

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      const response: ApiResponse<null> = {
        code: 'UNAUTHORIZED',
        message: 'UNAUTHORIZED',
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    console.error('[Chat Close Error]', error);
    const response: ApiResponse<null> = {
      code: 'CHAT_CLOSE_FAILED',
      message: 'CHAT_CLOSE_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
