'use client';

import { useEffect, useState } from 'react';

import type { ChatDetailData } from '@/entities/chat';
import { getChatDetail } from '@/features/chat';
import { useCommonApiErrorHandler } from '@/shared/api';

import ChatDetail from './ChatDetail';

type ChatDetailLoaderProps = {
  chatId: number;
};

export default function ChatDetailLoader({ chatId }: ChatDetailLoaderProps) {
  const handleCommonApiError = useCommonApiErrorHandler();
  const [detail, setDetail] = useState<ChatDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) return;
    let cancelled = false;

    const loadDetail = async (allowRetry: boolean) => {
      try {
        setLoading(true);
        const data = await getChatDetail({ chatId });
        if (cancelled) return;
        setDetail(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const handled = await handleCommonApiError(err);
        if (handled) {
          if (allowRetry && !cancelled) {
            await loadDetail(false);
          } else {
            setLoading(false);
          }
          return;
        }
        setError(err instanceof Error ? err.message : '채팅 정보를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDetail(true);

    return () => {
      cancelled = true;
    };
  }, [chatId, handleCommonApiError]);

  if (detail) {
    return <ChatDetail chatId={chatId} detail={detail} />;
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f7f7] px-6 text-center text-sm text-neutral-600">
      {loading ? '채팅 정보를 불러오는 중입니다.' : (error ?? '채팅 정보를 불러오지 못했습니다.')}
    </div>
  );
}
