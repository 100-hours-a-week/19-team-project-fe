import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BusinessError, type ApiResponse } from '@/shared/api';
import { createChatRequest, getChatRequestList } from '@/features/chat.server';

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const directionParam = searchParams.get('direction');
    const direction = directionParam === 'sent' ? 'sent' : 'received';
    const statusParam = searchParams.get('status') ?? undefined;
    const status =
      statusParam === 'PENDING' || statusParam === 'ACCEPTED' || statusParam === 'REJECTED'
        ? statusParam
        : undefined;
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

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);
    const data = await getChatRequestList({
      direction,
      status,
      cursor,
      size,
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
        error.code === 'INVALID_REQUEST'
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

    console.error('[Chat Request List Error]', error);
    const response: ApiResponse<null> = {
      code: 'CHAT_REQUEST_LIST_FAILED',
      message: 'CHAT_REQUEST_LIST_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);
    const data = await createChatRequest(payload, accessToken, false);
    const response: ApiResponse<typeof data> = {
      code: 'CREATED',
      message: 'created',
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
        error.code === 'CHAT_REQUEST_ALREADY_EXISTS'
          ? 409
          : error.code === 'INVALID_REQUEST'
            ? 400
            : error.code === 'AUTH_UNAUTHORIZED' || error.code === 'AUTH_INVALID_TOKEN'
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

    console.error('[Chat Request Create Error]', error);
    const response: ApiResponse<null> = {
      code: 'CHAT_REQUEST_CREATE_FAILED',
      message: 'CHAT_REQUEST_CREATE_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
