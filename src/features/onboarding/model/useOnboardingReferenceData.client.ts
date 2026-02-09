'use client';

import { useEffect, useState } from 'react';

import type { CareerLevel, Job, Skill } from '@/entities/onboarding';
import { getOnboardingMetadata } from '@/features/onboarding';
import { useCommonApiErrorHandler } from '@/shared/api';

export function useOnboardingReferenceData() {
  const handleCommonApiError = useCommonApiErrorHandler();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [careerLevels, setCareerLevels] = useState<CareerLevel[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getOnboardingMetadata()
      .then((data) => {
        if (!mounted) return;
        setSkills(data.skills);
        setJobs(data.jobs);
        setCareerLevels(data.career_levels);
      })
      .catch(async (error) => {
        if (!mounted) return;
        if (await handleCommonApiError(error)) return;
        setMetadataError(
          error instanceof Error ? error.message : '온보딩 메타데이터를 불러오지 못했습니다.',
        );
      })
      .finally(() => {
        if (!mounted) return;
        setMetadataLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [handleCommonApiError]);

  return {
    skills,
    jobs,
    careerLevels,
    metadataLoading,
    metadataError,
  };
}
