import { stompManager } from '@/shared/ws';

/**
 * 채팅 응답 구독
 *
 * @param chatId 채팅방 ID
 * @param handler 서버 응답 핸들러
 * @returns unsubscribe 함수
 */
export function subscribeChat<T>(chatId: number, handler: (payload: T) => void): () => void {
  const destination = `/queue/chat.${chatId}`;

  return stompManager.subscribe<T>(
    destination,
    (payload) => {
      handler(payload);
    },
    destination,
  );
}
