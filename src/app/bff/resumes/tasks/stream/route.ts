import { cookies } from 'next/headers';

import { buildApiUrl } from '@/shared/api';
import { fetchBffUpstream } from '@/app/bff/_lib/fetchUpstream';

const POLL_INTERVAL_MS = 2000;
const KEEPALIVE_MS = 15000;

type StreamStatusPayload = {
  taskId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: unknown;
  reason?: string;
};

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

function parseTaskIds(req: Request): string[] {
  const url = new URL(req.url);
  const repeated = url.searchParams.getAll('taskId');
  const csv = (url.searchParams.get('taskIds') ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set([...repeated, ...csv].map((item) => item.trim()).filter(Boolean)));
}

export async function GET(req: Request) {
  const taskIds = parseTaskIds(req);
  if (taskIds.length === 0) {
    return Response.json(
      {
        code: 'INVALID_TASK_IDS',
        message: 'taskId query is required',
        data: null,
      },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('access_token')?.value;
  const accessToken = getAccessToken(req, cookieToken);
  if (!accessToken) {
    return Response.json(
      {
        code: 'AUTH_UNAUTHORIZED',
        message: 'unauthorized',
        data: null,
      },
      { status: 401 },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const active = new Set(taskIds);
      let closed = false;
      let polling = false;
      let pollTimer: ReturnType<typeof setInterval> | null = null;
      let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

      const writeEvent = (event: string, payload: unknown) => {
        if (closed) return;
        const chunk = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      const close = () => {
        if (closed) return;
        closed = true;
        if (pollTimer) clearInterval(pollTimer);
        if (keepAliveTimer) clearInterval(keepAliveTimer);
        try {
          controller.close();
        } catch {
          // stream already closed
        }
      };

      const poll = async () => {
        if (closed || polling) return;
        polling = true;
        try {
          for (const taskId of Array.from(active)) {
            const upstream = await fetchBffUpstream(
              buildApiUrl(`/api/v2/resumes/tasks/${encodeURIComponent(taskId)}`),
              {
                headers: { Authorization: `Bearer ${accessToken}` },
                timeoutProfile: 'critical',
                bffPath: '/bff/resumes/tasks/stream',
              },
            );

            if (!upstream.ok) {
              const body = await upstream.json().catch(() => null);
              const code = body && typeof body.code === 'string' ? body.code : null;

              if (code === 'TASK_NOT_FOUND' || upstream.status === 404) {
                const payload: StreamStatusPayload = {
                  taskId,
                  status: 'FAILED',
                  reason: 'TASK_NOT_FOUND',
                };
                writeEvent('status', payload);
                active.delete(taskId);
                continue;
              }

              const payload: StreamStatusPayload = {
                taskId,
                status: 'PROCESSING',
                reason: code ?? `HTTP_${upstream.status}`,
              };
              writeEvent('status', payload);
              continue;
            }

            const body = await upstream.json().catch(() => null);
            const data =
              body && typeof body === 'object' && 'data' in body
                ? (body as { data?: { status?: string; result?: unknown } }).data
                : null;
            const status =
              data?.status === 'COMPLETED' || data?.status === 'FAILED' ? data.status : 'PROCESSING';

            const payload: StreamStatusPayload = {
              taskId,
              status,
              result: status === 'COMPLETED' ? data?.result : undefined,
            };
            writeEvent('status', payload);

            if (status === 'COMPLETED' || status === 'FAILED') {
              active.delete(taskId);
            }
          }

          if (active.size === 0) {
            writeEvent('done', { done: true });
            close();
          }
        } finally {
          polling = false;
        }
      };

      writeEvent('ready', { taskIds });
      void poll();

      pollTimer = setInterval(() => {
        void poll();
      }, POLL_INTERVAL_MS);

      keepAliveTimer = setInterval(() => {
        writeEvent('ping', { ts: Date.now() });
      }, KEEPALIVE_MS);

      req.signal.addEventListener('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
