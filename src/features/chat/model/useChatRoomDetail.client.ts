'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getChatDetail } from '@/features/chat';
import { BusinessError, HttpError, useCommonApiErrorHandler } from '@/shared/api';
import { useToast } from '@/shared/ui/toast';

export function useChatRoomDetail(chatId: number, currentUserId: number | null) {
  const router = useRouter();
  const { pushToast } = useToast();
  const handleCommonApiError = useCommonApiErrorHandler();
  const [headerTitle, setHeaderTitle] = useState('채팅');
  const [chatStatus, setChatStatus] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');
  const [isLoading, setIsLoading] = useState(true);

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
    if (!chatId) return;
    let cancelled = false;

    (async () => {
      const loadDetail = async (allowRetry: boolean) => {
        try {
          setIsLoading(true);
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
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };

      await loadDetail(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [chatId, currentUserId, handleCommonApiError, handleInvalidAccess]);

  return { headerTitle, chatStatus, isLoading };
}
