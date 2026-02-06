'use client';

import type { CSSProperties } from 'react';
import { Fragment } from 'react';

import type { ChatMessageItem } from '@/entities/chat';
import {
  formatChatDate,
  formatChatTime,
  getChatDateKey,
  renderMessageContent,
} from './lib/chatFormat';

type ChatRoomMessagesProps = {
  listRef: React.RefObject<HTMLDivElement>;
  bottomRef: React.RefObject<HTMLDivElement>;
  composerHeight: number;
  messages: ChatMessageItem[];
  currentUserId: number | null;
  historyLoading: boolean;
  historyLoadingMore: boolean;
  historyHasMore: boolean;
  chatStatus: 'ACTIVE' | 'CLOSED';
  onScrollTopReached: () => void;
};

export default function ChatRoomMessages({
  listRef,
  bottomRef,
  composerHeight,
  messages,
  currentUserId,
  historyLoading,
  historyLoadingMore,
  historyHasMore,
  chatStatus,
  onScrollTopReached,
}: ChatRoomMessagesProps) {
  return (
    <div
      ref={listRef}
      onScroll={() => {
        const container = listRef.current;
        if (!container) return;
        if (container.scrollTop <= 8 && historyHasMore) {
          onScrollTopReached();
        }
      }}
      className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto px-4 pt-[calc(var(--app-header-height)+16px)]"
      style={{ paddingBottom: composerHeight + 12 } as CSSProperties}
    >
      {historyLoading && messages.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-sm text-neutral-500">
          메시지를 불러오는 중...
        </div>
      ) : null}
      {historyLoadingMore ? (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-neutral-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
          이전 메시지 불러오는 중...
        </div>
      ) : null}
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
        const prevMessage = messages[index - 1];
        const currentDateKey = getChatDateKey(message.created_at);
        const prevDateKey = prevMessage ? getChatDateKey(prevMessage.created_at) : null;
        const showDateDivider = !prevMessage || currentDateKey !== prevDateKey;

        return (
          <Fragment key={message.message_id}>
            {showDateDivider ? (
              <div className="flex items-center justify-center py-1">
                <span className="rounded-full bg-neutral-200/70 px-3 py-1 text-[11px] text-neutral-600">
                  {formatChatDate(message.created_at)}
                </span>
              </div>
            ) : null}
            <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[75%] flex flex-col">
                <div
                  className={`inline-block ${isMine ? 'self-end' : 'self-start'} rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMine
                      ? 'bg-[var(--color-primary-main)] text-white'
                      : 'bg-white text-neutral-900'
                  }`}
                >
                  <span className="whitespace-pre-wrap break-words">
                    {renderMessageContent(message.content)}
                  </span>
                </div>
                {showTime && (
                  <span
                    className={`mt-1 text-[11px] text-neutral-400 ${
                      isMine ? 'text-right self-end' : 'text-left self-start'
                    }`}
                  >
                    {displayTime}
                  </span>
                )}
              </div>
            </div>
          </Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
