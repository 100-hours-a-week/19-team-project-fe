'use client';

import { useEffect, useState } from 'react';

import { getResumes, type Resume } from '@/entities/resumes';
import { HttpError } from '@/shared/api';

export function useExpertResumes(authStatus: 'checking' | 'authed' | 'guest') {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumeError, setResumeError] = useState('');
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);

  useEffect(() => {
    if (authStatus !== 'authed') {
      setResumes([]);
      setSelectedResumeId(null);
      return;
    }

    let cancelled = false;
    setIsLoadingResumes(true);
    setResumeError('');

    (async () => {
      try {
        const data = await getResumes();
        if (cancelled) return;
        setResumes(data.resumes);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof HttpError && error.status === 401) {
          setResumeError('로그인 이후에 사용 가능합니다.');
        } else {
          setResumeError(error instanceof Error ? error.message : '이력서를 불러오지 못했습니다.');
        }
        setResumes([]);
      } finally {
        if (cancelled) return;
        setIsLoadingResumes(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  return {
    resumes,
    resumeError,
    isLoadingResumes,
    selectedResumeId,
    setSelectedResumeId,
  };
}
