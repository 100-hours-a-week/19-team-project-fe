import { ensureWsConnected, stompManager } from '@/shared/ws';
import type { SendChatMessageRequest } from '@/entities/chat';

export async function sendChatMessage(payload: SendChatMessageRequest) {
  await ensureWsConnected();
  stompManager.publish('/app/chat.sendMessage', payload);
}
