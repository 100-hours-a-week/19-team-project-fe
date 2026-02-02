'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getChatDetail } from '@/features/chat';
import { ChatDetail } from '@/widgets/chat-detail';
import type { ChatDetailData } from '@/entities/chat';
import { useCommonApiErrorHandler } from '@/shared/api';

type ChatDetailClientProps = {
  chatId: number;
};

export default function ChatDetailClient({ chatId }: ChatDetailClientProps) {
  const router = useRouter();
  const handleCommonApiError = useCommonApiErrorHandler({ redirectTo: '/chat' });
  const [detail, setDetail] = useState<ChatDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chatId || Number.isNaN(chatId)) {
      router.replace('/chat');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await getChatDetail({ chatId });
        if (cancelled) return;
        setDetail(data);
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiError(error)) {
          setIsLoading(false);
          return;
        }
        router.replace('/chat');
      } finally {
        if (cancelled) return;
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chatId, handleCommonApiError, router]);

  if (!chatId || Number.isNaN(chatId)) return null;
  if (isLoading || !detail) {
    return <div className="px-4 py-8 text-center text-sm text-neutral-500">불러오는 중...</div>;
  }
  return <ChatDetail chatId={chatId} detail={detail} />;
}
