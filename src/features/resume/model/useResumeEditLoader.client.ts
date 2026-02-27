'use client';

import { useEffect, useRef, useState } from 'react';

import type { ResumeDetail } from '@/entities/resumes';
import { getResumeDetail } from '@/entities/resumes';
import { useCommonApiErrorHandler } from '@/shared/api';

type UseResumeEditLoaderParams = {
  authStatus: 'checking' | 'authed' | 'guest';
  isEditMode: boolean;
  resumeId: number | null;
  onLoaded: (detail: ResumeDetail) => void;
  onError: (message: string) => void;
};

export function useResumeEditLoader({
  authStatus,
  isEditMode,
  resumeId,
  onLoaded,
  onError,
}: UseResumeEditLoaderParams) {
  const handleCommonApiError = useCommonApiErrorHandler({ redirectTo: '/resume' });
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const onLoadedRef = useRef(onLoaded);
  const onErrorRef = useRef(onError);
  const handleCommonApiErrorRef = useRef(handleCommonApiError);

  onLoadedRef.current = onLoaded;
  onErrorRef.current = onError;
  handleCommonApiErrorRef.current = handleCommonApiError;

  useEffect(() => {
    if (!isEditMode || authStatus !== 'authed' || !resumeId) return;

    let cancelled = false;
    setIsLoadingResume(true);

    (async () => {
      try {
        const data = await getResumeDetail(resumeId);
        if (cancelled) return;
        onLoadedRef.current(data);
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiErrorRef.current(error)) {
          setIsLoadingResume(false);
          return;
        }
        onErrorRef.current(
          error instanceof Error ? error.message : '이력서를 불러오지 못했습니다.',
        );
      } finally {
        if (cancelled) return;
        setIsLoadingResume(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, isEditMode, resumeId]);

  return { isLoadingResume };
}
