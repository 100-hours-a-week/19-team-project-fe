import { useChatCurrentUser } from './useChatCurrentUser.client';
import { useChatHistory } from './useChatHistory.client';
import { useChatRoomDetail } from './useChatRoomDetail.client';
import { useChatSend } from './useChatSend.client';
import { useChatSocket } from './useChatSocket.client';

export function useChatRoom(chatId: number) {
  const { currentUserId, isLoading: userLoading } = useChatCurrentUser();
  const {
    messages,
    setMessages,
    loading: historyLoading,
    loadingMore: historyLoadingMore,
    loadMore,
    hasMore: historyHasMore,
    error: historyError,
  } = useChatHistory(chatId, currentUserId);
  const wsStatus = useChatSocket(chatId, currentUserId, setMessages);
  const { headerTitle, chatStatus } = useChatRoomDetail(chatId, currentUserId);
  const { sendOptimisticMessage } = useChatSend({
    chatId,
    chatStatus,
    currentUserId,
    setMessages,
  });

  return {
    currentUserId,
    userLoading,
    messages,
    setMessages,
    historyLoading,
    historyLoadingMore,
    historyHasMore,
    historyError,
    loadMore,
    wsStatus,
    headerTitle,
    chatStatus,
    sendOptimisticMessage,
  };
}
