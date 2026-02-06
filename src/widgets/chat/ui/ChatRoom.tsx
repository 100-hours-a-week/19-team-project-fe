'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import { refreshAuthTokens, useCommonApiErrorHandler } from '@/shared/api';
import { BusinessError, HttpError } from '@/shared/api/errors';
import { useToast } from '@/shared/ui/toast';
import { getUserMe } from '@/features/me';

const pad2 = (value: number) => value.toString().padStart(2, '0');

const createClientMessageId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `cm_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const parseChatDate = (value: string) => {
  const normalized = value.replace(' ', 'T');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const formatChatTime = (value: string) => {
  const parsed = parseChatDate(value);
  if (!parsed) return value;

  const hours = parsed.getHours();
  const minutes = pad2(parsed.getMinutes());
  const period = hours < 12 ? '오전' : '오후';
  const displayHours = pad2(hours % 12 === 0 ? 12 : hours % 12);

  return `${period} ${displayHours}:${minutes}`;
};

const formatChatDate = (value: string) => {
  const parsed = parseChatDate(value);
  if (!parsed) return value;
  return `${parsed.getFullYear()}년 ${parsed.getMonth() + 1}월 ${parsed.getDate()}일`;
};

const getChatDateKey = (value: string) => {
  const parsed = parseChatDate(value);
  if (!parsed) return value;
  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
};

const renderMessageContent = (content: string) => {
  const normalized = content.replace(/\s+$/g, '');
  const nodes: ReactNode[] = [];
  const regex = /https?:\/\/[^\s]+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(normalized.slice(lastIndex, match.index));
    }
    const url = match[0];
    nodes.push(
      <a
        key={`${match.index}-${url}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        {url}
      </a>,
    );
    lastIndex = match.index + url.length;
  }

  if (lastIndex < normalized.length) {
    nodes.push(normalized.slice(lastIndex));
  }

  return nodes;
};

interface ChatRoomProps {
  chatId: number;
}

