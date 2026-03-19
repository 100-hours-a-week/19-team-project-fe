'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  CHAT_REALTIME_REFRESH_EVENT,
  type ChatMessageItem,
  type ChatRealtimeRefreshPayload,
} from '@/entities/chat';
import { useCommonApiErrorHandler } from '@/shared/api';

import { getChatMessages } from '../api/getChatMessages';
import { updateChatLastRead } from '../api/updateChatLastRead';
import { sortMessagesByTime } from '../lib/message';

export function useChatHistory(chatId: number, currentUserId: number | null) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const handleCommonApiError = useCommonApiErrorHandler();

  useEffect(() => {
    if (!chatId) return;
    let cancelled = false;
    setMessages([]);
    setHasMore(false);
    setNextCursor(null);
    setError(null);

    const loadHistory = async () => {
      try {
        setLoading(true);
        const data = await getChatMessages({ chatId });
        if (cancelled) return;

        const sorted = sortMessagesByTime(data.messages);
        setMessages(sorted);
        setNextCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.hasMore));
        setError(null);

        const latest = sorted.at(-1);
        const latestSeqRaw = latest?.room_sequence ?? latest?.message_id ?? null;
        const latestSeq =
          typeof latestSeqRaw === 'string' ? Number(latestSeqRaw) : (latestSeqRaw ?? null);
        if (
          latestSeq &&
          Number.isFinite(latestSeq) &&
          currentUserId !== null &&
          latest?.sender.user_id !== currentUserId
        ) {
          updateChatLastRead({ chatId, last_read_seq: latestSeq }).catch(() => {});
        }
      } catch (err) {
        if (cancelled) return;
        const handled = await handleCommonApiError(err);
        if (handled) {
          return;
        }
        setError(err instanceof Error ? err : new Error('CHAT_HISTORY_FAILED'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadHistory();

    const handleRealtimeRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<ChatRealtimeRefreshPayload | undefined>;
      if (customEvent.detail?.chatId !== chatId) return;
      void loadHistory();
    };
    window.addEventListener(CHAT_REALTIME_REFRESH_EVENT, handleRealtimeRefresh as EventListener);

    return () => {
      cancelled = true;
      window.removeEventListener(
        CHAT_REALTIME_REFRESH_EVENT,
        handleRealtimeRefresh as EventListener,
      );
    };
  }, [chatId, currentUserId, handleCommonApiError]);

  const loadMore = useCallback(async () => {
    if (!chatId || loadingMore || !hasMore || nextCursor === null) return null;
    setLoadingMore(true);
    try {
      const data = await getChatMessages({ chatId, cursor: nextCursor });
      const incoming = data.messages;
      setMessages((prev) => {
        const existingByMessageId = new Set(
          prev.map((item) => item.message_id).filter((id): id is number => id !== null),
        );
        const existingByRoomSeq = new Set(
          prev
            .map((item) => item.room_sequence)
            .filter((seq): seq is number => typeof seq === 'number'),
        );
        const merged = [
          ...prev,
          ...incoming.filter((item) => {
            if (item.message_id !== null && existingByMessageId.has(item.message_id)) {
              return false;
            }
            if (typeof item.room_sequence === 'number' && existingByRoomSeq.has(item.room_sequence)) {
              return false;
            }
            return true;
          }),
        ];
        return sortMessagesByTime(merged);
      });
      setNextCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
      return incoming;
    } catch (err) {
      const handled = await handleCommonApiError(err);
      if (!handled) {
        setError(err instanceof Error ? err : new Error('CHAT_HISTORY_MORE_FAILED'));
      }
      return null;
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, handleCommonApiError, hasMore, loadingMore, nextCursor]);

  return { messages, setMessages, loading, loadingMore, loadMore, hasMore, error };
}
