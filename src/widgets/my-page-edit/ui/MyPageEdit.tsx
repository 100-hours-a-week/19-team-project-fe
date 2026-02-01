'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { getMe } from '@/features/auth';
import { getUserMe, updateUserMe } from '@/features/users';
import { createPresignedUrl, uploadToPresignedUrl } from '@/features/uploads';
import { getCareerLevels, getJobs, getSkills } from '@/features/onboarding';
import type { CareerLevel, Job, Skill } from '@/entities/onboarding';
import { checkNickname } from '@/features/onboarding';
import { useAuthGate } from '@/shared/lib/useAuthGate';
import { useCommonApiErrorHandler } from '@/shared/api';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Input } from '@/shared/ui/input';
import iconCareer from '@/shared/icons/icon_career.png';
import iconJob from '@/shared/icons/Icon_job.png';
import iconTech from '@/shared/icons/Icon_tech.png';
import iconMark from '@/shared/icons/icon-mark.png';
import defaultUserImage from '@/shared/icons/char_icon.png';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';
import { Button } from '@/shared/ui/button';

const nicknameLimit = 10;
const introductionLimit = 100;

type SheetId = 'job' | 'career' | 'tech' | null;

const nicknameValidationMessages: Record<string, string> = {
  NICKNAME_EMPTY: '닉네임을 입력해 주세요.',
  NICKNAME_TOO_SHORT: '닉네임이 너무 짧아요.',
  NICKNAME_TOO_LONG: '닉네임이 너무 길어요.',
  NICKNAME_INVALID_CHARACTERS: '닉네임에 사용할 수 없는 문자가 포함되어 있어요.',
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

export default function MyPageEdit() {
  const router = useRouter();
  const { status: authStatus } = useAuthGate(getMe);
  const handleCommonApiError = useCommonApiErrorHandler();

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
      })
      .catch(async (error) => {
        if (!mounted) return;
        if (await handleCommonApiError(error)) return;
        setSubmitError(error instanceof Error ? error.message : '내 정보를 불러오지 못했습니다.');
      });

    return () => {
      mounted = false;
    };
  }, [authStatus, handleCommonApiError]);

  useEffect(() => {
    const trimmed = nickname.trim();
    if (checkedNickname && trimmed !== checkedNickname) {
      setCheckedNickname(null);
      setNicknameCheckMessage(null);
    }
  }, [checkedNickname, nickname]);

  useEffect(() => {
    if (!profileImagePreview) return;
    return () => {
      URL.revokeObjectURL(profileImagePreview);
    };
  }, [profileImagePreview]);

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setProfileImageFile(file);
    setProfileImagePreview(previewUrl);
    event.target.value = '';
  };

  const filteredSkills = useMemo(() => {
    const query = techQuery.trim().toLowerCase();
    if (!query) return skills;
    return skills.filter((skill) => skill.name.toLowerCase().includes(query));
  }, [skills, techQuery]);

  const handleNicknameCheck = async () => {
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
      setCheckedNickname(trimmed);
      setNicknameCheckMessage({ tone: 'success', text: '현재 사용 중인 닉네임입니다.' });
      return;
    }

    setIsNicknameChecking(true);
    try {
      const result = await checkNickname(trimmed);
      if (result.available) {
        setCheckedNickname(trimmed);
        setNicknameCheckMessage({ tone: 'success', text: '사용 가능한 닉네임입니다.' });
      } else {
        setCheckedNickname(null);
        setNicknameCheckMessage({ tone: 'error', text: '이미 사용 중인 닉네임입니다.' });
      }
    } catch (error) {
      if (await handleCommonApiError(error)) return;
      if (error instanceof Error) {
        setNicknameCheckMessage({
          tone: 'error',
          text: nicknameValidationMessages[error.message] ?? '닉네임 확인에 실패했습니다.',
        });
      } else {
        setNicknameCheckMessage({ tone: 'error', text: '닉네임 확인에 실패했습니다.' });
      }
    } finally {
      setIsNicknameChecking(false);
    }
  };

  const handleTechToggle = (skill: Skill) => {
    setSelectedTech((prev) => {
      const exists = prev.some((item) => item.id === skill.id);
      if (exists) {
        setTechLimitMessage(null);
        return prev.filter((item) => item.id !== skill.id);
      }
      if (prev.length >= 5) {
        setTechLimitMessage('기술스택은 최대 5개까지 선택할 수 있어요.');
        return prev;
      }
      setTechLimitMessage(null);
      return [...prev, skill];
    });
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    const trimmed = nickname.trim();

    if (!trimmed) {
      setSubmitError('닉네임을 입력해 주세요.');
      return;
    }
    if (!selectedJob) {
      setSubmitError('직무를 선택해 주세요.');
      return;
    }
    if (!selectedCareer) {
      setSubmitError('경력을 선택해 주세요.');
      return;
    }
    if (selectedTech.length === 0) {
      setSubmitError('기술스택을 선택해 주세요.');
      return;
    }
    if (trimmed !== initialNickname) {
      if (!checkedNickname || checkedNickname !== trimmed) {
        setSubmitError('닉네임 중복 확인을 완료해 주세요.');
        return;
      }
    }

    const normalizedSkillIds = selectedTech.map((skill) => skill.id);
    const isSkillChanged =
      normalizedSkillIds.length !== initialSkillIds.length ||
      normalizedSkillIds.some((id) => !initialSkillIds.includes(id));

    const payload: {
      nickname?: string;
      introduction?: string;
      profile_image_url?: string;
      career_level_id?: number;
      job_ids?: number[];
      skills?: Array<{ skill_id: number; display_order: number }>;
    } = {};

    if (trimmed !== initialNickname) {
      payload.nickname = trimmed;
    }
    if (introduction !== initialIntroduction) {
      payload.introduction = introduction;
    }
    if (selectedCareer.id !== initialCareerId) {
      payload.career_level_id = selectedCareer.id;
    }
    if (selectedJob.id !== initialJobId) {
      payload.job_ids = [selectedJob.id];
    }
    if (isSkillChanged) {
      payload.skills = selectedTech.map((skill, index) => ({
        skill_id: skill.id,
        display_order: index + 1,
      }));
    }

    const hasProfileImageChange = !!profileImageFile;

    if (Object.keys(payload).length === 0 && !hasProfileImageChange) {
      setSubmitError('변경된 내용이 없습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (hasProfileImageChange && profileImageFile) {
        setIsUploadingImage(true);
        const { presignedUrl, fileUrl } = await createPresignedUrl({
          target_type: 'PROFILE_IMAGE',
          file_name: profileImageFile.name,
        });
        await uploadToPresignedUrl(profileImageFile, presignedUrl);
        payload.profile_image_url = fileUrl;
      }
      await updateUserMe(payload);
      router.replace('/me');
    } catch (error) {
      if (await handleCommonApiError(error)) {
        setIsSubmitting(false);
        return;
      }
      if (error instanceof Error) {
        setSubmitError(updateErrorMessages[error.message] ?? error.message);
      } else {
        setSubmitError('수정에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsUploadingImage(false);
      setIsSubmitting(false);
    }
  };

  const selectedTechIds = new Set(selectedTech.map((tech) => tech.id));

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <Header />

      <section className="px-4 pt-6 pb-[calc(var(--app-footer-height)+16px)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('nav-direction', 'back');
              router.back();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm"
            aria-label="뒤로 가기"
          >
            <svg
              data-slot="icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <div className="text-base font-semibold text-black">프로필 이미지</div>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-neutral-100">
                <Image
                  src={profileImagePreview ?? profileImageUrl ?? defaultUserImage}
                  alt="프로필 이미지"
                  width={80}
                  height={80}
                  unoptimized={!!profileImagePreview || !!profileImageUrl}
                  className="h-20 w-20 object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || isUploadingImage}
                  className="rounded-full border border-neutral-300 px-2.5 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-60"
                >
                  {profileImagePreview ? '다른 이미지 선택' : '이미지 업로드'}
                </button>
                <p className="text-xs text-text-caption">jpg/png 권장</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileImageChange}
            />
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <div className="text-base font-semibold text-black">닉네임</div>
            <Input.Root className="mt-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input.Field
                    placeholder="닉네임을 입력해 주세요"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    maxLength={nicknameLimit}
                    className="rounded-none border-0 border-b-2 border-black bg-transparent px-0 py-2 pr-14 text-base text-black shadow-none focus:border-black focus:ring-0 disabled:border-black disabled:bg-transparent"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-caption leading-tight">
                    {nickname.length} / {nicknameLimit}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNicknameCheck}
                  disabled={isNicknameChecking || nickname.trim().length === 0}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-neutral-400 enabled:border-[var(--color-primary-main)] enabled:bg-[var(--color-primary-main)] enabled:text-white"
                >
                  <svg
                    data-slot="icon"
                    fill="none"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </button>
              </div>
              {nicknameCheckMessage ? (
                <p
                  className={`mt-1 text-xs leading-tight ${
                    nicknameCheckMessage.tone === 'success' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {nicknameCheckMessage.text}
                </p>
              ) : null}
            </Input.Root>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setActiveSheet('job')}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-3">
                <Image src={iconJob} alt="직무" width={40} height={40} />
                <div className="text-left">
                  <span className="text-base font-semibold text-text-body">직무</span>
                  <p className="mt-1 text-xs text-text-caption">
                    {selectedJob?.name || '직무를 선택해 주세요'}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                {selectedJob ? (
                  <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
                    {selectedJob.name}
                  </span>
                ) : null}
                <span className="text-xl text-gray-300">›</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet('career')}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-3">
                <Image src={iconCareer} alt="경력" width={40} height={40} />
                <div className="text-left">
                  <span className="text-base font-semibold text-text-body">경력</span>
                  <p className="mt-1 text-xs text-text-caption">
                    {selectedCareer?.level || '경력을 선택해 주세요'}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                {selectedCareer ? (
                  <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
                    {selectedCareer.level}
                  </span>
                ) : null}
                <span className="text-xl text-gray-300">›</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet('tech')}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-3">
                <Image src={iconTech} alt="기술스택" width={40} height={40} />
                <div className="text-left">
                  <span className="text-base font-semibold text-text-body">기술스택</span>
                  <p className="mt-1 text-xs text-text-caption">기술을 선택해 주세요</p>
                </div>
              </div>
              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                {selectedTech.map((tech) => (
                  <span
                    key={tech.id}
                    className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]"
                  >
                    {tech.name}
                  </span>
                ))}
                <span className="text-xl text-gray-300">›</span>
              </div>
            </button>
          </div>

          <div className="rounded-3xl bg-white px-4 py-5 shadow-sm">
            <p className="text-base font-semibold text-text-title">자기 소개</p>
            <textarea
              className="mt-3 h-28 w-full resize-none text-base text-text-body placeholder:text-gray-400 focus:outline-none"
              placeholder="자기 소개를 입력해 주세요"
              value={introduction}
              onChange={(event) => setIntroduction(event.target.value)}
              maxLength={introductionLimit}
            />
            <p className="mt-2 text-right text-xs text-text-caption">
              {introduction.length} / {introductionLimit}
            </p>
          </div>

          {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploadingImage}
            icon={<Image src={iconMark} alt="" width={20} height={20} />}
            className="rounded-2xl py-4 text-base font-semibold"
          >
            {isSubmitting || isUploadingImage ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </section>

      <div className="mt-auto">
        <Footer />
      </div>

      <BottomSheet open={activeSheet !== null} title="선택" onClose={() => setActiveSheet(null)}>
        <div className="flex h-full flex-col gap-4">
          {activeSheet === 'job' ? (
            <div className="flex flex-col gap-2">
              {jobsLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
              {jobsError ? <p className="text-sm text-red-500">{jobsError}</p> : null}
              {!jobsLoading && !jobsError ? (
                <div className="flex flex-col gap-2">
                  {jobs.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedJob(item);
                        setActiveSheet(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl px-2.5 py-3 text-left transition ${
                        selectedJob?.id === item.id
                          ? 'border border-primary-main bg-primary-main/10'
                          : 'border border-gray-100 bg-white'
                      }`}
                    >
                      <span className="text-sm font-semibold text-text-body">{item.name}</span>
                      {selectedJob?.id === item.id ? (
                        <span className="text-xs text-primary-main">선택됨</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {activeSheet === 'career' ? (
            <div className="flex flex-col gap-2">
              {careerLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
              {careerError ? <p className="text-sm text-red-500">{careerError}</p> : null}
              {!careerLoading && !careerError ? (
                <div className="flex flex-col gap-2">
                  {careerLevels.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedCareer(item);
                        setActiveSheet(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl px-2.5 py-3 text-left transition ${
                        selectedCareer?.id === item.id
                          ? 'border border-primary-main bg-primary-main/10'
                          : 'border border-gray-100 bg-white'
                      }`}
                    >
                      <span className="text-sm font-semibold text-text-body">{item.level}</span>
                      {selectedCareer?.id === item.id ? (
                        <span className="text-xs text-primary-main">선택됨</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {activeSheet === 'tech' ? (
            <div className="flex h-full flex-col gap-3">
              <input
                className="rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:outline-none"
                placeholder="기술을 검색해 주세요"
                value={techQuery}
                onChange={(event) => setTechQuery(event.target.value)}
              />
              {skillsLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
              {skillsError ? <p className="text-sm text-red-500">{skillsError}</p> : null}
              {techLimitMessage ? <p className="text-xs text-red-500">{techLimitMessage}</p> : null}
              {!skillsLoading && !skillsError ? (
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {filteredSkills.map((item) => {
                    const isSelected = selectedTechIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTechToggle(item)}
                        className={`flex w-full items-center justify-between rounded-2xl px-2.5 py-3 text-left transition ${
                          isSelected
                            ? 'border border-primary-main bg-primary-main/10'
                            : 'border border-gray-100 bg-white'
                        }`}
                      >
                        <span className="text-sm font-semibold text-text-body">{item.name}</span>
                        {isSelected ? (
                          <span className="text-xs text-primary-main">선택됨</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </BottomSheet>
    </div>
  );
}
