import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthStatus } from '@/entities/auth';
import { useUserMeQuery } from '@/entities/user';
import { getChatList } from '@/features/chat';
import type { ChatSummary } from '@/entities/chat';
import { useCommonApiErrorHandler } from '@/shared/api';

import { normalizeChatList } from '@/entities/chat';

export function useChatList() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
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
    async (allowRetry: boolean, setLoadingState: boolean) => {
      if (setLoadingState) setIsLoading(true);
      try {
        const data = await getChatList({ size: listSizeRef.current });
        if (!isActiveRef.current) return;
        const normalized = normalizeChatList(data);
        setChats((prev) => (setLoadingState ? normalized : mergeChats(prev, normalized)));
        setNextCursor(parseCursor(data.nextCursor));
        setHasMore(Boolean(data.hasMore));
        setLoadError(null);
      } catch (error) {
        if (!isActiveRef.current) return;
        const handled = await handleCommonApiError(error);
        if (handled) {
          if (allowRetry) {
            await fetchChats(false, false);
          } else {
            setIsLoading(false);
          }
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
      return;
    }

    void fetchChats(true, true);
  }, [authStatus, fetchChats]);

  useEffect(() => {
    if (authStatus !== 'authed') return;

    const handleRefresh = () => {
      if (document.visibilityState !== 'visible') return;
      void fetchChats(true, false);
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void fetchChats(false, false);
    }, 1_000);

    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
    };
  }, [authStatus, fetchChats]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || nextCursor === null) return null;
    setLoadingMore(true);
    try {
      const data = await getChatList({ cursor: nextCursor, size: listSizeRef.current });
      if (!isActiveRef.current) return null;
      const normalized = normalizeChatList(data);
      setChats((prev) => mergeChats(prev, normalized));
      setNextCursor(parseCursor(data.nextCursor));
      setHasMore(Boolean(data.hasMore));
      return normalized;
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
    currentUser,
    isLoading,
    loadingMore,
    hasMore,
    loadMore,
    loadError,
  };
}
