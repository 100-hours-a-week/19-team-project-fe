import { useEffect, useRef, useState } from 'react';

import type { ChatMessageItem } from '@/entities/chat';
import { readAccessToken } from '@/shared/api';
import { stompManager } from '@/shared/ws';

import { markChatRead } from '../api/markChatRead';
import { sortMessagesByTime } from '../lib/message';
import { subscribeChat } from '../subscribeChat';

export type WsStatus = 'connecting' | 'connected' | 'disconnected';

export function useChatSocket(
  chatId: number,
  currentUserId: number | null,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageItem[]>>,
) {
  const [status, setStatus] = useState<WsStatus>(
    stompManager.isConnected() ? 'connected' : 'disconnected',
  );
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!chatId) return;
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    const connect = async () => {
      try {
        setStatus('connecting');
        const token = readAccessToken();
        await stompManager.connect(process.env.NEXT_PUBLIC_WS_URL!, {
          connectHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (cancelled) return;

        setStatus('connected');
        retryCountRef.current = 0;

        unsubscribe = subscribeChat<ChatMessageItem>(chatId, (message) => {
          alert(
            `[WS MESSAGE]\nmessage_id: ${message.message_id}\nclient_message_id: ${
              message.client_message_id ?? 'null'
            }`,
          );
          setMessages((prev) => {
            if (message.client_message_id) {
              const index = prev.findIndex(
                (item) => item.client_message_id === message.client_message_id,
              );
              if (index !== -1) {
                const next = [...prev];
                next[index] = message;
                return sortMessagesByTime(next);
              }
            }

            if (prev.some((item) => item.message_id === message.message_id)) {
              return prev;
            }
            return sortMessagesByTime([...prev, message]);
          });

          if (currentUserId !== null && message.sender.user_id !== currentUserId) {
            markChatRead({
              chat_id: chatId,
              message_id: message.message_id,
            }).catch(() => {});
          }
        });
      } catch {
        if (cancelled) return;
        setStatus('disconnected');
        const delay = Math.min(1000 * 2 ** retryCountRef.current, 10_000);
        retryCountRef.current += 1;
        retryTimerRef.current = setTimeout(connect, delay);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      unsubscribe?.();
      setStatus('disconnected');
    };
  }, [chatId, currentUserId, setMessages]);

  return status;
}
