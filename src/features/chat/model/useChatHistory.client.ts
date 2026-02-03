'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ChatMessageItem } from '@/entities/chat';
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

    const loadHistory = async (allowRetry: boolean) => {
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
        if (latest && currentUserId !== null && latest.sender.user_id !== currentUserId) {
          updateChatLastRead({ chatId, last_message_id: latest.message_id }).catch(() => {});
        }
      } catch (err) {
        if (cancelled) return;
        const handled = await handleCommonApiError(err);
        if (handled) {
          if (allowRetry && !cancelled) {
            await loadHistory(false);
          }
          return;
        }
        setError(err instanceof Error ? err : new Error('CHAT_HISTORY_FAILED'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadHistory(true);

    return () => {
      cancelled = true;
    };
  }, [chatId, currentUserId, handleCommonApiError]);

  const loadMore = useCallback(async () => {
    if (!chatId || loadingMore || !hasMore || nextCursor === null) return null;
    setLoadingMore(true);
    try {
      const data = await getChatMessages({ chatId, cursor: nextCursor });
      const incoming = data.messages;
      setMessages((prev) => {
        const existing = new Set(prev.map((item) => item.message_id));
        const merged = [...prev, ...incoming.filter((item) => !existing.has(item.message_id))];
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
