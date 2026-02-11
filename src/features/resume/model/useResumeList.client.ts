import { useEffect, useState } from 'react';

import { deleteResume, getResumes, type Resume } from '@/entities/resumes';
import { useAuthStatus } from '@/entities/auth';
import { useCommonApiErrorHandler } from '@/shared/api';

export function useResumeList() {
  const { status: authStatus } = useAuthStatus();
  const handleCommonApiError = useCommonApiErrorHandler();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (authStatus !== 'authed') {
      setResumes([]);
      setIsLoadingResumes(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingResumes(true);

    (async () => {
      try {
        const data = await getResumes();
        if (cancelled) return;
        setResumes(data.resumes ?? []);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        if (await handleCommonApiError(error)) {
          setIsLoadingResumes(false);
          return;
        }
        setLoadError(error instanceof Error ? error.message : '이력서를 불러오지 못했습니다.');
      } finally {
        if (cancelled) return;
        setIsLoadingResumes(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, handleCommonApiError]);

  const handleDeleteResume = async (resumeId: number) => {
    if (isDeletingId) return;
    const confirmed = window.confirm('이력서를 삭제할까요?');
    if (!confirmed) return;
    setIsDeletingId(resumeId);

    try {
      await deleteResume(resumeId);
      setResumes((prev) => prev.filter((item) => item.resumeId !== resumeId));
    } catch (error) {
      await handleCommonApiError(error);
    } finally {
      setIsDeletingId(null);
    }
  };

  return {
    authStatus,
    resumes,
    isLoadingResumes,
    loadError,
    openMenuId,
    setOpenMenuId,
    isDeletingId,
    handleDeleteResume,
  };
}
