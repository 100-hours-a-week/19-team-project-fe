'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getUserMe } from '@/features/me';
import { useCommonApiErrorHandler } from '@/shared/api';
import type { CareerLevel, Job, Skill } from '@/entities/onboarding';

type UseMyPageEditLoaderParams = {
  authStatus: 'checking' | 'authed' | 'guest';
  setNickname: (value: string) => void;
  setIntroduction: (value: string) => void;
  setSelectedJob: (value: Job | null) => void;
  setSelectedCareer: (value: CareerLevel | null) => void;
  setSelectedTech: (value: Skill[]) => void;
  setProfileImageUrl: (value: string | null) => void;
  setProfileImageReset: (value: boolean) => void;
  onError: (message: string) => void;
};

export function useMyPageEditLoader({
  authStatus,
  setNickname,
  setIntroduction,
  setSelectedJob,
  setSelectedCareer,
  setSelectedTech,
  setProfileImageUrl,
  setProfileImageReset,
  onError,
}: UseMyPageEditLoaderParams) {
  const router = useRouter();
  const handleCommonApiError = useCommonApiErrorHandler();
  const [initialNickname, setInitialNickname] = useState('');
  const [initialIntroduction, setInitialIntroduction] = useState('');
  const [initialJobId, setInitialJobId] = useState<number | null>(null);
  const [initialCareerId, setInitialCareerId] = useState<number | null>(null);
  const [initialSkillIds, setInitialSkillIds] = useState<number[]>([]);

  useEffect(() => {
    if (authStatus !== 'authed') return;
    let mounted = true;
    getUserMe()
      .then((data) => {
        if (!mounted) return;
        if (!data) {
          router.replace('/me');
          return;
        }
        setNickname(data.nickname ?? '');
        setInitialNickname(data.nickname ?? '');
        setIntroduction(data.introduction ?? '');
        setInitialIntroduction(data.introduction ?? '');
        setSelectedJob(data.jobs[0] ?? null);
        setInitialJobId(data.jobs[0]?.id ?? null);
        setSelectedCareer(data.career_level ?? null);
        setInitialCareerId(data.career_level?.id ?? null);
        setSelectedTech(data.skills ?? []);
        setInitialSkillIds(data.skills.map((skill) => skill.id));
        setProfileImageUrl(data.profile_image_url ?? null);
        setProfileImageReset(false);
      })
      .catch(async (error) => {
        if (!mounted) return;
        if (await handleCommonApiError(error)) return;
        onError(error instanceof Error ? error.message : '내 정보를 불러오지 못했습니다.');
      });

    return () => {
      mounted = false;
    };
  }, [
    authStatus,
    handleCommonApiError,
    onError,
    router,
    setIntroduction,
    setNickname,
    setProfileImageReset,
    setProfileImageUrl,
    setSelectedCareer,
    setSelectedJob,
    setSelectedTech,
  ]);

  return {
    initialNickname,
    initialIntroduction,
    initialJobId,
    initialCareerId,
    initialSkillIds,
  };
}
