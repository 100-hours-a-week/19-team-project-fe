import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthStatus } from '@/entities/auth';
import { useUserMeQuery } from '@/entities/user';
import {
  CHAT_LIST_REFRESH_EVENT,
  CHAT_REALTIME_REFRESH_EVENT,
  type ChatRealtimeRefreshPayload,
  type ChatSummary,
} from '@/entities/chat';
import { getChatList } from '@/features/chat';
import { useCommonApiErrorHandler } from '@/shared/api';

import { normalizeChatList } from '@/entities/chat';

const isClosedStatus = (chat: ChatSummary) => {
  const normalizedStatus = String(chat.status ?? '').toUpperCase();
  if (normalizedStatus === 'CLOSED') return true;

  const raw = chat as ChatSummary & {
    chat_status?: unknown;
    chatStatus?: unknown;
    closed_at?: unknown;
    closedAt?: unknown;
  };
  const snakeStatus = String(raw.chat_status ?? '').toUpperCase();
  const camelStatus = String(raw.chatStatus ?? '').toUpperCase();
  if (snakeStatus === 'CLOSED' || camelStatus === 'CLOSED') return true;

  return Boolean(raw.closed_at || raw.closedAt);
};

export function useChatList() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [closedChats, setClosedChats] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const { status: authStatus } = useAuthStatus();
  const handleCommonApiError = useCommonApiErrorHandler();
  const isActiveRef = useRef(true);
  const { data: currentUserData } = useUserMeQuery({ enabled: authStatus === 'authed' });
  const currentUser = authStatus === 'authed' ? (currentUserData ?? null) : null;
  const listSizeRef = useRef(20);

  const parseCursor = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = typeof value === 'string' ? Number(value) : value;
    return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
  };

  const mergeChats = useCallback((base: ChatSummary[], incoming: ChatSummary[]) => {
    const map = new Map<number, ChatSummary>();
    [...base, ...incoming].forEach((chat) => {
      map.set(chat.chat_id, chat);
    });
    return normalizeChatList({ chats: Array.from(map.values()), nextCursor: null, hasMore: false });
  }, []);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  const fetchChats = useCallback(
    async (setLoadingState: boolean) => {
      if (setLoadingState) setIsLoading(true);
      try {
        const [activeData, closedData] = await Promise.all([
          getChatList({ status: 'ACTIVE', size: listSizeRef.current }),
          getChatList({ status: 'CLOSED', size: listSizeRef.current }),
        ]);
        if (!isActiveRef.current) return;
        const normalized = normalizeChatList(activeData);
        const normalizedClosed = normalizeChatList(closedData);
        const activeChats = normalized.filter((chat) => !isClosedStatus(chat));
        const closedFromActive = normalized.filter((chat) => isClosedStatus(chat));
        const nextClosed = mergeChats(normalizedClosed, closedFromActive);
        setChats((prev) => (setLoadingState ? activeChats : mergeChats(prev, activeChats)));
        setClosedChats((prev) => (setLoadingState ? nextClosed : mergeChats(prev, nextClosed)));
        setNextCursor(parseCursor(activeData.nextCursor));
        setHasMore(Boolean(activeData.hasMore));
        setLoadError(null);
      } catch (error) {
        if (!isActiveRef.current) return;
        const handled = await handleCommonApiError(error);
        if (handled) {
          setIsLoading(false);
          return;
        }
        setLoadError(error instanceof Error ? error.message : '채팅 목록을 불러오지 못했습니다.');
      } finally {
        if (!isActiveRef.current) return;
        if (setLoadingState) setIsLoading(false);
      }
    },
    [handleCommonApiError, mergeChats],
  );

  useEffect(() => {
    if (authStatus === 'checking') {
      setIsLoading(true);
      return;
    }
    if (authStatus === 'guest') {
      setIsLoading(false);
      setChats([]);
      setClosedChats([]);
      return;
    }

    void fetchChats(true);
  }, [authStatus, fetchChats]);

  useEffect(() => {
    if (authStatus !== 'authed') return;

    const handleRefresh = () => {
      if (document.visibilityState !== 'visible') return;
      void fetchChats(false);
    };
    const handleRealtimeRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<ChatRealtimeRefreshPayload | undefined>;
      if (!customEvent.detail?.chatId) return;
      void fetchChats(false);
    };
    const handleChatListRefresh = () => {
      void fetchChats(false);
    };

    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);
    window.addEventListener(CHAT_REALTIME_REFRESH_EVENT, handleRealtimeRefresh as EventListener);
    window.addEventListener(CHAT_LIST_REFRESH_EVENT, handleChatListRefresh);

    return () => {
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
      window.removeEventListener(
        CHAT_REALTIME_REFRESH_EVENT,
        handleRealtimeRefresh as EventListener,
      );
      window.removeEventListener(CHAT_LIST_REFRESH_EVENT, handleChatListRefresh);
    };
  }, [authStatus, fetchChats]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || nextCursor === null) return null;
    setLoadingMore(true);
    try {
      const data = await getChatList({ cursor: nextCursor, size: listSizeRef.current });
      if (!isActiveRef.current) return null;
      const normalized = normalizeChatList(data);
      const activeChats = normalized.filter((chat) => !isClosedStatus(chat));
      const closedFromActive = normalized.filter((chat) => isClosedStatus(chat));
      setChats((prev) => mergeChats(prev, activeChats));
      if (closedFromActive.length > 0) {
        setClosedChats((prev) => mergeChats(prev, closedFromActive));
      }
      setNextCursor(parseCursor(data.nextCursor));
      setHasMore(Boolean(data.hasMore));
      return activeChats;
    } catch (error) {
      const handled = await handleCommonApiError(error);
      if (!handled) {
        setLoadError(error instanceof Error ? error.message : '채팅 목록을 불러오지 못했습니다.');
      }
      return null;
    } finally {
      if (isActiveRef.current) setLoadingMore(false);
    }
  }, [handleCommonApiError, hasMore, loadingMore, mergeChats, nextCursor]);

  return {
    authStatus,
    chats,
    closedChats,
    currentUser,
    isLoading,
    loadingMore,
    hasMore,
    loadMore,
    loadError,
  };
}
