import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { deleteResume, resumesQueryKey, useResumesQuery, type Resume } from '@/entities/resumes';
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
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useResumesQuery({ enabled: authStatus === 'authed' });

  useEffect(() => {
    if (authStatus !== 'authed') {
      setLoadError(null);
      setResumes([]);
      return;
    }
    setResumes(data?.resumes ?? []);
  }, [authStatus, data]);

  useEffect(() => {
    if (!error) {
      setLoadError(null);
      return;
    }
    (async () => {
      if (await handleCommonApiError(error)) return;
      setLoadError(error instanceof Error ? error.message : '이력서를 불러오지 못했습니다.');
    })();
  }, [error, handleCommonApiError]);

  useEffect(() => {
    setIsLoadingResumes(authStatus === 'authed' ? isLoading : false);
  }, [authStatus, isLoading]);

  useEffect(() => {
    if (!openMenuId) return;
    if (resumes.some((item) => item.resumeId === openMenuId)) return;
    setOpenMenuId(null);
  }, [openMenuId, resumes]);

  const handleDeleteResume = async (resumeId: number) => {
    if (isDeletingId) return;
    const confirmed = window.confirm('이력서를 삭제할까요?');
    if (!confirmed) return;
    setIsDeletingId(resumeId);

    try {
      await deleteResume(resumeId);
      queryClient.setQueryData<{ resumes: Resume[] } | undefined>(resumesQueryKey, (prev) => {
        if (!prev) return { resumes: [] };
        return { ...prev, resumes: prev.resumes.filter((item) => item.resumeId !== resumeId) };
      });
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
