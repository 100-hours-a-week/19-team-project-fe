'use client';

import { useEffect, useState } from 'react';

import type { CareerLevel, Job, Skill } from '@/entities/onboarding';
import { getCareerLevels, getJobs, getSkills } from '@/features/onboarding';
import { useCommonApiErrorHandler } from '@/shared/api';

export function useMyPageEditReferenceData() {
  const handleCommonApiError = useCommonApiErrorHandler();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [careerLevels, setCareerLevels] = useState<CareerLevel[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [careerLoading, setCareerLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [careerError, setCareerError] = useState<string | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getJobs()
      .then((data) => {
        if (!mounted) return;
        setJobs(data.jobs);
      })
      .catch(async (error) => {
        if (!mounted) return;
        if (await handleCommonApiError(error)) return;
        setJobsError(error instanceof Error ? error.message : '직무 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!mounted) return;
        setJobsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [handleCommonApiError]);

  useEffect(() => {
    let mounted = true;
    getCareerLevels()
      .then((data) => {
        if (!mounted) return;
        setCareerLevels(data.career_levels);
      })
      .catch(async (error) => {
        if (!mounted) return;
        if (await handleCommonApiError(error)) return;
        setCareerError(error instanceof Error ? error.message : '경력 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!mounted) return;
        setCareerLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [handleCommonApiError]);

  useEffect(() => {
    let mounted = true;
    getSkills()
      .then((data) => {
        if (!mounted) return;
        setSkills(data.skills);
      })
      .catch(async (error) => {
        if (!mounted) return;
        if (await handleCommonApiError(error)) return;
        setSkillsError(error instanceof Error ? error.message : '기술 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!mounted) return;
        setSkillsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [handleCommonApiError]);

  return {
    jobs,
    careerLevels,
    skills,
    jobsLoading,
    careerLoading,
    skillsLoading,
    jobsError,
    careerError,
    skillsError,
  };
}
