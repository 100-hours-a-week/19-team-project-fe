'use client';

import type { CSSProperties } from 'react';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useChatRoom } from '@/features/chat';
import { useToast } from '@/shared/ui/toast';
import ChatRoomComposer from './ChatRoomComposer';
import ChatRoomMessages from './ChatRoomMessages';
import { useChatRoomEffects } from './lib/useChatRoomEffects';

interface ChatRoomProps {
  chatId: number;
}

export default function ChatRoom({ chatId }: ChatRoomProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const composerRef = useRef<HTMLFormElement | null>(null);
  const [composerHeight, setComposerHeight] = useState(72);
  const {
    currentUserId,
    messages,
    historyLoading,
    historyLoadingMore,
    historyHasMore,
    historyError,
    loadMore,
    wsStatus,
    headerTitle,
    chatStatus,
    sendOptimisticMessage,
  } = useChatRoom(chatId);
  const [draft, setDraft] = useState('');
  const { loadMoreMessages } = useChatRoomEffects({
    listRef,
    bottomRef,
    messagesLength: messages.length,
    historyError,
    historyHasMore,
    historyLoadingMore,
    wsStatus,
    loadMore,
  });

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#f7f7f7]"
      style={{ '--app-header-height': '64px' } as CSSProperties}
    >
      <header className="sticky top-0 z-10 flex h-16 w-full items-center bg-white px-4">
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('nav-direction', 'back');
            router.replace('/chat');
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

      <ChatRoomMessages
        listRef={listRef}
        bottomRef={bottomRef}
        composerHeight={composerHeight}
        messages={messages}
        currentUserId={currentUserId}
        historyLoading={historyLoading}
        historyLoadingMore={historyLoadingMore}
        historyHasMore={historyHasMore}
        chatStatus={chatStatus}
        onScrollTopReached={loadMoreMessages}
      />

      <ChatRoomComposer
        draft={draft}
        setDraft={setDraft}
        chatStatus={chatStatus}
        wsStatus={wsStatus}
        onSend={(message) => {
          void sendOptimisticMessage(message);
        }}
        onOverLimit={() => {
          pushToast('최대 500자까지 입력할 수 있어요.', { variant: 'warning' });
        }}
        onHeightChange={(height) => {
          setComposerHeight(height);
        }}
        inputRef={inputRef}
        composerRef={composerRef}
      />
    </div>
  );
}
