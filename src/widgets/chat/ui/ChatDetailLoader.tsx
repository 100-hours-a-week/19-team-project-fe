'use client';

import { useChatDetailLoader } from '@/features/chat';

import ChatDetail from './ChatDetail';

type ChatDetailLoaderProps = {
  chatId: number;
};

export default function ChatDetailLoader({ chatId }: ChatDetailLoaderProps) {
  const { detail, loading, error } = useChatDetailLoader(chatId);

  if (detail) {
    return <ChatDetail chatId={chatId} detail={detail} />;
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f7f7] px-6 text-center text-sm text-neutral-600">
      {loading ? '채팅 정보를 불러오는 중입니다.' : (error ?? '채팅 정보를 불러오지 못했습니다.')}
    </div>
  );
}
