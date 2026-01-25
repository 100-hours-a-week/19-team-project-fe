import { NextResponse } from 'next/server';

import { BusinessError, type ApiResponse } from '@/shared/api';
import { createChat, getChatList } from '@/features/chat.server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const status = statusParam === 'CLOSED' ? 'CLOSED' : 'ACTIVE';
    const cursorParam = searchParams.get('cursor');
    const sizeParam = searchParams.get('size');
    const cursor =
      cursorParam !== null && cursorParam !== '' && !Number.isNaN(Number(cursorParam))
        ? Number(cursorParam)
        : undefined;
    const size =
      sizeParam !== null && sizeParam !== '' && !Number.isNaN(Number(sizeParam))
        ? Number(sizeParam)
        : undefined;

    const authHeader = req.headers.get('authorization');
    const rawToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (authHeader ?? undefined);
    const accessToken = rawToken?.trim() || undefined;
    const data = await getChatList({ status, cursor, size, accessToken });
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

    console.error('[Chat List Error]', error);
    const response: ApiResponse<null> = {
      code: 'CHAT_LIST_FAILED',
      message: 'CHAT_LIST_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const authHeader = req.headers.get('authorization');
    const rawToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (authHeader ?? undefined);
    const accessToken = rawToken?.trim() || undefined;
    const data = await createChat(payload, accessToken);
    const response: ApiResponse<typeof data> = {
      code: 'CREATED',
      message: 'create_success',
      data,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof BusinessError) {
      const response: ApiResponse<unknown> = {
        code: error.code,
        message: error.message,
        data: error.data ?? null,
      };

      const status =
        error.code === 'CHAT_ROOM_ALREADY_EXISTS'
          ? 409
          : error.code === 'INVALID_REQUEST'
            ? 400
            : error.code === 'AUTH_UNAUTHORIZED'
              ? 401
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

    console.error('[Create Chat Error]', error);
    const response: ApiResponse<null> = {
      code: 'CHAT_CREATE_FAILED',
      message: 'CHAT_CREATE_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
