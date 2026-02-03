'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import type { CareerLevel, Job, Skill, UserType } from '@/entities/onboarding';
import {
  checkNickname,
  getCareerLevels,
  getJobs,
  getSkills,
  sendEmailVerification,
  signup,
  verifyEmailVerification,
} from '@/features/onboarding';
import {
  BusinessError,
  readAccessToken,
  setAuthCookies,
  useCommonApiErrorHandler,
} from '@/shared/api';
import iconMark from '@/shared/icons/icon-mark.png';
import iconMarkB from '@/shared/icons/icon-mark_B.png';
import iconCareer from '@/shared/icons/icon_career.png';
import iconJob from '@/shared/icons/Icon_job.png';
import iconTech from '@/shared/icons/Icon_tech.png';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { stompManager } from '@/shared/ws';

type RoleId = 'seeker' | 'expert';
type SheetId = 'job' | 'career' | 'tech' | null;

type OnboardingProfileFormProps = {
  role?: RoleId;
};

const nicknameLimit = 10;
const introductionLimit = 100;
const verificationCodeLength = 6;

const roleTitle: Record<RoleId, string> = {
  seeker: '구직자',
  expert: '현직자',
};

const signupErrorMessages: Record<string, string> = {
  SIGNUP_OAUTH_PROVIDER_INVALID: '소셜 로그인 제공자가 올바르지 않습니다.',
  SIGNUP_OAUTH_ID_EMPTY: '소셜 로그인 정보가 필요합니다.',
  NICKNAME_EMPTY: '닉네임을 입력해 주세요.',
  SIGNUP_USER_TYPE_INVALID: '유저 타입이 올바르지 않습니다.',
  CAREER_LEVEL_NOT_FOUND: '선택한 경력이 올바르지 않습니다.',
};

const defaultSignupErrorMessage = '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.';

const nicknameValidationMessages: Record<string, string> = {
  NICKNAME_EMPTY: '닉네임을 입력해 주세요.',
  NICKNAME_TOO_SHORT: '닉네임이 너무 짧아요.',
  NICKNAME_TOO_LONG: '닉네임이 너무 길어요.',
  NICKNAME_INVALID_CHARACTERS: '특수 문자/이모지는 사용할 수 없어요.',
  NICKNAME_CONTAINS_WHITESPACE: '닉네임에 공백을 포함할 수 없어요.',
};

const emailVerificationMessages: Record<string, string> = {
  VERIFICATION_CODE_INVALID: '인증번호 형식이 올바르지 않습니다.',
  VERIFICATION_CODE_MISMATCH: '인증번호가 일치하지 않습니다.',
  AUTH_UNAUTHORIZED: '인증 정보가 만료되었습니다. 다시 전송해 주세요.',
  VERIFICATION_CODE_EXPIRED: '인증 시간이 만료되었습니다. 다시 전송해 주세요.',
};

