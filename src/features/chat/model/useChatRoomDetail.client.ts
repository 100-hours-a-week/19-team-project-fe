'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getChatDetail } from '@/features/chat';
import {
  CHAT_REALTIME_REFRESH_EVENT,
  type ChatDetailData,
  type ChatRealtimeRefreshPayload,
} from '@/entities/chat';
import { BusinessError, HttpError, useCommonApiErrorHandler } from '@/shared/api';
import { useToast } from '@/shared/ui/toast';
import { hasChatFeedbackSubmitted } from '../lib/reportCreate.client';

export function useChatRoomDetail(chatId: number, currentUserId: number | null) {
  const router = useRouter();
  const { pushToast } = useToast();
  const handleCommonApiError = useCommonApiErrorHandler();
  const [headerTitle, setHeaderTitle] = useState('채팅');
  const [chatStatus, setChatStatus] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');
  const [isRequestReceiver, setIsRequestReceiver] = useState(false);
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
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
    setIsFeedbackSubmitted(hasChatFeedbackSubmitted(chatId));

    const loadDetail = async () => {
      try {
        setIsLoading(true);
        const detail = await getChatDetail({ chatId });
        if (cancelled) return;
        const meId = currentUserId;
        const counterpart =
          meId !== null && detail.receiver.user_id === meId ? detail.requester : detail.receiver;
        setHeaderTitle(counterpart.nickname ?? '채팅');
        setChatStatus(detail.status);
        setIsRequestReceiver(meId !== null && detail.receiver.user_id === meId);
        const raw = detail as ChatDetailData & {
          chat_feedback_id?: unknown;
          chatFeedbackId?: unknown;
          report_id?: unknown;
          reportId?: unknown;
        };
        setIsFeedbackSubmitted(
          Boolean(
            raw.chat_feedback_id ??
            raw.chatFeedbackId ??
            raw.report_id ??
            raw.reportId ??
            hasChatFeedbackSubmitted(chatId),
          ),
        );
      } catch (error) {
        if (cancelled) return;
        const handled = await handleCommonApiError(error);
        if (handled) {
          return;
        }
        if (handleInvalidAccess(error)) return;
        console.warn('Chat detail load failed:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadDetail();

    const handleRealtimeRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<ChatRealtimeRefreshPayload | undefined>;
      if (customEvent.detail?.chatId !== chatId) return;
      void loadDetail();
    };
    window.addEventListener(CHAT_REALTIME_REFRESH_EVENT, handleRealtimeRefresh as EventListener);

    return () => {
      cancelled = true;
      window.removeEventListener(
        CHAT_REALTIME_REFRESH_EVENT,
        handleRealtimeRefresh as EventListener,
      );
    };
  }, [chatId, currentUserId, handleCommonApiError, handleInvalidAccess]);

  return { headerTitle, chatStatus, isRequestReceiver, isFeedbackSubmitted, isLoading };
}
