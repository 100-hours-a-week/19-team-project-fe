import { stompManager } from './manager';

export async function ensureWsConnected(): Promise<void> {
  if (stompManager.isConnected()) return;

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (!wsUrl) {
    throw new Error('NEXT_PUBLIC_WS_URL is missing');
  }

  await stompManager.connect(wsUrl);
}
