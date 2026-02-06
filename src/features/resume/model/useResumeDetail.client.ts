import { useEffect, useState } from 'react';

import { getMe } from '@/features/auth';
import { getResumeDetail, type ResumeDetail } from '@/entities/resumes';
import { useAuthGate } from '@/shared/lib/useAuthGate';
import { useCommonApiErrorHandler } from '@/shared/api';

export function useResumeDetail(resumeId: number) {
  const { status: authStatus } = useAuthGate(getMe);
  const handleCommonApiError = useCommonApiErrorHandler({ redirectTo: '/resume' });
  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus !== 'authed') {
      setResume(null);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const data = await getResumeDetail(resumeId);
        if (cancelled) return;
        setResume(data);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiError(error)) {
          setIsLoading(false);
          return;
        }
        setLoadError(error instanceof Error ? error.message : '이력서를 불러오지 못했습니다.');
      } finally {
        if (cancelled) return;
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, handleCommonApiError, resumeId]);

  return {
    authStatus,
    resume,
    isLoading,
    loadError,
  };
}
