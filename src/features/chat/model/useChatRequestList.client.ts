import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthStatus } from '@/entities/auth';
import type { ChatRequestItem, ChatRequestStatus } from '@/entities/chat';
import { getChatRequestList } from '@/features/chat';
import { useCommonApiErrorHandler } from '@/shared/api';

type UseChatRequestListOptions = {
  direction?: 'received' | 'sent';
  status?: ChatRequestStatus;
  size?: number;
};

export function useChatRequestList(options: UseChatRequestListOptions = {}) {
  const { direction = 'received', status = 'PENDING', size = 5 } = options;
  const [requests, setRequests] = useState<ChatRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { status: authStatus } = useAuthStatus();
  const handleCommonApiError = useCommonApiErrorHandler();
  const isActiveRef = useRef(true);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  const fetchRequests = useCallback(
    async (allowRetry: boolean, setLoadingState: boolean) => {
      if (setLoadingState) setIsLoading(true);
      try {
        const data = await getChatRequestList({ direction, status, size });
        if (!isActiveRef.current) return;
        setRequests(data.requests ?? []);
        setLoadError(null);
      } catch (error) {
        if (!isActiveRef.current) return;
        const handled = await handleCommonApiError(error);
        if (handled) {
          if (allowRetry) {
            await fetchRequests(false, false);
          } else {
            setIsLoading(false);
          }
          return;
        }
        setLoadError(error instanceof Error ? error.message : '요청 목록을 불러오지 못했습니다.');
      } finally {
        if (!isActiveRef.current) return;
        if (setLoadingState) setIsLoading(false);
      }
    },
    [direction, status, size, handleCommonApiError],
  );

  useEffect(() => {
    if (authStatus === 'checking') {
      setIsLoading(true);
      return;
    }
    if (authStatus === 'guest') {
      setIsLoading(false);
      return;
    }

    void fetchRequests(true, true);
  }, [authStatus, fetchRequests]);

  return {
    authStatus,
    requests,
    setRequests,
    isLoading,
    loadError,
    refetch: () => fetchRequests(true, true),
  };
}
