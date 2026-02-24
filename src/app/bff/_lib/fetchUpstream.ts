import { withTimeout, RequestTimeoutError } from '@/shared/api/server';
import { trackServerApiRequest } from '@/shared/metrics/serverApiMetricsTracker';

type TimeoutProfile = 'optional' | 'default' | 'critical';

type FetchBffUpstreamOptions = RequestInit & {
  timeoutMs?: number;
  timeoutProfile?: TimeoutProfile;
  bffPath?: string;
};

const TIMEOUT_BY_PROFILE: Record<TimeoutProfile, number> = {
  optional: 2000,
  default: 3500,
  critical: 5000,
};

function resolveTimeoutProfile(
  upstreamPath: string,
  method: string,
  override?: TimeoutProfile,
): TimeoutProfile {
  if (override) return override;
  if (upstreamPath.startsWith('/api/v1/experts/recommendations')) return 'optional';
  if (upstreamPath.startsWith('/api/v1/resumes/tasks')) return 'critical';
  if (upstreamPath.startsWith('/api/v2/reports')) return method === 'GET' ? 'critical' : 'default';
  return 'default';
}

function getTimeoutMs(timeoutMs?: number, timeoutProfile: TimeoutProfile = 'default'): number {
  if (typeof timeoutMs === 'number' && timeoutMs > 0) return timeoutMs;
  return TIMEOUT_BY_PROFILE[timeoutProfile];
}

function getUpstreamPath(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    try {
      return new URL(input).pathname;
    } catch {
      return input;
    }
  }
  if (input instanceof URL) return input.pathname;
  return input.url;
}

function createTimeoutResponse(timeoutMs: number, requestId: string): Response {
  return Response.json(
    {
      code: 'UPSTREAM_TIMEOUT',
      message: 'UPSTREAM_TIMEOUT',
      data: null,
      degraded: true,
      requestId,
      timeoutMs,
    },
    { status: 504 },
  );
}

export async function fetchBffUpstream(
  input: RequestInfo | URL,
  options?: FetchBffUpstreamOptions,
): Promise<Response> {
  const { timeoutMs: timeoutMsOption, timeoutProfile, bffPath, ...init } = options ?? {};
  const method = init.method ?? 'GET';
  const upstreamPath = getUpstreamPath(input);
  const resolvedTimeoutProfile = resolveTimeoutProfile(upstreamPath, method, timeoutProfile);
  const timeoutMs = getTimeoutMs(timeoutMsOption, resolvedTimeoutProfile);
  const startMs = Date.now();
  const requestSignal = init.signal ?? undefined;

  try {
    const res = await withTimeout<Response>((signal) => fetch(input, { ...init, signal }), {
      timeoutMs,
      signal: requestSignal,
    });
    trackServerApiRequest({
      path: bffPath ?? upstreamPath,
      method,
      status: res.status,
      durationMs: Date.now() - startMs,
    });

    if (res.status >= 500) {
      console.error('[BFF_UPSTREAM_HTTP_ERROR]', {
        event: 'bff_upstream_http_error',
        bffPath: bffPath ?? upstreamPath,
        upstreamPath,
        status: res.status,
        method,
        timeoutProfile: resolvedTimeoutProfile,
        timeoutMs,
        durationMs: Date.now() - startMs,
      });
    }

    return res;
  } catch (error) {
    if (error instanceof RequestTimeoutError) {
      const requestId = crypto.randomUUID();
      trackServerApiRequest({
        path: bffPath ?? upstreamPath,
        method,
        status: 504,
        durationMs: Date.now() - startMs,
      });
      console.error('[BFF_UPSTREAM_TIMEOUT]', {
        event: 'bff_upstream_timeout',
        bffPath: bffPath ?? upstreamPath,
        upstreamPath,
        method,
        timeoutProfile: resolvedTimeoutProfile,
        timeoutMs,
        requestId,
      });

      return createTimeoutResponse(timeoutMs, requestId);
    }

    throw error;
  }
}
