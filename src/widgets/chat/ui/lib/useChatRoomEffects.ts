'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

type UseChatRoomEffectsParams = {
  listRef: React.RefObject<HTMLDivElement>;
  bottomRef: React.RefObject<HTMLDivElement>;
  messagesLength: number;
  historyError: string | null;
  historyHasMore: boolean;
  historyLoadingMore: boolean;
  wsStatus: 'connected' | 'connecting' | 'disconnected';
  loadMore: () => Promise<unknown[]>;
};

export function useChatRoomEffects({
  listRef,
  bottomRef,
  messagesLength,
  historyError,
  historyHasMore,
  historyLoadingMore,
  wsStatus,
  loadMore,
}: UseChatRoomEffectsParams) {
  const prevWsStatusRef = useRef<typeof wsStatus | null>(null);
  const skipAutoScrollRef = useRef(false);
  const appFrameRef = useRef<HTMLElement | null>(null);

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

  const scrollToBottom = useCallback(() => {
    const container = listRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
      return;
    }
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [bottomRef, listRef]);

  useLayoutEffect(() => {
    if (skipAutoScrollRef.current) return;
    const raf = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(raf);
  }, [messagesLength, scrollToBottom]);

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
  }, [historyHasMore, historyLoadingMore, listRef, loadMore]);

  return { scrollToBottom, loadMoreMessages };
}
