import { readAccessToken, refreshAuthTokens } from '@/shared/api';

import { stompManager } from './manager';

function buildAuthorizationHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function resolveAccessToken(): Promise<string | null> {
  const currentToken = readAccessToken();
  if (currentToken) return currentToken;

  const refreshed = await refreshAuthTokens().catch(() => false);
  if (!refreshed) return null;

  return readAccessToken();
}

export async function ensureWsConnected(): Promise<void> {
  if (stompManager.isConnected()) return;

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (!wsUrl) {
    throw new Error('NEXT_PUBLIC_WS_URL is missing');
  }

  const initialToken = await resolveAccessToken();
  if (!initialToken) {
    throw new Error('WS auth token is missing');
  }

  await stompManager.connect(wsUrl, {
    getConnectHeaders: async () => {
      const token = await resolveAccessToken();
      if (!token) {
        throw new Error('WS auth token is missing');
      }
      return buildAuthorizationHeader(token);
    },
  });
}
