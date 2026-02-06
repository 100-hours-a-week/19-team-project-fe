import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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
import { BusinessError, setAuthCookies, useCommonApiErrorHandler } from '@/shared/api';
import { stompManager } from '@/shared/ws';

const nicknameLimit = 10;
const introductionLimit = 100;
const verificationCodeLength = 6;

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
  EMAIL_FORMAT_INVALID: '이메일 형식이 올바르지 않습니다.',
  EMAIL_ALREADY_VERIFIED: '이미 인증이 완료된 이메일입니다.',
  EMAIL_VERIFICATION_RATE_LIMIT: '인증 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  VERIFICATION_CODE_INVALID: '인증번호 형식이 올바르지 않습니다.',
  VERIFICATION_CODE_MISMATCH: '인증번호가 일치하지 않습니다.',
  AUTH_UNAUTHORIZED: '인증 정보가 만료되었습니다. 다시 전송해 주세요.',
  VERIFICATION_CODE_EXPIRED: '인증 시간이 만료되었습니다. 다시 전송해 주세요.',
};

export type SheetId = 'job' | 'career' | 'tech' | null;

export function useOnboardingProfileForm(isExpert: boolean) {
  const router = useRouter();
  const handleCommonApiError = useCommonApiErrorHandler();

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
  const [oauthId, setOauthId] = useState<string | null>(null);
  const [oauthEmail, setOauthEmail] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [privacyPledgeOpen, setPrivacyPledgeOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [pledgeAgreed, setPledgeAgreed] = useState(false);

  const [nicknameCheckMessage, setNicknameCheckMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isNicknameChecking, setIsNicknameChecking] = useState(false);
  const [checkedNickname, setCheckedNickname] = useState<string | null>(null);

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
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem('kakaoLoginResult');
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        signup_required?: {
          oauth_provider?: 'KAKAO';
          oauth_id?: string;
          email?: string | null;
          nickname?: string | null;
        } | null;
      };
      const signupRequired = parsed.signup_required;
      if (!signupRequired?.oauth_id) return;
      setOauthId(signupRequired.oauth_id);
      if (signupRequired.email) setOauthEmail(signupRequired.email);
      if (signupRequired.nickname && nickname.trim().length === 0) {
        setNickname(signupRequired.nickname);
      }
    } catch {
      // ignore invalid session storage
    }
  }, [nickname]);

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

  const filteredTech = useMemo(() => {
    const query = techQuery.trim();
    if (!query) return skills;
    return skills.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  }, [skills, techQuery]);

  const handleTechToggle = (skill: Skill) => {
    const exists = selectedTech.some((item) => item.id === skill.id);
    const next = exists
      ? selectedTech.filter((item) => item.id !== skill.id)
      : [...selectedTech, skill];

    if (!exists && next.length > 5) {
      setTechLimitMessage('기술 스택은 최대 5개까지 선택할 수 있어요.');
      return;
    }

    setTechLimitMessage(null);
    setSelectedTech(next);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!selectedJob || !selectedCareer) {
      setSubmitError('직무와 경력을 선택해 주세요.');
      return;
    }
    if (!isExpert && selectedTech.length === 0) {
      setSubmitError('기술 스택을 선택해 주세요.');
      return;
    }

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setSubmitError('닉네임을 입력해 주세요.');
      return;
    }
    if (trimmedNickname.length > nicknameLimit) {
      setSubmitError('닉네임이 너무 길어요.');
      return;
    }

    if (trimmedNickname !== checkedNickname) {
      setSubmitError('닉네임 중복 확인을 진행해 주세요.');
      return;
    }

    if (isExpert && !isVerified) {
      setSubmitError('이메일 인증을 완료해 주세요.');
      return;
    }

    if (!termsAgreed || !privacyAgreed || (isExpert && !pledgeAgreed)) {
      setSubmitError('필수 약관에 동의해 주세요.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (!oauthId || !oauthEmail) {
        setSubmitError('회원가입 정보를 불러오지 못했습니다. 다시 로그인해 주세요.');
        return;
      }

      const userType: UserType = isExpert ? 'EXPERT' : 'JOB_SEEKER';
      const companyEmail = isExpert ? (lastSentEmail ?? verificationEmail.trim()) : undefined;
      const response = await signup({
        oauth_provider: 'KAKAO',
        oauth_id: oauthId,
        email: oauthEmail,
        company_email: companyEmail,
        user_type: userType,
        nickname: trimmedNickname,
        introduction: introduction.trim(),
        career_level_id: selectedCareer.id,
        job_ids: [selectedJob.id],
        skills: selectedTech.map((skill, index) => ({
          skill_id: skill.id,
          display_order: index + 1,
        })),
      });

      setAuthCookies({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        userId: response.userId,
      });

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (wsUrl && response.accessToken) {
        try {
          await stompManager.connect(wsUrl, {
            connectHeaders: { Authorization: `Bearer ${response.accessToken}` },
          });
        } catch {
          // ignore
        }
      }

      router.replace('/');
    } catch (error) {
      if (await handleCommonApiError(error)) return;
      if (error instanceof BusinessError) {
        setSubmitError(signupErrorMessages[error.code] ?? defaultSignupErrorMessage);
        return;
      }
      if (error instanceof Error) {
        setSubmitError(error.message || defaultSignupErrorMessage);
        return;
      }
      setSubmitError(defaultSignupErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
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

    setIsNicknameChecking(true);
    setNicknameCheckMessage(null);
    try {
      await checkNickname(trimmed);
      setCheckedNickname(trimmed);
      setNicknameCheckMessage({ tone: 'success', text: '사용 가능한 닉네임이에요.' });
    } catch (error) {
      if (await handleCommonApiError(error)) return;
      if (error instanceof BusinessError) {
        setNicknameCheckMessage({
          tone: 'error',
          text: nicknameValidationMessages[error.code] ?? '닉네임 확인에 실패했습니다.',
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

  const handleSendVerification = () => {
    const trimmedEmail = verificationEmail.trim();
    if (!trimmedEmail) {
      setSendVerificationError('이메일을 입력해 주세요.');
      return;
    }

    setIsSendingVerification(true);
    setSendVerificationError(null);
    setSendVerificationMessage(null);
    setVerificationError(null);
    setIsVerified(false);
    sendEmailVerification({ email: trimmedEmail })
      .then((data) => {
        setLastSentEmail(trimmedEmail);
        if (data.expires_at) {
          const expiresAt = new Date(data.expires_at);
          setVerificationExpiresAt(expiresAt);
          setRemainingSeconds(Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)));
        } else {
          setVerificationExpiresAt(null);
          setRemainingSeconds(null);
        }
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
    if (typeof remainingSeconds === 'number' && remainingSeconds === 0) {
      setVerificationError('인증 시간이 만료되었습니다. 다시 전송해 주세요.');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    try {
      await verifyEmailVerification({ email: lastSentEmail, code });
      setIsVerified(true);
      router.replace('/');
    } catch (error: unknown) {
      if (await handleCommonApiError(error)) {
        return;
      }
      if (error instanceof BusinessError) {
        setVerificationError(
          emailVerificationMessages[error.code] ?? error.message ?? '인증번호 확인에 실패했습니다.',
        );
      } else if (error instanceof Error) {
        setVerificationError(error.message ?? '인증번호 확인에 실패했습니다.');
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
    if (!lastSentEmail) return;
    setVerificationEmail(lastSentEmail);
  }, [isExpert, isVerified, lastSentEmail]);

  const allRequiredAgreed = termsAgreed && privacyAgreed && (!isExpert || pledgeAgreed);
  const isNicknameCheckDisabled =
    isNicknameChecking || nickname.trim().length === 0 || nickname.trim().length >= nicknameLimit;

  const isSubmitDisabled =
    isSubmitting ||
    !selectedJob ||
    !selectedCareer ||
    (selectedTech.length === 0 && !isExpert) ||
    !nickname.trim() ||
    !allRequiredAgreed;

  const isVerificationSubmitDisabled =
    !isVerificationVisible ||
    isVerifying ||
    isVerified ||
    verificationCode.join('').length !== verificationCodeLength ||
    !lastSentEmail ||
    (typeof remainingSeconds === 'number' && remainingSeconds === 0);

  return {
    currentStep,
    setCurrentStep,
    activeSheet,
    setActiveSheet,
    selectedJob,
    setSelectedJob,
    selectedCareer,
    setSelectedCareer,
    selectedTech,
    setSelectedTech,
    techQuery,
    setTechQuery,
    skills,
    skillsLoading,
    skillsError,
    techLimitMessage,
    jobs,
    jobsLoading,
    jobsError,
    careerLevels,
    careerLoading,
    careerError,
    verificationEmail,
    setVerificationEmail,
    isVerificationVisible,
    verificationCode,
    lastSentEmail,
    isSendingVerification,
    sendVerificationMessage,
    sendVerificationError,
    isVerifying,
    verificationError,
    isVerified,
    isVerificationFailSheetOpen,
    setIsVerificationFailSheetOpen,
    remainingSeconds,
    nickname,
    setNickname,
    introduction,
    setIntroduction,
    isSubmitting,
    submitError,
    termsOpen,
    setTermsOpen,
    privacyOpen,
    setPrivacyOpen,
    pledgeOpen,
    setPledgeOpen,
    privacyPledgeOpen,
    setPrivacyPledgeOpen,
    termsAgreed,
    setTermsAgreed,
    privacyAgreed,
    setPrivacyAgreed,
    pledgeAgreed,
    setPledgeAgreed,
    nicknameCheckMessage,
    isNicknameChecking,
    checkedNickname,
    setCheckedNickname,
    handleSubmit,
    handleNicknameCheck,
    handleSendVerification,
    handleKeypadPress,
    handleVerifySubmit,
    handleTechToggle,
    filteredTech,
    allRequiredAgreed,
    isNicknameCheckDisabled,
    isSubmitDisabled,
    isVerificationSubmitDisabled,
    nicknameLimit,
    introductionLimit,
    verificationCodeLength,
  };
}
