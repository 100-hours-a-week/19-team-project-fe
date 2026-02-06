import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  getChatDetail,
  sendChatMessage,
  sortMessagesByTime,
  useChatHistory,
  useChatSocket,
} from '@/features/chat';
import type { ChatMessageItem } from '@/entities/chat';
import { refreshAuthTokens, useCommonApiErrorHandler } from '@/shared/api';
import { BusinessError, HttpError } from '@/shared/api/errors';
import { useToast } from '@/shared/ui/toast';
import { getUserMe } from '@/features/me';

const createClientMessageId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `cm_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export function useChatRoom(chatId: number) {
  const router = useRouter();
  const { pushToast } = useToast();
  const handleCommonApiError = useCommonApiErrorHandler();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
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
  const [headerTitle, setHeaderTitle] = useState('채팅');
  const [chatStatus, setChatStatus] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');
  const didRetryUserRef = useRef(false);

  const handleInvalidAccess = useCallback(
    (error: unknown): boolean => {
      const invalidAccess =
        (error instanceof BusinessError && ['CHAT_NOT_FOUND', 'FORBIDDEN'].includes(error.code)) ||
        (error instanceof HttpError && [403, 404].includes(error.status));

      if (!invalidAccess) return false;
      pushToast('잘못된 접근입니다.', { variant: 'warning' });
      router.replace('/');
      return true;
    },
    [pushToast, router],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await getUserMe();
        if (cancelled) return;
        if (!me) {
          if (!didRetryUserRef.current) {
            didRetryUserRef.current = true;
            const refreshed = await refreshAuthTokens().catch(() => false);
            if (!refreshed || cancelled) {
              setCurrentUserId(null);
              return;
            }
            const retryMe = await getUserMe().catch(() => null);
            if (cancelled) return;
            if (!retryMe) {
              setCurrentUserId(null);
              return;
            }
            setCurrentUserId(Number.isFinite(retryMe.id) ? retryMe.id : null);
            return;
          }
          setCurrentUserId(null);
          return;
        }
        setCurrentUserId(Number.isFinite(me.id) ? me.id : null);
      } catch (error) {
        if (cancelled) return;
        const handled = await handleCommonApiError(error);
        if (!handled) {
          console.warn('Failed to load current user:', error);
        }
        setCurrentUserId(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [handleCommonApiError]);

  useEffect(() => {
    if (!chatId) return;
    let cancelled = false;

    (async () => {
      const loadDetail = async (allowRetry: boolean) => {
        try {
          const detail = await getChatDetail({ chatId });
          if (cancelled) return;
          const meId = currentUserId;
          const counterpart =
            meId !== null && detail.receiver.user_id === meId ? detail.requester : detail.receiver;
          setHeaderTitle(counterpart.nickname ?? '채팅');
          setChatStatus(detail.status);
        } catch (error) {
          if (cancelled) return;
          const handled = await handleCommonApiError(error);
          if (handled) {
            if (allowRetry && !cancelled) {
              await loadDetail(false);
            }
            return;
          }
          if (handleInvalidAccess(error)) return;
          console.warn('Chat detail load failed:', error);
        }
      };

      await loadDetail(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [chatId, currentUserId, handleCommonApiError, handleInvalidAccess]);

  const sendOptimisticMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      if (chatStatus === 'CLOSED') return;

      const now = new Date();
      const optimisticId = -now.getTime();
      const clientMessageId = createClientMessageId();
      const optimistic: ChatMessageItem = {
        message_id: optimisticId,
        chat_id: chatId,
        sender: {
          user_id: currentUserId ?? 0,
          nickname: 'me',
        },
        message_type: 'TEXT',
        content: trimmed,
        created_at: now.toISOString(),
        client_message_id: clientMessageId,
      };
      setMessages((prev) => sortMessagesByTime([...prev, optimistic]));

      try {
        await sendChatMessage({
          chat_id: chatId,
          content: trimmed,
          message_type: 'TEXT',
          client_message_id: clientMessageId,
        });
      } catch (sendError) {
        setMessages((prev) => prev.filter((item) => item.message_id !== optimisticId));
        console.warn('Send message failed:', sendError);
      }
    },
    [chatId, chatStatus, currentUserId, setMessages],
  );

  return {
    currentUserId,
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
