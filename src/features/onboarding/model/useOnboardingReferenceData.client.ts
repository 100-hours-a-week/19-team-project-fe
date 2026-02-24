'use client';

import { useEffect, useMemo, useState } from 'react';

import { useCommonApiErrorHandler } from '@/shared/api';
import { useOnboardingMetadataQuery } from './useOnboardingMetadataQuery.client';

export function useOnboardingReferenceData() {
  const handleCommonApiError = useCommonApiErrorHandler();
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const { data, error, isLoading } = useOnboardingMetadataQuery();

  useEffect(() => {
    if (!error) {
      setMetadataError(null);
      return;
    }
    (async () => {
      if (await handleCommonApiError(error)) return;
      setMetadataError(
        error instanceof Error ? error.message : '온보딩 메타데이터를 불러오지 못했습니다.',
      );
    })();
  }, [error, handleCommonApiError]);

  const skills = useMemo(() => data?.skills ?? [], [data]);
  const jobs = useMemo(() => data?.jobs ?? [], [data]);
  const careerLevels = useMemo(() => data?.career_levels ?? [], [data]);

  return {
    skills,
    jobs,
    careerLevels,
    metadataLoading: isLoading,
    metadataError,
  };
}
