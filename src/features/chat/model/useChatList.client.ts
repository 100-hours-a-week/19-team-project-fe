import { useCallback, useEffect, useRef, useState } from 'react';

import { getMe } from '@/features/auth';
import { getUserMe, type UserMe } from '@/features/me';
import { getChatList } from '@/features/chat';
import type { ChatSummary } from '@/entities/chat';
import { useCommonApiErrorHandler } from '@/shared/api';
import { useAuthGate } from '@/shared/lib/useAuthGate';

import { normalizeChatList } from '@/entities/chat';

export function useChatList() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserMe | null>(null);
  const { status: authStatus } = useAuthGate(getMe);
  const handleCommonApiError = useCommonApiErrorHandler();
  const isActiveRef = useRef(true);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  const fetchChats = useCallback(
    async (allowRetry: boolean, setLoadingState: boolean) => {
      if (setLoadingState) setIsLoading(true);
      try {
        const [userResult, chatResult] = await Promise.allSettled([getUserMe(), getChatList()]);
        if (!isActiveRef.current) return;
        if (userResult.status === 'fulfilled' && userResult.value) {
          setCurrentUser(userResult.value);
        } else {
          setCurrentUser(null);
        }
        if (chatResult.status !== 'fulfilled') {
          throw chatResult.reason;
        }
        const data = chatResult.value;
        const normalized = normalizeChatList(data);
        setChats(normalized);
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
    [handleCommonApiError],
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

  return {
    authStatus,
    chats,
    currentUser,
    isLoading,
    loadError,
  };
}
