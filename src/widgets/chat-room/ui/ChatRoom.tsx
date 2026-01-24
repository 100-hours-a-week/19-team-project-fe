'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { stompManager } from '@/shared/ws';
import { getChatMessages, sendChatMessage, subscribeChat } from '@/features/chat';
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

interface ChatRoomProps {
  chatId: number;
}

export default function ChatRoom({ chatId }: ChatRoomProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [draft, setDraft] = useState('');
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
        setMessages(data.messages);
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

    (async () => {
      const accessToken = document.cookie
        .split(';')
        .map((item) => item.trim())
        .find((item) => item.startsWith('access_token='))
        ?.split('=')[1];

      if (!accessToken) return;

      try {
        await stompManager.connect(process.env.NEXT_PUBLIC_WS_URL!, {
          connectHeaders: { Authorization: `Bearer ${decodeURIComponent(accessToken)}` },
        });
      } catch (e) {
        console.warn('WS connect failed:', e);
        return; // UI는 살려둠
      }

      if (cancelled) return;

      unsubscribe = subscribeChat<ChatMessage>(chatId, (response) => {
        if (response.code !== 'CREATED' || response.data == null) return;

        setMessages((prev) => [...prev, response.data]);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [chatId]);

  /**
   * 새 메시지 올 때마다 스크롤
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;

    alert(
      `sendChatMessage payload: ${JSON.stringify({
        chat_id: chatId,
        content: trimmed,
        message_type: 'TEXT',
      })}`,
    );

    sendChatMessage({
      chat_id: chatId,
      content: trimmed,
      message_type: 'TEXT',
    });

    setDraft('');
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f7f7f7]">
      <header className="fixed top-0 left-1/2 z-10 flex h-app-header w-full max-w-[600px] -translate-x-1/2 items-center justify-between bg-white px-4">
        <Link href="/chat" className="text-sm text-neutral-700">
          ←
        </Link>
        <div className="text-sm font-semibold text-neutral-900">eden</div>
        <Link href={`/chat/${chatId}/detail`} className="text-sm text-neutral-700">
          설정
        </Link>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-[calc(72px+24px)] pt-[calc(var(--app-header-height)+16px)]">
        {messages.map((message) => {
          const isMine = currentUserId != null && message.sender.user_id === currentUserId;

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
          className="h-11 rounded-full bg-[var(--color-primary-main)] px-4 text-sm font-semibold text-white"
        >
          전송
        </button>
      </form>
    </div>
  );
}
