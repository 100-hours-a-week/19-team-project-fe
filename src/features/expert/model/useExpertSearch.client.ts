'use client';

import { useCallback, useEffect, useState } from 'react';

import { getExperts, type Expert } from '@/entities/experts';
import { useCommonApiErrorHandler } from '@/shared/api';

export function useExpertSearch() {
  const [keyword, setKeyword] = useState('');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [flowSlide, setFlowSlide] = useState(0);
  const handleCommonApiError = useCommonApiErrorHandler();

  const loadExperts = useCallback(
    async (nextKeyword?: string, size = 5) => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await getExperts({ keyword: nextKeyword, size });
        setExperts(data.experts);
        return data;
      } catch (error) {
        if (await handleCommonApiError(error)) {
          return undefined;
        }
        setExperts([]);
        setErrorMessage('네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.');
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [handleCommonApiError],
  );

  useEffect(() => {
    if (submitted) return;
    if (!keyword.trim()) {
      setExperts([]);
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void loadExperts(keyword.trim() || undefined, 5);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [keyword, loadExperts, submitted]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setFlowSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleSubmit = async () => {
    if (!keyword.trim()) {
      setSubmitted(false);
      setExperts([]);
      setErrorMessage('');
      return;
    }
    setSubmitted(true);
    await loadExperts(keyword.trim() || undefined, 9);
  };

  return {
    keyword,
    setKeyword,
    experts,
    submitted,
    isLoading,
    errorMessage,
    flowSlide,
    handleSubmit,
  };
}
