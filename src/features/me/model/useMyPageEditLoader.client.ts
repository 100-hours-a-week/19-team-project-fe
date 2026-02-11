'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useUserMeQuery } from '@/entities/user';
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
  const { data: userData, error: userError } = useUserMeQuery({
    enabled: authStatus === 'authed',
  });

  useEffect(() => {
    if (authStatus !== 'authed') return;
    if (!userData) return;
    setNickname(userData.nickname ?? '');
    setInitialNickname(userData.nickname ?? '');
    setIntroduction(userData.introduction ?? '');
    setInitialIntroduction(userData.introduction ?? '');
    setSelectedJob(userData.jobs[0] ?? null);
    setInitialJobId(userData.jobs[0]?.id ?? null);
    setSelectedCareer(userData.career_level ?? null);
    setInitialCareerId(userData.career_level?.id ?? null);
    setSelectedTech(userData.skills ?? []);
    setInitialSkillIds(userData.skills.map((skill) => skill.id));
    setProfileImageUrl(userData.profile_image_url ?? null);
    setProfileImageReset(false);
  }, [
    authStatus,
    userData,
    setIntroduction,
    setNickname,
    setProfileImageReset,
    setProfileImageUrl,
    setSelectedCareer,
    setSelectedJob,
    setSelectedTech,
  ]);

  useEffect(() => {
    if (authStatus !== 'authed') return;
    if (userData === null) {
      router.replace('/me');
    }
  }, [authStatus, router, userData]);

  useEffect(() => {
    if (!userError) return;
    (async () => {
      if (await handleCommonApiError(userError)) return;
      onError(userError instanceof Error ? userError.message : '내 정보를 불러오지 못했습니다.');
    })();
  }, [handleCommonApiError, onError, userError]);

  return {
    initialNickname,
    initialIntroduction,
    initialJobId,
    initialCareerId,
    initialSkillIds,
  };
}
