import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getMe } from '@/features/auth';
import type { Skill } from '@/entities/onboarding';
import { useAuthGate } from '@/features/auth';
import { useMyPageEditForm } from './useMyPageEditForm.client';
import { useMyPageEditReferenceData } from './useMyPageEditReferenceData.client';
import { useMyPageEditProfileImage } from './useMyPageEditProfileImage.client';
import { useMyPageEditLoader } from './useMyPageEditLoader.client';
import { useMyPageEditNicknameCheck } from './useMyPageEditNicknameCheck.client';
import { useMyPageEditSubmit } from './useMyPageEditSubmit.client';

const nicknameLimit = 10;
const introductionLimit = 100;
const profileImageMaxBytes = 10 * 1024 * 1024;

export function useMyPageEdit() {
  const router = useRouter();
  const { status: authStatus } = useAuthGate(getMe);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useMyPageEditForm();
  const reference = useMyPageEditReferenceData();
  const profile = useMyPageEditProfileImage({
    maxBytes: profileImageMaxBytes,
    onError: setSubmitError,
  });
  const nicknameCheck = useMyPageEditNicknameCheck(nicknameLimit);
  const loader = useMyPageEditLoader({
    authStatus,
    setNickname: form.setNickname,
    setIntroduction: form.setIntroduction,
    setSelectedJob: form.setSelectedJob,
    setSelectedCareer: form.setSelectedCareer,
    setSelectedTech: form.setSelectedTech,
    setProfileImageUrl: profile.setProfileImageUrl,
    setProfileImageReset: profile.setProfileImageReset,
    onError: setSubmitError,
  });
  const submit = useMyPageEditSubmit({
    authStatus,
    nickname: form.nickname,
    introduction: form.introduction,
    selectedJob: form.selectedJob,
    selectedCareer: form.selectedCareer,
    selectedTech: form.selectedTech,
    initialNickname: loader.initialNickname,
    initialIntroduction: loader.initialIntroduction,
    initialJobId: loader.initialJobId,
    initialCareerId: loader.initialCareerId,
    initialSkillIds: loader.initialSkillIds,
    checkedNickname: nicknameCheck.checkedNickname,
    profileImageReset: profile.profileImageReset,
    profileImageFile: profile.profileImageFile,
    profileImageUrl: profile.profileImageUrl,
    setProfileImageUrl: profile.setProfileImageUrl,
    setSubmitError,
  });

  useEffect(() => {
    if (authStatus === 'guest') {
      router.replace('/me');
    }
  }, [authStatus, router]);

  const filteredTech = useMemo(() => {
    const query = form.techQuery.trim();
    const list = reference.skills;
    if (!query) return list;
    return list.filter((item: Skill) => item.name.toLowerCase().includes(query.toLowerCase()));
  }, [form.techQuery, reference.skills]);

  const isNicknameCheckDisabled =
    nicknameCheck.isNicknameChecking ||
    form.nickname.trim().length === 0 ||
    form.nickname.trim().length >= nicknameLimit;

  const isSubmitDisabled =
    submit.isSubmitting ||
    !form.selectedJob ||
    !form.selectedCareer ||
    form.selectedTech.length === 0 ||
    !form.nickname.trim();

  return {
    authStatus,
    activeSheet: form.activeSheet,
    setActiveSheet: form.setActiveSheet,
    jobs: reference.jobs,
    careerLevels: reference.careerLevels,
    skills: reference.skills,
    jobsLoading: reference.jobsLoading,
    careerLoading: reference.careerLoading,
    skillsLoading: reference.skillsLoading,
    jobsError: reference.jobsError,
    careerError: reference.careerError,
    skillsError: reference.skillsError,
    techLimitMessage: form.techLimitMessage,
    nickname: form.nickname,
    setNickname: form.setNickname,
    introduction: form.introduction,
    setIntroduction: form.setIntroduction,
    selectedJob: form.selectedJob,
    setSelectedJob: form.setSelectedJob,
    selectedCareer: form.selectedCareer,
    setSelectedCareer: form.setSelectedCareer,
    selectedTech: form.selectedTech,
    setSelectedTech: form.setSelectedTech,
    techQuery: form.techQuery,
    setTechQuery: form.setTechQuery,
    profileImageUrl: profile.profileImageUrl,
    profileImagePreview: profile.profileImagePreview,
    profileImageReset: profile.profileImageReset,
    nicknameCheckMessage: nicknameCheck.nicknameCheckMessage,
    isNicknameChecking: nicknameCheck.isNicknameChecking,
    isSubmitting: submit.isSubmitting,
    isUploadingImage: submit.isUploadingImage,
    submitError,
    fileInputRef: profile.fileInputRef,
    filteredTech,
    isNicknameCheckDisabled,
    isSubmitDisabled,
    nicknameLimit,
    introductionLimit,
    profileImageMaxBytes,
    handleProfileImageChange: profile.handleProfileImageChange,
    handleProfileImageReset: profile.handleProfileImageReset,
    handleNicknameCheck: () =>
      nicknameCheck.handleNicknameCheck(form.nickname, loader.initialNickname),
    handleTechToggle: form.handleTechToggle,
    handleSubmit: () => submit.handleSubmit(nicknameLimit),
  };
}
