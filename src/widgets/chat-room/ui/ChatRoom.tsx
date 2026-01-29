'use client';

import type { CSSProperties } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  getChatDetail,
  sendChatMessage,
  sortMessagesByTime,
  useChatHistory,
  useChatSocket,

} from '@/features/chat';
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

interface ChatRoomProps {
  chatId: number;
}

export default function ChatRoom({ chatId }: ChatRoomProps) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const isComposingRef = useRef(false);
  const currentUserId = useMemo(() => readCurrentUserId(), []);
  const { messages, setMessages, error: historyError } = useChatHistory(chatId, currentUserId);
  const wsStatus = useChatSocket(chatId, currentUserId, setMessages);
  const [draft, setDraft] = useState('');
  const [headerTitle, setHeaderTitle] = useState('채팅');
  const [chatStatus, setChatStatus] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');
  const prevWsStatusRef = useRef<typeof wsStatus | null>(null);

  useEffect(() => {
    if (historyError) {
      alert('메시지를 불러오지 못했어요. 새로 고침해 주세요.');
    }
  }, [historyError]);

  useEffect(() => {
    const prev = prevWsStatusRef.current;
    if (prev && prev !== 'disconnected' && wsStatus === 'disconnected') {
      alert('실시간 연결이 끊어졌어요. 재연결 중입니다.');
    }
    prevWsStatusRef.current = wsStatus;
  }, [wsStatus]);

  useEffect(() => {
    if (!chatId) return;
    let cancelled = false;

    (async () => {
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
        console.warn('Chat detail load failed:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chatId, currentUserId]);

  useEffect(() => {
    if (!chatId) return;
    let cancelled = false;

    (async () => {
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
        console.warn('Chat detail load failed:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chatId, currentUserId]);

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
    if (chatStatus === 'CLOSED') {
      return;
    }
    if (wsStatus !== 'connected') {
      return;
    }

    try {
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
        sendChatMessage({
          chat_id: chatId,
          content: trimmed,
          message_type: 'TEXT',
          client_message_id: clientMessageId,
        });
      } catch (sendError) {
        setMessages((prev) => prev.filter((item) => item.message_id !== optimisticId));
        console.warn('Send message failed:', sendError);
        return;
      }
    } catch (error) {
      console.warn('Send message failed:', error);
    }

    setDraft('');
    if (inputRef.current) {
      inputRef.current.style.height = '0px';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  const handleDraftChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = '0px';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden bg-[#f7f7f7]"
      style={{ '--app-header-height': '64px' } as CSSProperties}
    >
      <header className="fixed top-0 left-1/2 z-10 flex h-16 w-full max-w-[600px] -translate-x-1/2 items-center bg-white px-4">
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('nav-direction', 'back');
            router.back();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm"
          aria-label="뒤로 가기"
        >
          <svg
            data-slot="icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1 px-3 text-center text-base font-semibold text-neutral-900">
          {headerTitle}
        </div>
        <Link
          href={`/chat/${chatId}/detail`}
          aria-label="채팅 설정"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm"
        >
          <svg
            data-slot="icon"
            fill="none"
            strokeWidth="1.5"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </Link>
      </header>

      <div
        ref={listRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-[calc(72px+24px)] pt-[calc(var(--app-header-height)+16px)]"
      >
        {chatStatus === 'CLOSED' ? (
          <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm text-neutral-600 shadow-sm">
            종료된 채팅방입니다.
          </div>
        ) : null}
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
              <div className="max-w-[75%] flex flex-col">
                <div
                  className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMine
                      ? 'bg-[var(--color-primary-main)] text-white'
                      : 'bg-white text-neutral-900'
                  }`}
                >
                  <span className="whitespace-pre-wrap break-words">{message.content}</span>
                </div>
                {showTime && (
                  <span
                    className={`mt-1 text-[11px] text-neutral-400 ${
                      isMine ? 'text-right' : 'text-left'
                    }`}
                  >
                    {displayTime}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 left-1/2 flex w-full max-w-[600px] -translate-x-1/2 items-end gap-2 bg-[#f7f7f7] px-4 pb-4 pt-3"
      >
        <textarea
          ref={inputRef}
          value={draft}
          rows={1}
          onChange={handleDraftChange}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || isComposingRef.current) {
              return;
            }
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              (event.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
            }
          }}
          placeholder="메시지를 입력하세요"
          disabled={chatStatus === 'CLOSED'}
          className="min-h-11 max-h-40 flex-1 resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm leading-5 text-neutral-900 placeholder:text-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400"
        />
        <button
          type="submit"
          disabled={wsStatus !== 'connected' || chatStatus === 'CLOSED'}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-main)] text-sm font-semibold text-white disabled:bg-neutral-300"
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
