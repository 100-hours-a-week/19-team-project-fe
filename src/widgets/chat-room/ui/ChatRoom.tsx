'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { readAccessToken } from '@/shared/api';
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

interface ChatRoomProps {
  chatId: number;
}

export default function ChatRoom({ chatId }: ChatRoomProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [isWsReady, setIsWsReady] = useState(stompManager.isConnected());
  const currentUserId = readCurrentUserId();

  useEffect(() => {
    alert(`chatId prop: ${chatId}`);
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await getChatMessages({ chatId });
        alert(JSON.stringify(data, null, 2));
        if (cancelled) return;
        const sorted = sortMessagesByTime(data.messages);
        setMessages(sorted);
        const latest = sorted[sorted.length - 1];
        if (latest && currentUserId !== null && latest.sender.user_id !== currentUserId) {
          markChatRead({ chat_id: chatId, message_id: latest.message_id }).catch((readError) => {
            console.warn('Mark chat read failed:', readError);
          });
        }
      } catch (error) {
        if (cancelled) return;
        console.warn('Chat messages load failed:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chatId]);

  /**
   * STOMP 연결 + 구독
   */
  useEffect(() => {
    if (!chatId) return;
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;
    setIsWsReady(stompManager.isConnected());

    (async () => {
      const accessToken = readAccessToken();
      if (!accessToken) {
        setIsWsReady(stompManager.isConnected());
        return;
      }

      try {
        await stompManager.connect(process.env.NEXT_PUBLIC_WS_URL!, {
          connectHeaders: { Authorization: `Bearer ${accessToken}` },
        });
      } catch (e) {
        console.warn('WS connect failed:', e);
        return; // UI는 살려둠
      }

      if (cancelled) return;
      setIsWsReady(true);

      unsubscribe = subscribeChat<ChatMessageItem>(chatId, (response) => {
        if (response.code !== 'CREATED' || response.data === null || response.data === undefined)
          return;

        setMessages((prev) => sortMessagesByTime([...prev, response.data]));
        if (currentUserId !== null && response.data.sender.user_id !== currentUserId) {
          markChatRead({ chat_id: chatId, message_id: response.data.message_id }).catch(
            (readError) => {
              console.warn('Mark chat read failed:', readError);
            },
          );
        }
      });
    })();

    return () => {
      cancelled = true;
      setIsWsReady(false);
      unsubscribe?.();
    };
  }, [chatId]);

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
      alert('채팅 연결이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    alert(
      `sendChatMessage payload: ${JSON.stringify({
        chat_id: chatId,
        content: trimmed,
        message_type: 'TEXT',
      })}`,
    );

    try {
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
      };
      setMessages((prev) => sortMessagesByTime([...prev, optimistic]));

      sendChatMessage({
        chat_id: chatId,
        content: trimmed,
        message_type: 'TEXT',
      });
    } catch (error) {
      console.warn('Send message failed:', error);
      alert('메시지 전송에 실패했습니다.');
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
        {messages.map((message) => {
          const isMine = currentUserId !== null && message.sender.user_id === currentUserId;

          return (
            <div
              key={message.message_id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] ${
                  isMine ? 'items-end' : 'items-start'
                } flex flex-col gap-1`}
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
                <span className="text-[11px] text-neutral-400">
                  {formatChatTime(message.created_at)}
                </span>
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