export default function OnboardingProfileForm({ role }: OnboardingProfileFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role')?.toLowerCase();
  const resolvedRole: RoleId =
    roleParam === 'expert' || roleParam === 'seeker' ? roleParam : (role ?? 'seeker');
  const isExpert = resolvedRole === 'expert';
  const displayRole = roleTitle[resolvedRole] ?? roleTitle.seeker;
  const [currentStep, setCurrentStep] = useState<0 | 1>(() => (isExpert ? 0 : 1));
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerLevel | null>(null);
  const [selectedTech, setSelectedTech] = useState<Skill[]>([]);
  const [techQuery, setTechQuery] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [techLimitMessage, setTechLimitMessage] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [careerLevels, setCareerLevels] = useState<CareerLevel[]>([]);
  const [careerLoading, setCareerLoading] = useState(true);
  const [careerError, setCareerError] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string[]>([]);
  const [lastSentEmail, setLastSentEmail] = useState<string | null>(null);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [sendVerificationMessage, setSendVerificationMessage] = useState<string | null>(null);
  const [sendVerificationError, setSendVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerificationFailSheetOpen, setIsVerificationFailSheetOpen] = useState(false);
  const [verificationExpiresAt, setVerificationExpiresAt] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [nickname, setNickname] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isNicknameChecking, setIsNicknameChecking] = useState(false);
  const [checkedNickname, setCheckedNickname] = useState<string | null>(null);
  const handleCommonApiError = useCommonApiErrorHandler();

  useEffect(() => {
    const trimmed = nickname.trim();
    if (checkedNickname && trimmed !== checkedNickname) {
      setCheckedNickname(null);
      setNicknameCheckMessage(null);
    }
  }, [checkedNickname, nickname]);

  useEffect(() => {
    let isMounted = true;
    getSkills()
      .then((data) => {
        if (!isMounted) return;
        setSkills(data.skills);
      })
      .catch(async (error: unknown) => {
        if (!isMounted) return;
        if (await handleCommonApiError(error)) return;
        setSkillsError(error instanceof Error ? error.message : '스킬 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!isMounted) return;
        setSkillsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [handleCommonApiError]);

  useEffect(() => {
    let isMounted = true;
    getJobs()
      .then((data) => {
        if (!isMounted) return;
        setJobs(data.jobs);
      })
      .catch(async (error: unknown) => {
        if (!isMounted) return;
        if (await handleCommonApiError(error)) return;
        setJobsError(error instanceof Error ? error.message : '직무 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!isMounted) return;
        setJobsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [handleCommonApiError]);

  useEffect(() => {
    let isMounted = true;
    getCareerLevels()
      .then((data) => {
        if (!isMounted) return;
        setCareerLevels(data.career_levels);
      })
      .catch(async (error: unknown) => {
        if (!isMounted) return;
        if (await handleCommonApiError(error)) return;
        setCareerError(error instanceof Error ? error.message : '경력 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!isMounted) return;
        setCareerLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [handleCommonApiError]);

  const filteredTech = useMemo(() => {
    const query = techQuery.trim().toLowerCase();
    if (!query) return skills;
    return skills.filter((item) => item.name.toLowerCase().includes(query));
  }, [skills, techQuery]);

  const toggleTech = (value: Skill) => {
    setSelectedTech((prev) => {
      if (prev.some((item) => item.id === value.id)) {
        setTechLimitMessage(null);
        return prev.filter((item) => item.id !== value.id);
      }
      if (prev.length >= 5) {
        setTechLimitMessage('기술스택은 최대 5개까지 선택할 수 있어요.');
        return prev;
      }
      setTechLimitMessage(null);
      return [...prev, value];
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!selectedJob || !selectedCareer || selectedTech.length === 0) {
      setSubmitError('직무, 경력, 기술스택을 모두 선택해 주세요.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const raw = sessionStorage.getItem('kakaoLoginResult');
      if (!raw) {
        setSubmitError('소셜 로그인 정보가 없습니다. 다시 로그인해 주세요.');
        return;
      }

      let oauthId = '';
      let fallbackNickname = '';
      let email = '';

      try {
        const parsed = JSON.parse(raw) as {
          signup_required?: {
            oauth_provider?: string;
            oauth_id?: string;
            email?: string | null;
            nickname?: string | null;
          };
        };
        const signupRequired = parsed.signup_required;
        if (signupRequired) {
          oauthId = signupRequired.oauth_id ?? '';
          fallbackNickname = signupRequired.nickname ?? '';
          email = signupRequired.email ?? '';
        }
      } catch {
        setSubmitError('로그인 정보 파싱에 실패했습니다. 다시 로그인해 주세요.');
        return;
      }

      const resolvedNickname = nickname.trim() || fallbackNickname;
      if (!oauthId) {
        setSubmitError('소셜 로그인 정보가 부족합니다. 다시 로그인해 주세요.');
        return;
      }
      if (!resolvedNickname) {
        setSubmitError('닉네임을 입력해 주세요.');
        return;
      }
      if (!email) {
        setSubmitError('이메일 정보가 없습니다. 다시 로그인해 주세요.');
        return;
      }
      const userType: UserType = isExpert ? 'EXPERT' : 'JOB_SEEKER';

      const signupPayload = {
        oauth_provider: 'KAKAO' as const,
        oauth_id: oauthId,
        email,
        company_email:
          isExpert && isVerified ? (lastSentEmail ?? verificationEmail.trim()) : undefined,
        nickname: resolvedNickname,
        user_type: userType,
        career_level_id: selectedCareer.id,
        job_ids: [selectedJob.id],
        skills: selectedTech.map((skill, index) => ({
          skill_id: skill.id,
          display_order: index + 1,
        })),
        introduction: introduction.trim(),
      };

      const signupResult = await signup({
        ...signupPayload,
      });
      setAuthCookies({
        accessToken: signupResult.accessToken,
        refreshToken: signupResult.refreshToken,
        userId: signupResult.userId,
      });
      sessionStorage.setItem('signupSuccess', 'true');
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (!wsUrl) {
          console.warn('[WS] NEXT_PUBLIC_WS_URL is missing');
        } else {
          const accessToken = readAccessToken();
          const connectHeaders = accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined;
          await stompManager.connect(wsUrl, { connectHeaders });
        }
      } catch (wsError) {
        console.warn('[WS] connect after signup failed', wsError);
      }
      router.replace('/');
    } catch (error: unknown) {
      if (await handleCommonApiError(error)) {
        return;
      }
      if (error instanceof BusinessError) {
        setSubmitError(
          signupErrorMessages[error.code] ?? error.message ?? defaultSignupErrorMessage,
        );
      } else if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError(defaultSignupErrorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNicknameCheck = async () => {
    if (isNicknameChecking) return;
    const trimmed = nickname.trim();

    setIsNicknameChecking(true);
    setNicknameCheckMessage(null);

    try {
      const data = await checkNickname(trimmed);
      setCheckedNickname(trimmed);
      if (data.available) {
        setNicknameCheckMessage({ tone: 'success', text: '사용 가능한 닉네임입니다.' });
      } else {
        setNicknameCheckMessage({ tone: 'error', text: '이미 사용 중인 닉네임입니다.' });
      }
    } catch (error: unknown) {
      if (await handleCommonApiError(error)) {
        return;
      }
      if (error instanceof BusinessError) {
        setNicknameCheckMessage({
          tone: 'error',
          text:
            nicknameValidationMessages[error.code] ??
            error.message ??
            '닉네임 확인에 실패했습니다.',
        });
      } else if (error instanceof Error) {
        setNicknameCheckMessage({ tone: 'error', text: error.message });
      } else {
        setNicknameCheckMessage({ tone: 'error', text: '닉네임 확인에 실패했습니다.' });
      }
    } finally {
      setIsNicknameChecking(false);
    }
  };

  const isNicknameCheckDisabled =
    isNicknameChecking || nickname.trim().length === 0 || nickname.trim().length >= nicknameLimit;

  const isSubmitDisabled =
    isSubmitting ||
    !selectedJob ||
    !selectedCareer ||
    selectedTech.length === 0 ||
    !nickname.trim();
  const isVerificationSubmitDisabled =
    !isVerificationVisible ||
    isVerifying ||
    isVerified ||
    verificationCode.join('').length !== verificationCodeLength ||
    !lastSentEmail ||
    remainingSeconds === 0;

  const handleSendVerification = () => {
    const trimmedEmail = verificationEmail.trim();
    if (!trimmedEmail) {
      setSendVerificationError('이메일을 입력해 주세요.');
      return;
    }
    if (isSendingVerification) return;

    setIsSendingVerification(true);
    setSendVerificationError(null);
    setSendVerificationMessage(null);
    setVerificationError(null);
    setIsVerified(false);
    sendEmailVerification({ email: trimmedEmail })
      .then((data) => {
        setLastSentEmail(trimmedEmail);
        const expiresAt = new Date(data.expires_at);
        setVerificationExpiresAt(expiresAt);
        setRemainingSeconds(Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)));
        setIsVerificationVisible(true);
        setSendVerificationMessage('인증번호를 전송했습니다.');
      })
      .catch(async (error: unknown) => {
        setIsVerificationFailSheetOpen(true);
        if (await handleCommonApiError(error)) {
          return;
        }
        if (error instanceof BusinessError) {
          setSendVerificationError(
            emailVerificationMessages[error.code] ??
              error.message ??
              '인증번호 전송에 실패했습니다.',
          );
        } else if (error instanceof Error) {
          setSendVerificationError(error.message);
        } else {
          setSendVerificationError('인증번호 전송에 실패했습니다.');
        }
      })
      .finally(() => {
        setIsSendingVerification(false);
      });
  };

  const handleKeypadPress = (value: string) => {
    setVerificationCode((prev) => {
      if (value === 'backspace') {
        return prev.slice(0, -1);
      }
      if (prev.length >= verificationCodeLength) return prev;
      return [...prev, value];
    });
  };

  useEffect(() => {
    if (!lastSentEmail) return;
    if (verificationEmail.trim() === lastSentEmail) return;
    setVerificationCode([]);
    setIsVerified(false);
    setVerificationError(null);
    setIsVerificationVisible(false);
    setVerificationExpiresAt(null);
    setRemainingSeconds(null);
  }, [lastSentEmail, verificationEmail]);

  useEffect(() => {
    if (!verificationExpiresAt || !isVerificationVisible) {
      return;
    }

    const tick = () => {
      const secondsLeft = Math.max(
        0,
        Math.floor((verificationExpiresAt.getTime() - Date.now()) / 1000),
      );
      setRemainingSeconds(secondsLeft);
      if (secondsLeft === 0) {
        setVerificationError('인증 시간이 만료되었습니다. 다시 전송해 주세요.');
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [verificationExpiresAt, isVerificationVisible]);

  const handleVerifySubmit = async () => {
    const code = verificationCode.join('');
    if (!isVerificationVisible || isVerifying || isVerified) return;
    if (code.length !== verificationCodeLength) return;
    if (!lastSentEmail) return;
    if (remainingSeconds === 0) {
      setVerificationError('인증 시간이 만료되었습니다. 다시 전송해 주세요.');
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setVerificationError('네트워크 오류가 발생했어요. 다시 시도해 주세요.');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    try {
      await verifyEmailVerification({ email: lastSentEmail, code });
      setIsVerified(true);
    } catch (error: unknown) {
      setIsVerificationFailSheetOpen(true);
      if (await handleCommonApiError(error)) {
        return;
      }
      if (error instanceof BusinessError) {
        setVerificationError(
          emailVerificationMessages[error.code] ?? error.message ?? '인증번호 확인에 실패했습니다.',
        );
      } else if (error instanceof Error) {
        setVerificationError(error.message);
      } else {
        setVerificationError('인증번호 확인에 실패했습니다.');
      }
      setVerificationCode([]);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!isExpert) return;
    if (!isVerified) return;
    setCurrentStep(1);
  }, [isExpert, isVerified]);

  const profileFormContent = (
    <>
      <div className="onboarding-form-stagger__item rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
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
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-caption">
                {nickname.length} / {nicknameLimit}
              </span>
            </div>
            <button
              type="button"
              onClick={handleNicknameCheck}
              disabled={isNicknameCheckDisabled}
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
              className={`mt-2 text-xs ${
                nicknameCheckMessage.tone === 'success' ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {nicknameCheckMessage.text}
            </p>
          ) : null}
        </Input.Root>
      </div>

      <div
        className={`onboarding-form-stagger__item flex flex-col gap-3 ${
          isExpert ? 'mt-2 mb-5' : 'mb-5'
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveSheet('job')}
          className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-3">
            <Image src={iconJob} alt="직무" width={40} height={40} />
            <div className="text-left">
              <span className="text-base font-semibold text-text-body">직무</span>
              <p className="mt-2 text-xs leading-relaxed text-text-caption">
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
              <p className="mt-2 text-xs leading-relaxed text-text-caption">
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
              <p className="mt-2 text-xs leading-relaxed text-text-caption">기술을 선택해 주세요</p>
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

      <div className="onboarding-form-stagger__item">
        <p className="text-base font-semibold text-text-title">자기 소개</p>
        <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
          <textarea
            className="h-28 w-full resize-none text-base text-text-body placeholder:text-gray-400 focus:outline-none"
            placeholder="Tell us everything..."
            value={introduction}
            onChange={(event) => setIntroduction(event.target.value)}
            maxLength={introductionLimit}
          />
          <p className="mt-2 text-right text-xs text-text-caption">
            {introduction.length}/{introductionLimit}
          </p>
        </div>
      </div>

      <div className="onboarding-form-stagger__item pt-6">
        {submitError ? <p className="mb-3 text-sm text-red-500">{submitError}</p> : null}
        <Button
          icon={<Image src={iconMark} alt="" width={20} height={20} />}
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
        >
          가입 완료
        </Button>
      </div>
    </>
  );

  return (
    <main className="flex min-h-screen flex-col bg-[#F7F7F7] px-2.5 pb-10 pt-4 text-text-body">
      <header className="relative flex items-center">
        <Link href="/onboarding" className="text-2xl text-neutral-700">
          ←
        </Link>
      </header>

      <section className="onboarding-form-stagger mt-10 flex flex-1 flex-col gap-6">
        <div className="onboarding-form-stagger__item">
          <div className="flex items-center gap-2">
            <Image src={iconMarkB} alt="" width={28} height={28} />
            <p className="text-2xl font-semibold text-text-title">환영합니다!</p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full border border-[#2b4b7e] px-3 py-1 text-xs font-semibold text-[#2b4b7e]">
              {displayRole}
            </span>
          </div>
        </div>

        {isExpert ? (
          <div className="onboarding-form-stagger__item">
            <div className="flex items-center gap-2">
              {['이메일 인증', '프로필 입력'].map((label, index) => {
                const stepIndex = index as 0 | 1;
                const isActive = currentStep === stepIndex;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setCurrentStep(stepIndex)}
                    className={`flex flex-1 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      isActive
                        ? 'border-[#2b4b7e] bg-[#edf4ff] text-[#2b4b7e]'
                        : 'border-gray-200 bg-white text-text-caption'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                        isActive ? 'bg-[#2b4b7e] text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {isExpert ? (
          <div className="relative overflow-hidden">
            <div
              className="flex w-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentStep * 100}%)` }}
            >
              <div className="w-full shrink-0 pr-1">
                <div className="onboarding-form-stagger__item rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-title">
                        이메일 인증
                        <span className="ml-1 text-sm font-semibold text-[var(--color-primary-main)]">
                          (회사 이메일로만 인증이 가능합니다.)
                        </span>
                      </p>
                    </div>
                  </div>
                  <Input.Root className="mt-4">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input.Field
                          placeholder="이메일을 입력해 주세요"
                          value={verificationEmail}
                          onChange={(event) => setVerificationEmail(event.target.value)}
                          className="rounded-none border-0 border-b-2 border-b-[var(--color-primary-main)] bg-transparent px-0 py-2 pr-14 text-sm text-text-body shadow-none focus:border-b-[var(--color-primary-main)] focus:ring-0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendVerification}
                        disabled={isSendingVerification || verificationEmail.trim().length === 0}
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
                    {sendVerificationMessage ? (
                      <p className="mt-2 text-xs text-[#2b4b7e]">{sendVerificationMessage}</p>
                    ) : null}
                    {sendVerificationError ? (
                      <p className="mt-2 text-xs text-red-500">{sendVerificationError}</p>
                    ) : null}
                  </Input.Root>
                  <div className="mt-6 min-h-[360px]">
                    <div
                      className={`transition-all duration-300 ${
                        isVerificationVisible
                          ? 'opacity-100 translate-y-0'
                          : 'pointer-events-none opacity-0 -translate-y-2'
                      }`}
                    >
                      <div className="text-center">
                        <p className="text-sm font-semibold text-text-title">
                          인증번호 6자리를 입력해 주세요
                        </p>
                        {typeof remainingSeconds === 'number' ? (
                          <p className="mt-2 text-xs text-text-caption">
                            남은 시간 {Math.floor(remainingSeconds / 60)}:
                            {String(remainingSeconds % 60).padStart(2, '0')}
                          </p>
                        ) : null}
                        {isVerifying ? (
                          <p className="mt-2 text-xs text-text-caption">인증 확인 중...</p>
                        ) : null}
                        {isVerified ? (
                          <p className="mt-2 text-xs text-[#2b4b7e]">인증 완료</p>
                        ) : null}
                        {verificationError ? (
                          <p className="mt-2 text-xs text-red-500">{verificationError}</p>
                        ) : null}
                        <div className="mt-4 flex items-center justify-center gap-3">
                          {Array.from({ length: verificationCodeLength }).map((_, index) => {
                            const isFilled = verificationCode[index] !== undefined;
                            return (
                              <span
                                key={`code-dot-${index}`}
                                className={`h-3 w-3 rounded-full border ${
                                  isFilled
                                    ? 'border-[#2b4b7e] bg-[#2b4b7e]'
                                    : 'border-[#bcd1f5] bg-[#edf4ff]'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-10 grid grid-cols-3 gap-6 px-2.5 text-center text-2xl font-semibold text-[#2b4b7e]">
                        {[
                          '3',
                          '7',
                          '0',
                          '6',
                          '8',
                          '2',
                          '4',
                          '1',
                          '5',
                          'biometric',
                          '9',
                          'backspace',
                        ].map((item) => {
                          if (item === 'biometric') {
                            return (
                              <button
                                key="biometric"
                                type="button"
                                aria-hidden="true"
                                className="flex h-16 items-center justify-center text-gray-300"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                  className="h-6 w-6"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7 4h2m6 0h2M4 7v2m0 6v2m16-8v2m0 6v2M8 8h8v8H8z"
                                  />
                                </svg>
                              </button>
                            );
                          }

                          if (item === 'backspace') {
                            return (
                              <button
                                key="backspace"
                                type="button"
                                onClick={() => handleKeypadPress('backspace')}
                                className="flex h-16 items-center justify-center text-[#2b4b7e]"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  className="h-6 w-6"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10 6h8a2 2 0 012 2v8a2 2 0 01-2 2h-8l-4-6 4-6z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13 10l4 4m0-4l-4 4"
                                  />
                                </svg>
                              </button>
                            );
                          }

                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleKeypadPress(item)}
                              className="flex h-16 items-center justify-center"
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex justify-center">
                        <div className="w-full max-w-xs">
                          <Button
                            type="button"
                            onClick={handleVerifySubmit}
                            disabled={isVerificationSubmitDisabled}
                            icon={<Image src={iconMark} alt="" width={20} height={20} />}
                          >
                            제출
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full shrink-0 pl-1">{profileFormContent}</div>
            </div>
          </div>
        ) : (
          profileFormContent
        )}
      </section>

      <BottomSheet
        open={activeSheet !== null}
        title={
          activeSheet === 'job' ? '직무 선택' : activeSheet === 'career' ? '경력 선택' : '기술스택'
        }
        actionLabel="완료"
        onAction={() => setActiveSheet(null)}
        onClose={() => setActiveSheet(null)}
      >
        {activeSheet === 'tech' ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 rounded-full bg-[#edf4ff] px-4 py-3">
              <input
                value={techQuery}
                onChange={(event) => setTechQuery(event.target.value)}
                className="w-full bg-transparent text-sm text-text-body outline-none"
                placeholder="기술을 검색해 보세요"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedTech.map((tech) => (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() => toggleTech(tech)}
                  className="rounded-full border border-[#bcd1f5] bg-[#edf4ff] px-3 py-1 text-xs text-[#2b4b7e]"
                >
                  {tech.name} ×
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 pr-1">
              {skillsLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
              {skillsError ? <p className="text-sm text-red-500">{skillsError}</p> : null}
              {techLimitMessage ? <p className="text-xs text-red-500">{techLimitMessage}</p> : null}
              {!skillsLoading && !skillsError
                ? filteredTech.map((item) => {
                    const isSelected = selectedTech.some((tech) => tech.id === item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleTech(item)}
                        className="flex items-center justify-between border-b border-gray-100 pb-5 pt-2 text-left"
                      >
                        <span className="text-sm font-medium leading-relaxed text-text-body">
                          {item.name}
                        </span>
                        <span
                          className={`h-5 w-5 rounded-full border ${
                            isSelected ? 'border-[#2b4b7e] bg-[#2b4b7e]' : 'border-gray-300'
                          }`}
                        />
                      </button>
                    );
                  })
                : null}
            </div>
          </div>
        ) : null}

        {activeSheet === 'job' ? (
          <div className="flex h-full flex-col">
            {jobsLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
            {jobsError ? <p className="text-sm text-red-500">{jobsError}</p> : null}
            {!jobsLoading && !jobsError ? (
              <div className="flex flex-col gap-6 pr-1">
                {jobs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedJob(item)}
                    className="flex items-center justify-between py-4 text-left"
                  >
                    <span className="text-xl font-semibold leading-relaxed text-text-body">
                      {item.name}
                    </span>
                    <span
                      className={`h-5 w-5 rounded-md border ${
                        selectedJob?.id === item.id
                          ? 'border-[#2b4b7e] bg-[#2b4b7e]'
                          : 'border-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeSheet === 'career' ? (
          <div className="flex h-full flex-col">
            {careerLoading ? <p className="text-sm text-text-caption">불러오는 중...</p> : null}
            {careerError ? <p className="text-sm text-red-500">{careerError}</p> : null}
            {!careerLoading && !careerError ? (
              <div className="flex flex-col gap-6 pr-1">
                {careerLevels.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedCareer(item)}
                    className="flex items-center justify-between py-4 text-left"
                  >
                    <span className="text-xl font-semibold leading-relaxed text-text-body">
                      {item.level}
                    </span>
                    <span
                      className={`h-5 w-5 rounded-md border ${
                        selectedCareer?.id === item.id
                          ? 'border-[#2b4b7e] bg-[#2b4b7e]'
                          : 'border-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={isVerificationFailSheetOpen}
        title="안내"
        actionLabel="완료"
        onAction={() => setIsVerificationFailSheetOpen(false)}
        onClose={() => setIsVerificationFailSheetOpen(false)}
      >
        <div className="flex flex-col gap-4 px-1 text-sm text-text-body">
          <div className="rounded-2xl border border-[#f5d08a] bg-[#fff4d6] px-4 py-3 text-center text-[13px] font-semibold text-[#8a5a00]">
            우선 프로필 입력으로 넘어가 주세요.
          </div>
          <div className="rounded-2xl border border-[#bcd1f5] bg-[#edf4ff] px-4 py-3 text-center text-[13px] font-semibold text-[#2b4b7e]">
            이메일 인증은 추후 [마이페이지] &gt; [현직자 인증]
            <br />
            메뉴에서 진행할 수 있어요.
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
            <ul className="space-y-3 text-[13px] leading-relaxed text-text-body">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2b4b7e]" />
                <span>
                  기업 이메일이 등록되지 않은 경우에는 <strong>[문의하기]</strong>를 통해 별도로
                  문의해 주세요.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2b4b7e]" />
                <span>이메일 인증을 완료하지 않으면 인증됨 뱃지를 받을 수 없습니다.</span>
              </li>
            </ul>
          </div>
        </div>
      </BottomSheet>
    </main>
  );
}
