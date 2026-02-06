'use client';

import { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (!isEditMode || authStatus !== 'authed' || !resumeId) return;

    let cancelled = false;
    setIsLoadingResume(true);

    (async () => {
      try {
        const data = await getResumeDetail(resumeId);
        if (cancelled) return;
        onLoaded(data);
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiError(error)) {
          setIsLoadingResume(false);
          return;
        }
        onError(error instanceof Error ? error.message : '이력서를 불러오지 못했습니다.');
      } finally {
        if (cancelled) return;
        setIsLoadingResume(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, handleCommonApiError, isEditMode, onError, onLoaded, resumeId]);

  return { isLoadingResume };
}
