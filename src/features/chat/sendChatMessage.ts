import { stompManager } from '@/shared/ws';
import type { SendChatMessageRequest } from '@/entities/chat';

export function sendChatMessage(payload: SendChatMessageRequest) {
  stompManager.publish('/app/chat.sendMessage', payload);
}
