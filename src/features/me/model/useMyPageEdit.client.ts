import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getMe } from '@/features/auth';
import { deleteProfileImage, getUserMe, updateUserMe } from '@/features/me';
import { createPresignedUrl, uploadToPresignedUrl } from '@/features/uploads';
import { checkNickname, getCareerLevels, getJobs, getSkills } from '@/features/onboarding';
import type { CareerLevel, Job, Skill } from '@/entities/onboarding';
import { useAuthGate } from '@/shared/lib/useAuthGate';
import { useCommonApiErrorHandler } from '@/shared/api';
import { useToast } from '@/shared/ui/toast';

const nicknameLimit = 10;
const introductionLimit = 100;
const profileImageMaxBytes = 10 * 1024 * 1024;

export type SheetId = 'job' | 'career' | 'tech' | null;

const nicknameValidationMessages: Record<string, string> = {
  NICKNAME_EMPTY: '닉네임을 입력해 주세요.',
  NICKNAME_TOO_SHORT: '닉네임이 너무 짧아요.',
  NICKNAME_TOO_LONG: '닉네임이 너무 길어요.',
  NICKNAME_INVALID_CHARACTERS: '특수 문자/이모지는 사용할 수 없어요.',
  NICKNAME_CONTAINS_WHITESPACE: '닉네임에 공백을 포함할 수 없어요.',
  NICKNAME_DUPLICATE: '이미 사용 중인 닉네임입니다.',
};

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

export function useMyPageEdit() {
  const router = useRouter();
  const { status: authStatus } = useAuthGate(getMe);
  const handleCommonApiError = useCommonApiErrorHandler();
  const { pushToast } = useToast();

  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [careerLevels, setCareerLevels] = useState<CareerLevel[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [careerLoading, setCareerLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [careerError, setCareerError] = useState<string | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [techLimitMessage, setTechLimitMessage] = useState<string | null>(null);

  const [nickname, setNickname] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerLevel | null>(null);
  const [selectedTech, setSelectedTech] = useState<Skill[]>([]);
  const [techQuery, setTechQuery] = useState('');

  const [initialNickname, setInitialNickname] = useState('');
  const [initialIntroduction, setInitialIntroduction] = useState('');
  const [initialJobId, setInitialJobId] = useState<number | null>(null);
  const [initialCareerId, setInitialCareerId] = useState<number | null>(null);
  const [initialSkillIds, setInitialSkillIds] = useState<number[]>([]);
  const [profileImageReset, setProfileImageReset] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [checkedNickname, setCheckedNickname] = useState<string | null>(null);
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isNicknameChecking, setIsNicknameChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (authStatus === 'guest') {
      router.replace('/me');
    }
  }, [authStatus, router]);

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
        setSubmitError(error instanceof Error ? error.message : '내 정보를 불러오지 못했습니다.');
      });

    return () => {
      mounted = false;
    };
  }, [authStatus, handleCommonApiError, router]);

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file) return;
    if (file.size > profileImageMaxBytes) {
      setSubmitError('프로필 이미지는 10MB 이하만 업로드할 수 있습니다.');
      return;
    }
    const preview = URL.createObjectURL(file);
    setProfileImageFile(file);
    setProfileImagePreview(preview);
    setProfileImageReset(false);
  };

  const handleProfileImageReset = () => {
    setProfileImageReset(true);
    setProfileImageFile(null);
    setProfileImagePreview(null);
  };

  const handleNicknameCheck = async () => {
    if (isNicknameChecking) return;
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameCheckMessage({ tone: 'error', text: '닉네임을 입력해 주세요.' });
      return;
    }
    if (trimmed.length > nicknameLimit) {
      setNicknameCheckMessage({ tone: 'error', text: '닉네임이 너무 길어요.' });
      return;
    }
    if (trimmed === initialNickname) {
      setNicknameCheckMessage({ tone: 'success', text: '현재 닉네임이에요.' });
      return;
    }

    setIsNicknameChecking(true);
    setNicknameCheckMessage(null);
    try {
      await checkNickname(trimmed);
      setCheckedNickname(trimmed);
      setNicknameCheckMessage({ tone: 'success', text: '사용 가능한 닉네임이에요.' });
    } catch (error: unknown) {
      if (await handleCommonApiError(error)) return;
      if (error instanceof Error) {
        const errorCode = 'code' in error ? String((error as { code?: string }).code ?? '') : '';
        setNicknameCheckMessage({
          tone: 'error',
          text: nicknameValidationMessages[errorCode] ?? '닉네임 확인에 실패했습니다.',
        });
      } else {
        setNicknameCheckMessage({ tone: 'error', text: '닉네임 확인에 실패했습니다.' });
      }
    } finally {
      setIsNicknameChecking(false);
    }
  };

  const handleTechToggle = (skill: Skill) => {
    const exists = selectedTech.some((item) => item.id === skill.id);
    const next = exists
      ? selectedTech.filter((item) => item.id !== skill.id)
      : [...selectedTech, skill];

    if (next.length > 5) {
      setTechLimitMessage('기술 스택은 최대 5개까지 선택할 수 있어요.');
      return;
    }

    setTechLimitMessage(null);
    setSelectedTech(next);
  };

  const handleSubmit = async () => {
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
      }

      if (profileImageReset) {
        await deleteProfileImage();
        uploadedImageUrl = null;
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

  const filteredTech = useMemo(
    () =>
      skills.filter((item) =>
        techQuery.trim() ? item.name.toLowerCase().includes(techQuery.trim().toLowerCase()) : true,
      ),
    [skills, techQuery],
  );

  const isNicknameCheckDisabled =
    isNicknameChecking || nickname.trim().length === 0 || nickname.trim().length >= nicknameLimit;

  const isSubmitDisabled =
    isSubmitting ||
    !selectedJob ||
    !selectedCareer ||
    selectedTech.length === 0 ||
    !nickname.trim();

  return {
    authStatus,
    activeSheet,
    setActiveSheet,
    jobs,
    careerLevels,
    skills,
    jobsLoading,
    careerLoading,
    skillsLoading,
    jobsError,
    careerError,
    skillsError,
    techLimitMessage,
    nickname,
    setNickname,
    introduction,
    setIntroduction,
    selectedJob,
    setSelectedJob,
    selectedCareer,
    setSelectedCareer,
    selectedTech,
    setSelectedTech,
    techQuery,
    setTechQuery,
    profileImageUrl,
    profileImagePreview,
    profileImageReset,
    nicknameCheckMessage,
    isNicknameChecking,
    isSubmitting,
    isUploadingImage,
    submitError,
    fileInputRef,
    filteredTech,
    isNicknameCheckDisabled,
    isSubmitDisabled,
    nicknameLimit,
    introductionLimit,
    profileImageMaxBytes,
    handleProfileImageChange,
    handleProfileImageReset,
    handleNicknameCheck,
    handleTechToggle,
    handleSubmit,
  };
}
