import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { buildApiUrl, type ApiResponse } from '@/shared/api';

const EVENTS_SUBSCRIBE_PATH = '/api/v2/events/subscribe';
const encoder = new TextEncoder();

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

function unauthorizedResponse() {
  const response: ApiResponse<null> = {
    code: 'AUTH_UNAUTHORIZED',
    message: '인증이 필요합니다.',
    data: null,
  };
  return NextResponse.json(response, { status: 401 });
}

function createSseErrorEvent(message: string) {
  return encoder.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = getAccessToken(req, cookieStore.get('access_token')?.value);
    if (!accessToken) return unauthorizedResponse();

    const upstreamRes = await fetch(buildApiUrl(EVENTS_SUBSCRIBE_PATH), {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!upstreamRes.ok) {
      const body = await upstreamRes.json().catch(() => null);
      if (body && typeof body.code === 'string') {
        return NextResponse.json(body, { status: upstreamRes.status });
      }

      const response: ApiResponse<null> = {
        code: 'SSE_CONNECT_FAILED',
        message: 'SSE_CONNECT_FAILED',
        data: null,
      };
      return NextResponse.json(response, { status: upstreamRes.status || 500 });
    }

    if (!upstreamRes.body) {
      const response: ApiResponse<null> = {
        code: 'SSE_STREAM_EMPTY',
        message: 'SSE_STREAM_EMPTY',
        data: null,
      };
      return NextResponse.json(response, { status: 502 });
    }

    let upstreamReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    const relayStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        upstreamReader = upstreamRes.body?.getReader() ?? null;
        if (!upstreamReader) {
          controller.enqueue(createSseErrorEvent('SSE_STREAM_EMPTY'));
          controller.close();
          return;
        }

        try {
          while (true) {
            const { value, done } = await upstreamReader.read();
            if (done) break;
            if (value) controller.enqueue(value);
          }
        } catch (error) {
          console.warn('[Events SSE Stream Interrupted]', error);
          controller.enqueue(createSseErrorEvent('STREAM_INTERRUPTED'));
        } finally {
          controller.close();
          try {
            await upstreamReader.cancel();
          } catch {
            // no-op
          }
          upstreamReader = null;
        }
      },
      async cancel(reason) {
        if (!upstreamReader) return;
        try {
          await upstreamReader.cancel(reason);
        } catch {
          // no-op
        }
      },
    });

    return new Response(relayStream, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Events SSE Subscribe Error]', error);
    const response: ApiResponse<null> = {
      code: 'SSE_CONNECT_FAILED',
      message: 'SSE_CONNECT_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
