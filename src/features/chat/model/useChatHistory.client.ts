'use client';

import { useEffect, useState } from 'react';

import type { ChatMessageItem } from '@/entities/chat';
import { useCommonApiErrorHandler } from '@/shared/api';

import { getChatMessages } from '../api/getChatMessages';
import { markChatRead } from '../api/markChatRead';
import { sortMessagesByTime } from '../lib/message';

export function useChatHistory(chatId: number, currentUserId: number | null) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const handleCommonApiError = useCommonApiErrorHandler();

  useEffect(() => {
    if (!chatId) return;
    let cancelled = false;

    const loadHistory = async (allowRetry: boolean) => {
      try {
        setLoading(true);
        const data = await getChatMessages({ chatId });
        if (cancelled) return;

        const sorted = sortMessagesByTime(data.messages);
        setMessages(sorted);
        setError(null);

        const latest = sorted.at(-1);
        if (latest && currentUserId !== null && latest.sender.user_id !== currentUserId) {
          markChatRead({ chat_id: chatId, message_id: latest.message_id }).catch(() => {});
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

  return { messages, setMessages, loading, error };
}
