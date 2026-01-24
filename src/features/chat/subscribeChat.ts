import { stompManager } from '@/shared/ws';
import type { ChatResponse } from '@/entities/chat';

/**
 * 채팅 응답 구독
 *
 * @param chatId 채팅방 ID
 * @param handler 서버 응답 핸들러
 * @returns unsubscribe 함수
 */
export function subscribeChat<T>(
  chatId: number,
  handler: (response: ChatResponse<T>) => void,
): () => void {
  const destination = `/queue/chat.${chatId}`;

  return stompManager.subscribe<ChatResponse<T>>(
    destination,
    (payload) => {
      handler(payload);
    },
    destination,
  );
}
