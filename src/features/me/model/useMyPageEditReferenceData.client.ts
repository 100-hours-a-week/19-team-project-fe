'use client';

import { useEffect, useMemo, useState } from 'react';

import { useOnboardingMetadataQuery } from '@/features/onboarding';
import { useCommonApiErrorHandler } from '@/shared/api';

export function useMyPageEditReferenceData() {
  const handleCommonApiError = useCommonApiErrorHandler();
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [careerError, setCareerError] = useState<string | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const { data, error, isLoading } = useOnboardingMetadataQuery();

  useEffect(() => {
    if (!error) {
      setJobsError(null);
      setCareerError(null);
      setSkillsError(null);
      return;
    }
    (async () => {
      if (await handleCommonApiError(error)) return;
      const message = error instanceof Error ? error.message : '참조 데이터를 불러오지 못했습니다.';
      setJobsError(message);
      setCareerError(message);
      setSkillsError(message);
    })();
  }, [error, handleCommonApiError]);

  const jobs = useMemo(() => data?.jobs ?? [], [data]);
  const careerLevels = useMemo(() => data?.career_levels ?? [], [data]);
  const skills = useMemo(() => data?.skills ?? [], [data]);

  return {
    jobs,
    careerLevels,
    skills,
    jobsLoading: isLoading,
    careerLoading: isLoading,
    skillsLoading: isLoading,
    jobsError,
    careerError,
    skillsError,
  };
}
