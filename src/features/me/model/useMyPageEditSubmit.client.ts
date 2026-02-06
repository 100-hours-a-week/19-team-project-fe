'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { deleteProfileImage, updateUserMe } from '@/features/me';
import { createPresignedUrl, uploadToPresignedUrl } from '@/features/uploads';
import { useCommonApiErrorHandler } from '@/shared/api';
import { useToast } from '@/shared/ui/toast';
import type { CareerLevel, Job, Skill } from '@/entities/onboarding';

const updateErrorMessages: Record<string, string> = {
  CAREER_LEVEL_NOT_FOUND: '선택한 경력이 올바르지 않습니다.',
  JOB_NOT_FOUND: '선택한 직무가 올바르지 않습니다.',
  JOB_DUPLICATE: '직무가 중복되었습니다.',
  JOB_IDS_EMPTY: '직무를 선택해 주세요.',
  SKILL_NOT_FOUND: '선택한 기술스택이 올바르지 않습니다.',
  SKILL_DUPLICATE: '기술스택이 중복되었습니다.',
  SKILL_IDS_EMPTY: '기술스택을 선택해 주세요.',
  SKILL_DISPLAY_ORDER_REQUIRED: '기술스택 순서를 확인해 주세요.',
  IMAGE_URL_INVALID: '이미지 URL이 올바르지 않습니다.',
  UPLOAD_FAILED: '이미지 업로드에 실패했습니다.',
};

type UseMyPageEditSubmitParams = {
  authStatus: 'checking' | 'authed' | 'guest';
  nickname: string;
  introduction: string;
  selectedJob: Job | null;
  selectedCareer: CareerLevel | null;
  selectedTech: Skill[];
  initialNickname: string;
  initialIntroduction: string;
  initialJobId: number | null;
  initialCareerId: number | null;
  initialSkillIds: number[];
  checkedNickname: string | null;
  profileImageReset: boolean;
  profileImageFile: File | null;
  profileImageUrl: string | null;
  setProfileImageUrl: (value: string | null) => void;
  setSubmitError: (message: string | null) => void;
};

export function useMyPageEditSubmit({
  authStatus,
  nickname,
  introduction,
  selectedJob,
  selectedCareer,
  selectedTech,
  initialNickname,
  initialIntroduction,
  initialJobId,
  initialCareerId,
  initialSkillIds,
  checkedNickname,
  profileImageReset,
  profileImageFile,
  profileImageUrl,
  setProfileImageUrl,
  setSubmitError,
}: UseMyPageEditSubmitParams) {
  const router = useRouter();
  const handleCommonApiError = useCommonApiErrorHandler();
  const { pushToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleSubmit = async (nicknameLimit: number) => {
    if (isSubmitting) return;
    if (authStatus !== 'authed') return;

    const trimmed = nickname.trim();
    if (!trimmed) {
      setSubmitError('닉네임을 입력해 주세요.');
      return;
    }
    if (trimmed.length > nicknameLimit) {
      setSubmitError('닉네임이 너무 길어요.');
      return;
    }
    if (!selectedJob || !selectedCareer || selectedTech.length === 0) {
      setSubmitError('직무, 경력, 기술 스택을 모두 선택해 주세요.');
      return;
    }

    const normalizedSkillIds = selectedTech.map((skill) => skill.id);
    const normalizedSkills = selectedTech.map((skill, index) => ({
      skill_id: skill.id,
      display_order: index + 1,
    }));
    const hasProfileChanges =
      trimmed !== initialNickname ||
      introduction !== initialIntroduction ||
      selectedCareer.id !== initialCareerId ||
      selectedJob.id !== initialJobId ||
      normalizedSkillIds.length !== initialSkillIds.length ||
      normalizedSkillIds.some((id) => !initialSkillIds.includes(id)) ||
      profileImageReset ||
      profileImageFile !== null;

    if (!hasProfileChanges) {
      pushToast('변경 사항이 없습니다.', { variant: 'warning' });
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (trimmed !== initialNickname && checkedNickname !== trimmed) {
        setSubmitError('닉네임 중복 확인을 진행해 주세요.');
        return;
      }

      let uploadedImageUrl = profileImageUrl;
      if (profileImageFile) {
        setIsUploadingImage(true);
        const { presignedUrl, fileUrl } = await createPresignedUrl({
          target_type: 'PROFILE_IMAGE',
          file_name: profileImageFile.name,
          file_size: profileImageFile.size,
        });
        await uploadToPresignedUrl(profileImageFile, presignedUrl);
        uploadedImageUrl = fileUrl;
        setIsUploadingImage(false);
        setProfileImageUrl(fileUrl);
      }

      if (profileImageReset) {
        await deleteProfileImage();
        uploadedImageUrl = null;
        setProfileImageUrl(null);
      }

      await updateUserMe({
        nickname: trimmed,
        introduction: introduction.trim(),
        career_level_id: selectedCareer.id,
        job_ids: [selectedJob.id],
        skills: normalizedSkills,
        profile_image_url: uploadedImageUrl,
      });

      router.replace('/me');
    } catch (error: unknown) {
      if (await handleCommonApiError(error)) return;
      if (error instanceof Error) {
        setSubmitError(updateErrorMessages[error.message] ?? error.message);
      } else {
        setSubmitError('프로필 수정에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  return { isSubmitting, isUploadingImage, handleSubmit };
}