export default function ChatRoom({ chatId }: ChatRoomProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const handleCommonApiError = useCommonApiErrorHandler();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const composerRef = useRef<HTMLFormElement | null>(null);
  const isComposingRef = useRef(false);
  const [composerHeight, setComposerHeight] = useState(72);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const {
    messages,
    setMessages,
    loading: historyLoading,
    loadingMore: historyLoadingMore,
    loadMore,
    hasMore: historyHasMore,
    error: historyError,
  } = useChatHistory(chatId, currentUserId);
  const wsStatus = useChatSocket(chatId, currentUserId, setMessages);
  const [draft, setDraft] = useState('');
  const messageLength = draft.length;
  const isOverLimit = messageLength > 500;
  const isBlankDraft = draft.trim().length === 0;
  const [headerTitle, setHeaderTitle] = useState('채팅');
  const [chatStatus, setChatStatus] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');
  const prevWsStatusRef = useRef<typeof wsStatus | null>(null);
  const didRetryUserRef = useRef(false);
  const maxInputHeight = 160;
  const isMobile =
    typeof navigator !== 'undefined' && /iphone|ipad|ipod|android/i.test(navigator.userAgent);
  const preventMobileSubmitRef = useRef(false);
  const skipAutoScrollRef = useRef(false);
  const appFrameRef = useRef<HTMLElement | null>(null);
  const composerShiftRef = useRef(0);
  const isComposerFocusedRef = useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    const body = document.body;
    const frame = document.querySelector<HTMLElement>('.app-frame');
    appFrameRef.current = frame;
    html.classList.add('chat-room-locked');
    body.classList.add('chat-room-locked');
    frame?.classList.add('chat-room-locked');
    return () => {
      html.classList.remove('chat-room-locked');
      body.classList.remove('chat-room-locked');
      appFrameRef.current?.classList.remove('chat-room-locked');
    };
  }, []);

  const handleInvalidAccess = useCallback(
    (error: unknown): boolean => {
      const invalidAccess =
        (error instanceof BusinessError && ['CHAT_NOT_FOUND', 'FORBIDDEN'].includes(error.code)) ||
        (error instanceof HttpError && [403, 404].includes(error.status));

      if (!invalidAccess) return false;
      pushToast('잘못된 접근입니다.', { variant: 'warning' });
      router.replace('/');
      return true;
    },
    [pushToast, router],
  );

  useEffect(() => {
    if (historyError) {
      alert('메시지를 불러오지 못했어요. 새로 고침해 주세요.');
    }
  }, [historyError]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await getUserMe();
        if (cancelled) return;
        if (!me) {
          if (!didRetryUserRef.current) {
            didRetryUserRef.current = true;
            const refreshed = await refreshAuthTokens().catch(() => false);
            if (!refreshed || cancelled) {
              setCurrentUserId(null);
              return;
            }
            const retryMe = await getUserMe().catch(() => null);
            if (cancelled) return;
            if (!retryMe) {
              setCurrentUserId(null);
              return;
            }
            setCurrentUserId(Number.isFinite(retryMe.id) ? retryMe.id : null);
            return;
          }
          setCurrentUserId(null);
          return;
        }
        setCurrentUserId(Number.isFinite(me.id) ? me.id : null);
      } catch (error) {
        if (cancelled) return;
        const handled = await handleCommonApiError(error);
        if (!handled) {
          console.warn('Failed to load current user:', error);
        }
        setCurrentUserId(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [handleCommonApiError]);

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
      const loadDetail = async (allowRetry: boolean) => {
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
          const handled = await handleCommonApiError(error);
          if (handled) {
            if (allowRetry && !cancelled) {
              await loadDetail(false);
            }
            return;
          }
          if (handleInvalidAccess(error)) return;
          console.warn('Chat detail load failed:', error);
        }
      };

      await loadDetail(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [chatId, currentUserId, handleCommonApiError, handleInvalidAccess]);

  const sendOptimisticMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      if (chatStatus === 'CLOSED') return;

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
        await sendChatMessage({
          chat_id: chatId,
          content: trimmed,
          message_type: 'TEXT',
          client_message_id: clientMessageId,
        });
      } catch (sendError) {
        setMessages((prev) => prev.filter((item) => item.message_id !== optimisticId));
        console.warn('Send message failed:', sendError);
      }
    },
    [chatId, chatStatus, currentUserId, setMessages],
  );

  /**
   * 최신 메시지 위치로 포커스
   */
  const scrollToBottom = useCallback(() => {
    const container = listRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
      return;
    }
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, []);

  useLayoutEffect(() => {
    if (skipAutoScrollRef.current) return;
    const raf = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(raf);
  }, [messages.length, scrollToBottom]);

  const resizeInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = '0px';
    const nextHeight = Math.min(input.scrollHeight, maxInputHeight);
    input.style.height = `${nextHeight}px`;
    input.style.overflowY = input.scrollHeight > maxInputHeight ? 'auto' : 'hidden';
  }, [maxInputHeight]);

  useLayoutEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    const updateHeight = () => {
      setComposerHeight(composer.offsetHeight);
      requestAnimationFrame(scrollToBottom);
    };
    updateHeight();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(composer);
    return () => observer.disconnect();
  }, [scrollToBottom]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const viewport = window.visualViewport;
    const composer = composerRef.current;
    if (!viewport || !composer) return;

    const updateComposerShift = () => {
      const keyboardHeight = Math.max(0, window.innerHeight - viewport.height);
      const nextShift = isComposerFocusedRef.current ? keyboardHeight : 0;
      if (composerShiftRef.current === nextShift) return;
      composerShiftRef.current = nextShift;
      composer.style.transform = nextShift ? `translateY(-${nextShift}px)` : 'translateY(0)';
    };

    updateComposerShift();
    viewport.addEventListener('resize', updateComposerShift);
    viewport.addEventListener('scroll', updateComposerShift);
    return () => {
      viewport.removeEventListener('resize', updateComposerShift);
      viewport.removeEventListener('scroll', updateComposerShift);
    };
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isMobile && preventMobileSubmitRef.current) {
      preventMobileSubmitRef.current = false;
      return;
    }
    if (isBlankDraft) return;
    if (isOverLimit) {
      pushToast('최대 500자까지 입력할 수 있어요.', { variant: 'warning' });
      return;
    }
    void sendOptimisticMessage(draft);
    setDraft('');
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      inputRef.current.style.overflowY = 'hidden';
      inputRef.current.style.height = '0px';
      requestAnimationFrame(() => {
        resizeInput();
        inputRef.current?.focus({ preventScroll: true });
      });
    }
  };

  const handleDraftChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.target.value);
    resizeInput();
  };

  const loadMoreMessages = useCallback(async () => {
    const container = listRef.current;
    if (!container) return;
    if (!historyHasMore || historyLoadingMore) return;

    const prevScrollHeight = container.scrollHeight;
    const prevScrollTop = container.scrollTop;
    skipAutoScrollRef.current = true;

    const loaded = await loadMore();
    if (!loaded || loaded.length === 0) {
      skipAutoScrollRef.current = false;
      return;
    }

    requestAnimationFrame(() => {
      const nextScrollHeight = container.scrollHeight;
      container.scrollTop = nextScrollHeight - prevScrollHeight + prevScrollTop;
      skipAutoScrollRef.current = false;
    });
  }, [historyHasMore, historyLoadingMore, loadMore]);

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

      <div
        ref={listRef}
        onScroll={() => {
          const container = listRef.current;
          if (!container) return;
          if (container.scrollTop <= 8) {
            void loadMoreMessages();
          }
        }}
        className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto px-4 pt-[calc(var(--app-header-height)+16px)]"
        style={{ paddingBottom: composerHeight + 12 }}
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

      <form
        ref={composerRef}
        onSubmit={handleSubmit}
        className="sticky bottom-4 z-10 flex w-full max-w-none items-end gap-2 bg-[#f7f7f7] px-4 pb-0 pt-3"
      >
        <textarea
          ref={inputRef}
          value={draft}
          rows={1}
          onChange={handleDraftChange}
          onFocus={() => {
            isComposerFocusedRef.current = true;
            resizeInput();
            inputRef.current?.focus({ preventScroll: true });
          }}
          onBlur={() => {
            isComposerFocusedRef.current = false;
          }}
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
            if (isMobile) {
              if (event.key === 'Enter') {
                preventMobileSubmitRef.current = true;
              }
              return;
            }
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              (event.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
            }
          }}
          enterKeyHint="enter"
          placeholder="메시지를 입력하세요"
          disabled={chatStatus === 'CLOSED'}
          style={{ fontSize: '16px' }}
          className="min-h-11 max-h-40 flex-1 resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[16px] leading-5 text-neutral-900 placeholder:text-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400 overflow-y-hidden"
        />
        <button
          type="submit"
          disabled={
            wsStatus !== 'connected' || chatStatus === 'CLOSED' || isOverLimit || isBlankDraft
          }
          onMouseDown={(event) => event.preventDefault()}
          onTouchStart={(event) => event.preventDefault()}
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
