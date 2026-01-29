'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { useCommonApiErrorHandler } from '@/shared/api';
import { stompManager } from '@/shared/ws';
import { getChatMessages, markChatRead, sendChatMessage, subscribeChat } from '@/features/chat';
import type { ChatMessageItem } from '@/entities/chat';

const readCurrentUserId = () => {
  if (typeof document === 'undefined') return null;
  const value = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith('user_id='))
    ?.split('=')[1];
  if (!value) return null;
  const parsed = Number(decodeURIComponent(value));
  return Number.isFinite(parsed) ? parsed : null;
};

const pad2 = (value: number) => value.toString().padStart(2, '0');

const createClientMessageId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `cm_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const formatChatTime = (value: string) => {
  const normalized = value.replace(' ', 'T');
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) return value;

  const hours = parsed.getHours();
  const minutes = pad2(parsed.getMinutes());
  const period = hours < 12 ? '오전' : '오후';
  const displayHours = pad2(hours % 12 === 0 ? 12 : hours % 12);

  return `${period} ${displayHours}:${minutes}`;
};

const sortMessagesByTime = (items: ChatMessageItem[]) =>
  [...items].sort((a, b) => {
    const timeA = new Date(a.created_at.replace(' ', 'T')).getTime();
    const timeB = new Date(b.created_at.replace(' ', 'T')).getTime();
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
      return a.message_id - b.message_id;
    }
    return timeA - timeB;
  });

const mergeMessagesById = (base: ChatMessageItem[], incoming: ChatMessageItem[]) => {
  const map = new Map<number, ChatMessageItem>();
  base.forEach((message) => map.set(message.message_id, message));
  incoming.forEach((message) => map.set(message.message_id, message));
  return sortMessagesByTime(Array.from(map.values()));
};

interface ChatRoomProps {
  chatId: number;
}

export default function ChatRoom({ chatId }: ChatRoomProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [isWsReady, setIsWsReady] = useState(stompManager.isConnected());
  const currentUserId = useMemo(() => readCurrentUserId(), []);
  const handleCommonApiError = useCommonApiErrorHandler();

  /**
   * STOMP 연결 + 구독 -> REST 동기화
   */
  useEffect(() => {
    if (!chatId) return;
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;
    setIsWsReady(stompManager.isConnected());

    (async () => {
      try {
        await stompManager.connect(process.env.NEXT_PUBLIC_WS_URL!);
      } catch (e) {
        console.warn('WS connect failed:', e);
        return; // UI는 살려둠
      }

      if (cancelled) return;
      setIsWsReady(true);

      unsubscribe = subscribeChat<ChatMessageItem>(chatId, (message) => {
        console.log('[WS RECEIVED]', message);

        setMessages((prev) => {
          if (message.client_message_id) {
            const existingIndex = prev.findIndex(
              (item) => item.client_message_id === message.client_message_id,
            );
            if (existingIndex !== -1) {
              const next = [...prev];
              next[existingIndex] = message;
              return sortMessagesByTime(next);
            }
          }
          if (message.message_id > 0) {
            if (prev.some((item) => item.message_id === message.message_id)) {
              return prev;
            }
          }
          return sortMessagesByTime([...prev, message]);
        });

        if (currentUserId !== null && message.sender.user_id !== currentUserId) {
          markChatRead({
            chat_id: chatId,
            message_id: message.message_id,
          }).catch((err) => {
            console.warn('Mark chat read failed:', err);
          });
        }
      });

      try {
        const data = await getChatMessages({ chatId });
        if (cancelled) return;
        setMessages((prev) => mergeMessagesById(prev, data.messages));
        const sorted = sortMessagesByTime(data.messages);
        const latest = sorted[sorted.length - 1];
        if (latest && currentUserId !== null && latest.sender.user_id !== currentUserId) {
          markChatRead({ chat_id: chatId, message_id: latest.message_id }).catch((readError) => {
            console.warn('Mark chat read failed:', readError);
          });
        }
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiError(error)) {
          return;
        }
        console.warn('Chat messages load failed:', error);
      }
    })();

    return () => {
      cancelled = true;
      setIsWsReady(false);
      unsubscribe?.();
    };
  }, [chatId, currentUserId, handleCommonApiError]);

  /**
   * 최신 메시지 위치로 포커스
   */
  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      const container = listRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
        return;
      }
      bottomRef.current?.scrollIntoView({ block: 'end' });
    });
    return () => cancelAnimationFrame(raf);
  }, [messages.length]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (!isWsReady || !stompManager.isConnected()) {
      return;
    }

    try {
      const clientMessageId = createClientMessageId();
      const now = new Date();
      const optimistic: ChatMessageItem = {
        message_id: -now.getTime(),
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

      sendChatMessage({
        chat_id: chatId,
        content: trimmed,
        message_type: 'TEXT',
        client_message_id: clientMessageId,
      });
    } catch (error) {
      console.warn('Send message failed:', error);
    }

    setDraft('');
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f7f7f7]">
      <header className="fixed top-0 left-1/2 z-10 flex h-app-header w-full max-w-[600px] -translate-x-1/2 items-center justify-between bg-white px-4">
        <Link href="/chat" className="text-sm text-neutral-700">
          ←
        </Link>
        <Link href={`/chat/${chatId}/detail`} className="text-sm text-neutral-700">
          설정
        </Link>
      </header>

      <div
        ref={listRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-[calc(72px+24px)] pt-[calc(var(--app-header-height)+16px)]"
      >
        {messages.map((message, index) => {
          const isMine = currentUserId !== null && message.sender.user_id === currentUserId;
          const displayTime = formatChatTime(message.created_at);
          const nextMessage = messages[index + 1];
          const showTime = !nextMessage || formatChatTime(nextMessage.created_at) !== displayTime;

          return (
            <div
              key={message.message_id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end gap-2 ${isMine ? 'flex-row' : 'flex-row'}`}>
                {showTime ? (
                  <span className="text-[11px] text-neutral-400">{displayTime}</span>
                ) : (
                  <span className="w-8" aria-hidden="true" />
                )}
                <div
                  className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      isMine
                        ? 'bg-[var(--color-primary-main)] text-white'
                        : 'bg-white text-neutral-900'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 left-1/2 flex w-full max-w-[600px] -translate-x-1/2 items-center gap-2 bg-[#f7f7f7] px-4 pb-4 pt-3"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="메시지를 입력하세요"
          className="h-11 flex-1 rounded-full border border-neutral-200 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={!isWsReady}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-main)] text-sm font-semibold text-white"
        >
          <svg
            data-slot="icon"
            fill="none"
            strokeWidth={1.5}
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
