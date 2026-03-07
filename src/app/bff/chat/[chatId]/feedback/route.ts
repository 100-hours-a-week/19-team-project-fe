import { after } from 'next/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { createChatFeedback, requestReportCreate } from '@/features/chat.server';
import { BusinessError, type ApiResponse } from '@/shared/api';
import { invalidateChatCache, invalidateReportListCache } from '@/shared/lib/cache';
import type { ChatFeedbackRequest } from '@/entities/chat';

const CHAT_FEEDBACK_BFF_TIMEOUT_MS = 30000;

type Params = {
  chatId: string;
};

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

function isTimeoutError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'AbortError' || error.name === 'TimeoutError';
  }
  if (error instanceof Error) {
    return error.name === 'AbortError' || error.name === 'TimeoutError';
  }
  return false;
}

export async function POST(req: Request, context: { params: Params }) {
  try {
    const pathnameParts = new URL(req.url).pathname.split('/').filter(Boolean);
    const fallbackChatId = pathnameParts.length >= 3 ? pathnameParts[pathnameParts.length - 2] : '';
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

    const payload = (await req.json()) as ChatFeedbackRequest;

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);

    const data = await createChatFeedback({ chatId, payload, accessToken });
    invalidateChatCache(chatId);
    after(async () => {
      try {
        await requestReportCreate({ chatId, accessToken });
        invalidateReportListCache();
      } catch (backgroundError) {
        console.error('[Report Create Async Error]', {
          chatId,
          error:
            backgroundError instanceof Error ? backgroundError.message : 'unknown_background_error',
        });
      }
    });

    const response: ApiResponse<typeof data> = {
      code: 'CREATED',
      message: 'created',
      data,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (isTimeoutError(error)) {
      const requestId = crypto.randomUUID();
      console.error('[BFF_UPSTREAM_TIMEOUT]', {
        event: 'bff_upstream_timeout',
        bffPath: '/bff/chat/[chatId]/feedback',
        upstreamPath: '/api/v2/chats/{chatId}/feedback',
        method: 'POST',
        timeoutMs: CHAT_FEEDBACK_BFF_TIMEOUT_MS,
        requestId,
      });

      const response: ApiResponse<null> = {
        code: 'UPSTREAM_TIMEOUT',
        message: 'UPSTREAM_TIMEOUT',
        data: null,
      };
      return NextResponse.json(
        { ...response, degraded: true, requestId, timeoutMs: CHAT_FEEDBACK_BFF_TIMEOUT_MS },
        { status: 504 },
      );
    }

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

    console.error('[Chat Feedback Create Error]', error);
    const response: ApiResponse<null> = {
      code: 'CHAT_FEEDBACK_CREATE_FAILED',
      message: 'CHAT_FEEDBACK_CREATE_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
