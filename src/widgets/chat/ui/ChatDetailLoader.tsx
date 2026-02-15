'use client';

import { useEffect, useRef } from 'react';

import { useChatDetailLoader } from '@/features/chat';
import type { ChatRequestType } from '@/entities/chat';

import ChatDetail from './ChatDetail';

type ChatDetailLoaderProps = {
  chatId: number;
  requestType?: ChatRequestType | null;
};

export default function ChatDetailLoader({ chatId, requestType }: ChatDetailLoaderProps) {
  const { detail, loading, error } = useChatDetailLoader(chatId);
  const hasShownResponseAlertRef = useRef(false);

  useEffect(() => {
    if (!detail || hasShownResponseAlertRef.current) return;
    hasShownResponseAlertRef.current = true;
    window.alert(`[ChatDetail Response]\\n${JSON.stringify(detail, null, 2)}`);
  }, [detail]);

  if (detail) {
    return <ChatDetail chatId={chatId} detail={detail} requestType={requestType} />;
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f7f7] px-6 text-center text-sm text-neutral-600">
      {loading ? '채팅 정보를 불러오는 중입니다.' : (error ?? '채팅 정보를 불러오지 못했습니다.')}
    </div>
  );
}
