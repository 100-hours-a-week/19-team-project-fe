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
  context?: { params?: { chatId?: string } | Promise<{ chatId?: string }> },
) {
  try {
    const resolvedParams = context?.params ? await context.params : undefined;
    const rawChatId = resolvedParams?.chatId;
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

    const rawBody = await req.text();
    if (process.env.NODE_ENV !== 'production') {
      console.info('[ChatLastRead BFF] raw body', rawBody);
    }
    let payload: { last_message_id?: number | string } | null = null;
    if (rawBody) {
      try {
        const parsed = JSON.parse(rawBody) as unknown;
        if (typeof parsed === 'string') {
          payload = JSON.parse(parsed) as { last_message_id?: number | string };
        } else {
          payload = parsed as { last_message_id?: number | string };
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== 'production') {
          console.info('[ChatLastRead BFF] parse failed', {
            error: parseError instanceof Error ? parseError.message : parseError,
          });
        }
        const params = new URLSearchParams(rawBody);
        const paramValue = params.get('last_message_id');
        if (paramValue !== null) {
          payload = { last_message_id: paramValue };
        } else {
          const trimmed = rawBody.trim();
          const match =
            trimmed.match(/last_message_id\s*[:=]\s*(\d+)/i) ??
            trimmed.match(/"last_message_id"\s*:\s*"?(\d+)"?/i) ??
            trimmed.match(/lastMessageId\s*[:=]\s*(\d+)/i);
          if (match?.[1]) {
            payload = { last_message_id: match[1] };
          } else {
            const response: ApiResponse<null> = {
              code: 'INVALID_JSON_REQUEST',
              message: '요청 JSON이 올바르지 않습니다.',
              data: null,
            };
            return NextResponse.json(response, { status: 400 });
          }
        }
      }
    }
    const rawLastMessageId = payload?.last_message_id;
    const parsedLastMessageId =
      typeof rawLastMessageId === 'string' ? Number(rawLastMessageId) : rawLastMessageId;
    if (!Number.isFinite(parsedLastMessageId)) {
      const response: ApiResponse<null> = {
        code: 'INVALID_REQUEST',
        message: '요청이 올바르지 않습니다.',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }
    const lastMessageId = parsedLastMessageId as number;
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
      if (process.env.NODE_ENV !== 'production') {
        console.info('[ChatLastRead BFF] upstream error', {
          code: error.code,
          message: error.message,
          data: error.data ?? null,
        });
      }
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
