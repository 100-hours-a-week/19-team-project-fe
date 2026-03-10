import { StompConnectError, stompManager } from './manager';

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

export async function ensureWsConnected(): Promise<void> {
  if (stompManager.isConnected()) return;

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (!wsUrl) {
    throw new Error('NEXT_PUBLIC_WS_URL is missing');
  }

  try {
    await stompManager.connect(wsUrl);
  } catch (connectError) {
    if (stompManager.isConnected()) return;
    if (!isLikelyAuthConnectFailure(connectError)) {
      throw connectError;
    }

    const refreshed = await refreshTokensOnce();
    if (!refreshed) {
      throw connectError;
    }

    if (stompManager.isConnected()) return;
    await stompManager.connect(wsUrl);
  }
}
