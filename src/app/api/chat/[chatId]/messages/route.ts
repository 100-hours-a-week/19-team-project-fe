import { NextResponse } from 'next/server';

import { BusinessError, type ApiResponse } from '@/shared/api';
import { getChatMessages } from '@/features/chat.server';

type Params = {
  chatId: string;
};

export async function GET(req: Request, context: { params: Params }) {
  try {
    const chatId = Number(context.params.chatId);
    if (Number.isNaN(chatId)) {
      const response: ApiResponse<null> = {
        code: 'INVALID_CHAT_ID',
        message: 'INVALID_CHAT_ID',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
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

    const data = await getChatMessages({ chatId, cursor, size });
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

    console.error('[Chat Messages Error]', error);
    const response: ApiResponse<null> = {
      code: 'CHAT_MESSAGES_FAILED',
      message: 'CHAT_MESSAGES_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
