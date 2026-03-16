'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getExpertReviews, type ExpertReview } from '@/entities/experts';
import { useCommonApiErrorHandler } from '@/shared/api';

const DEFAULT_SIZE = 10;

export function useExpertReviews(userId: number, enabled = true, size = DEFAULT_SIZE) {
  const handleCommonApiError = useCommonApiErrorHandler();
  const isActiveRef = useRef(true);

  const [reviews, setReviews] = useState<ExpertReview[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  const loadInitial = useCallback(async () => {
    if (!enabled) {
      setReviews([]);
      setNextCursor(null);
      setHasMore(false);
      setErrorMessage('');
      setIsLoading(false);
      return;
    }

    if (!Number.isFinite(userId)) {
      setReviews([]);
      setNextCursor(null);
      setHasMore(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await getExpertReviews(userId, { size });
      if (!isActiveRef.current) return;
      setReviews(data.reviews ?? []);
      setNextCursor(data.next_cursor ?? null);
      setHasMore(Boolean(data.has_more));
    } catch (error) {
      if (!isActiveRef.current) return;
      const handled = await handleCommonApiError(error);
      if (!handled) {
        setErrorMessage('리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
      setReviews([]);
      setNextCursor(null);
      setHasMore(false);
    } finally {
      if (isActiveRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, handleCommonApiError, size, userId]);

  const loadMore = useCallback(async () => {
    if (!enabled) return;
    if (!hasMore || !nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const data = await getExpertReviews(userId, { size, cursor: nextCursor });
      if (!isActiveRef.current) return;
      setReviews((prev) => [...prev, ...(data.reviews ?? [])]);
      setNextCursor(data.next_cursor ?? null);
      setHasMore(Boolean(data.has_more));
    } catch (error) {
      if (!isActiveRef.current) return;
      const handled = await handleCommonApiError(error);
      if (!handled) {
        setErrorMessage('리뷰를 더 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      if (isActiveRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [enabled, handleCommonApiError, hasMore, isLoadingMore, nextCursor, size, userId]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  return {
    reviews,
    hasMore,
    isLoading,
    isLoadingMore,
    errorMessage,
    loadMore,
    refetch: loadInitial,
  };
}
