'use client';

import { useEffect, useRef, useState } from 'react';

import { getExpertDetail, type ExpertDetail } from '@/entities/experts';
import { BusinessError, useCommonApiErrorHandler } from '@/shared/api';

export function useExpertDetail(userId: number) {
  const handleCommonApiError = useCommonApiErrorHandler();
  const [expert, setExpert] = useState<ExpertDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await getExpertDetail(userId);
        if (isMounted) setExpert(data);
      } catch (error) {
        if (isMounted) {
          if (
            error instanceof BusinessError &&
            (error.code === 'EXPERT_USER_ID_INVALID' || error.code === 'EXPERT_NOT_FOUND')
          ) {
            await handleCommonApiError(error);
            setExpert(null);
            return;
          }
          if (await handleCommonApiError(error)) {
            return;
          }
          const message = error instanceof Error ? error.message : '알 수 없는 오류';
          setErrorMessage(message);
          setExpert(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [handleCommonApiError, userId]);

  return { expert, isLoading, errorMessage };
}
