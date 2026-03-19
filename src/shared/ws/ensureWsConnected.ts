import { StompConnectError, stompManager } from './manager';
import { readAccessToken } from '@/shared/api';

let refreshPromise: Promise<boolean> | null = null;

function isLikelyAuthConnectFailure(error: unknown): boolean {
  const AUTH_FAILURE_PATTERN = /401|403|unauthorized|forbidden|auth/i;

  if (error instanceof StompConnectError) {
    if (error.kind !== 'stomp') return false;
    const joined = [
      error.message,
      error.body ?? '',
      error.headers ? JSON.stringify(error.headers) : '',
    ].join(' ');
    return AUTH_FAILURE_PATTERN.test(joined);
  }

  if (error instanceof Error) {
    return AUTH_FAILURE_PATTERN.test(error.message);
  }

  return false;
}

async function refreshTokensOnce(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { refreshAuthTokens } = await import('@/shared/api');
      return await refreshAuthTokens().catch(() => false);
    } catch {
      return false;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function buildAuthorizationHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function resolveAccessToken(): Promise<string | null> {
  const token = readAccessToken();
  if (token) return token;

  const refreshed = await refreshTokensOnce();
  if (!refreshed) return null;

  return readAccessToken();
}

async function getWsConnectHeaders(): Promise<Record<string, string> | undefined> {
  const token = await resolveAccessToken();
  if (!token) return undefined;
  return buildAuthorizationHeader(token);
}

export async function ensureWsConnected(): Promise<void> {
  if (stompManager.isConnected()) return;

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (!wsUrl) {
    throw new Error('NEXT_PUBLIC_WS_URL is missing');
  }

  try {
    await stompManager.connect(wsUrl, {
      getConnectHeaders: getWsConnectHeaders,
    });
  } catch (connectError) {
    if (stompManager.isConnected()) return;
    const hasReadableAccessToken = Boolean(readAccessToken());
    const shouldTryRefresh = isLikelyAuthConnectFailure(connectError) || !hasReadableAccessToken;

    if (!shouldTryRefresh) {
      throw connectError;
    }

    const refreshed = await refreshTokensOnce();
    if (!refreshed) {
      throw connectError;
    }

    if (stompManager.isConnected()) return;
    await stompManager.connect(wsUrl, {
      getConnectHeaders: getWsConnectHeaders,
    });
  }
}
