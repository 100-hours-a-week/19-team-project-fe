'use client';

import { useEffect, useRef, useState } from 'react';

import type { ChatMessageItem } from '@/entities/chat';
import { readAccessToken, refreshAuthTokens } from '@/shared/api';
import { stompManager } from '@/shared/ws';

import { updateChatLastRead } from '../api/updateChatLastRead';
import { sortMessagesByTime } from '../lib/message';
import { subscribeChat } from '../subscribeChat';

export type WsStatus = 'connecting' | 'connected' | 'disconnected';

export function useChatSocket(
  chatId: number,
  currentUserId: number | null,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageItem[]>>,
) {
  const READ_DEBOUNCE_MS = 2500;
  const [status, setStatus] = useState<WsStatus>(
    stompManager.isConnected() ? 'connected' : 'disconnected',
  );
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshedOnFailRef = useRef(false);
  const pendingReadIdRef = useRef<number | null>(null);
  const lastSentReadIdRef = useRef<number | null>(null);
  const readTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!chatId) return;
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    const connect = async () => {
      try {
        setStatus('connecting');
        let token = readAccessToken();
        if (!token) {
          const refreshed = await refreshAuthTokens().catch(() => false);
          if (refreshed) {
            token = readAccessToken();
          }
        }
        await stompManager.connect(process.env.NEXT_PUBLIC_WS_URL!, {
          connectHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (cancelled) return;

        setStatus('connected');
        retryCountRef.current = 0;

        unsubscribe = subscribeChat<ChatMessageItem>(chatId, (message) => {
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
            pendingReadIdRef.current = message.message_id;
            if (readTimerRef.current) return;
            readTimerRef.current = setTimeout(() => {
              readTimerRef.current = null;
              const pendingId = pendingReadIdRef.current;
              if (!pendingId || pendingId === lastSentReadIdRef.current) return;
              updateChatLastRead({ chatId, last_message_id: pendingId })
                .then(() => {
                  lastSentReadIdRef.current = pendingId;
                })
                .catch(() => {});
            }, READ_DEBOUNCE_MS);
          }
        });
      } catch {
        if (cancelled) return;
        if (!refreshedOnFailRef.current) {
          const refreshed = await refreshAuthTokens().catch(() => false);
          refreshedOnFailRef.current = refreshed;
          if (refreshed && !cancelled) {
            retryTimerRef.current = setTimeout(connect, 0);
            return;
          }
        }
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
      if (readTimerRef.current) {
        clearTimeout(readTimerRef.current);
        readTimerRef.current = null;
      }
      const pendingId = pendingReadIdRef.current;
      if (pendingId && pendingId !== lastSentReadIdRef.current) {
        updateChatLastRead({ chatId, last_message_id: pendingId })
          .then(() => {
            lastSentReadIdRef.current = pendingId;
          })
          .catch(() => {});
      }
      refreshedOnFailRef.current = false;
      unsubscribe?.();
      setStatus('disconnected');
    };
  }, [chatId, currentUserId, setMessages]);

  return status;
}
