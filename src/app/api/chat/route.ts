import { NextResponse } from 'next/server';

import { BusinessError, type ApiResponse } from '@/shared/api';
import { getChatList } from '@/features/chat.server';

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

    const data = await getChatList({ status, cursor, size });
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
