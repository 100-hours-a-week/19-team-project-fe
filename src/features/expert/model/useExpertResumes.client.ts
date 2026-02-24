'use client';

import { useEffect, useState } from 'react';

import { useResumesQuery, type Resume } from '@/entities/resumes';
import { HttpError } from '@/shared/api';

export function useExpertResumes(authStatus: 'checking' | 'authed' | 'guest') {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumeError, setResumeError] = useState('');
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const { data, error, isLoading } = useResumesQuery({ enabled: authStatus === 'authed' });

  useEffect(() => {
    if (authStatus !== 'authed') {
      setResumes([]);
      setResumeError('');
      setIsLoadingResumes(false);
      setSelectedResumeId(null);
      return;
    }

    setResumes(data?.resumes ?? []);
    setIsLoadingResumes(isLoading);
  }, [authStatus, data, isLoading]);

  useEffect(() => {
    if (!error) {
      setResumeError('');
      return;
    }
    if (error instanceof HttpError && error.status === 401) {
      setResumeError('로그인 이후에 사용 가능합니다.');
      return;
    }
    setResumeError(error instanceof Error ? error.message : '이력서를 불러오지 못했습니다.');
  }, [error]);

  useEffect(() => {
    if (selectedResumeId === null) return;
    if (resumes.some((resume) => resume.resumeId === selectedResumeId)) return;
    setSelectedResumeId(null);
  }, [resumes, selectedResumeId]);

  return {
    resumes,
    resumeError,
    isLoadingResumes,
    selectedResumeId,
    setSelectedResumeId,
  };
}
