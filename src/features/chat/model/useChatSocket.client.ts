'use client';

import { useEffect, useRef, useState } from 'react';

import type { ChatMessageItem } from '@/entities/chat';
import { ensureWsConnected, stompManager } from '@/shared/ws';

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
        await ensureWsConnected();
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
                const existing = next[index];
                next[index] = {
                  ...existing,
                  ...message,
                  // Some servers temporarily emit null message_id for echoed messages.
                  // Keep optimistic id to avoid losing stable rendering key.
                  message_id: message.message_id ?? existing.message_id,
                };
                return sortMessagesByTime(next);
              }
            }

            if (
              message.message_id !== null &&
              prev.some((item) => item.message_id === message.message_id)
            ) {
              return prev;
            }
            const incomingSeq =
              typeof message.room_sequence === 'string'
                ? Number(message.room_sequence)
                : message.room_sequence;
            if (
              Number.isFinite(incomingSeq) &&
              prev.some((item) => item.room_sequence === incomingSeq && item.chat_id === chatId)
            ) {
              return prev;
            }
            return sortMessagesByTime([...prev, message]);
          });

          const messageSeqRaw = message.room_sequence ?? message.message_id;
          const messageSeq =
            typeof messageSeqRaw === 'string' ? Number(messageSeqRaw) : messageSeqRaw;
          if (
            currentUserId !== null &&
            message.sender.user_id !== currentUserId &&
            Number.isFinite(messageSeq)
          ) {
            pendingReadIdRef.current = messageSeq;
            if (readTimerRef.current) return;
            readTimerRef.current = setTimeout(() => {
              readTimerRef.current = null;
              const pendingId = pendingReadIdRef.current;
              if (!pendingId || pendingId === lastSentReadIdRef.current) return;
              updateChatLastRead({ chatId, last_read_seq: pendingId })
                .then(() => {
                  lastSentReadIdRef.current = pendingId;
                })
                .catch(() => {});
            }, READ_DEBOUNCE_MS);
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
      if (readTimerRef.current) {
        clearTimeout(readTimerRef.current);
        readTimerRef.current = null;
      }
      const pendingId = pendingReadIdRef.current;
      if (pendingId && pendingId !== lastSentReadIdRef.current) {
        updateChatLastRead({ chatId, last_read_seq: pendingId })
          .then(() => {
            lastSentReadIdRef.current = pendingId;
          })
          .catch(() => {});
      }
      unsubscribe?.();
      setStatus('disconnected');
    };
  }, [chatId, currentUserId, setMessages]);

  return status;
}
