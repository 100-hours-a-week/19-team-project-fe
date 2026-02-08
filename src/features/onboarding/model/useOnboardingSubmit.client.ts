'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import type { CareerLevel, Job, Skill, UserType } from '@/entities/onboarding';
import { signup } from '@/features/onboarding';
import { BusinessError, setAuthCookies, useCommonApiErrorHandler } from '@/shared/api';
import { stompManager } from '@/shared/ws';

const signupErrorMessages: Record<string, string> = {
  SIGNUP_OAUTH_PROVIDER_INVALID: '소셜 로그인 제공자가 올바르지 않습니다.',
  SIGNUP_OAUTH_ID_EMPTY: '소셜 로그인 정보가 필요합니다.',
  NICKNAME_EMPTY: '닉네임을 입력해 주세요.',
  SIGNUP_USER_TYPE_INVALID: '유저 타입이 올바르지 않습니다.',
  CAREER_LEVEL_NOT_FOUND: '선택한 경력이 올바르지 않습니다.',
};

const defaultSignupErrorMessage = '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.';

type UseOnboardingSubmitParams = {
  isExpert: boolean;
  oauthId: string | null;
  oauthEmail: string | null;
  nickname: string;
  introduction: string;
  selectedJob: Job | null;
  selectedCareer: CareerLevel | null;
  selectedTech: Skill[];
  checkedNickname: string | null;
  isVerified: boolean;
  lastSentEmail: string | null;
  verificationEmail: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  pledgeAgreed: boolean;
};

export function useOnboardingSubmit({
  isExpert,
  oauthId,
  oauthEmail,
  nickname,
  introduction,
  selectedJob,
  selectedCareer,
  selectedTech,
  checkedNickname,
  isVerified,
  lastSentEmail,
  verificationEmail,
  termsAgreed,
  privacyAgreed,
  pledgeAgreed,
}: UseOnboardingSubmitParams) {
  const router = useRouter();
  const handleCommonApiError = useCommonApiErrorHandler();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (nicknameLimit: number) => {
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

  return { isSubmitting, submitError, handleSubmit };
}
