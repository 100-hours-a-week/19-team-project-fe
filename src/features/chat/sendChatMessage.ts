import { readAccessToken, refreshAuthTokens } from '@/shared/api';
import { stompManager } from '@/shared/ws';
import type { SendChatMessageRequest } from '@/entities/chat';

const AUTH_REFRESH_COOLDOWN_MS = 60_000;
let lastAuthRefreshAt = 0;

async function maybeRefreshAuthTokens(): Promise<void> {
  const now = Date.now();
  if (now - lastAuthRefreshAt < AUTH_REFRESH_COOLDOWN_MS) return;
  const refreshed = await refreshAuthTokens().catch(() => false);
  if (refreshed) lastAuthRefreshAt = now;
}

async function ensureConnected(): Promise<void> {
  if (stompManager.isConnected()) return;
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (!wsUrl) {
    throw new Error('NEXT_PUBLIC_WS_URL is missing');
  }
  const token = readAccessToken();
  await stompManager.connect(wsUrl, {
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function sendChatMessage(payload: SendChatMessageRequest) {
  await maybeRefreshAuthTokens();
  await ensureConnected();
  stompManager.publish('/app/chat.sendMessage', payload);
}
