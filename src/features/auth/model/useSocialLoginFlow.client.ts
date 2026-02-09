'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { restoreAccount } from '@/features/auth';
import { readAccessToken, setAuthCookies, useCommonApiErrorHandler } from '@/shared/api';
import { useToast } from '@/shared/ui/toast';
import { stompManager } from '@/shared/ws';

type RestorePayload = {
  oauth_provider: 'KAKAO';
  oauth_id: string;
  email: string | null;
  nickname: string | null;
  email_conflict?: boolean;
  nickname_conflict?: boolean;
};

type SignupRequiredPayload = {
  oauth_provider: 'KAKAO';
  oauth_id: string;
  email: string | null;
  nickname: string | null;
};

export function useSocialLoginFlow() {
  const router = useRouter();
  const handleCommonApiError = useCommonApiErrorHandler();
  const { pushToast } = useToast();

  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreData, setRestoreData] = useState<RestorePayload | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem('kakaoRestoreRequired');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { restore_required?: RestorePayload };
      if (parsed.restore_required?.oauth_provider && parsed.restore_required.oauth_id) {
        setRestoreData(parsed.restore_required);
        setRestoreOpen(true);
        return;
      }
    } catch {
      // ignore parse error
    }
    sessionStorage.removeItem('kakaoRestoreRequired');
  }, []);

  const handleSignupChoice = () => {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem('kakaoRestoreRequired');
    let signupRequired: SignupRequiredPayload | null = null;
    try {
      const parsed = JSON.parse(raw ?? '{}') as {
        signup_required?: SignupRequiredPayload | null;
        restore_required?: SignupRequiredPayload;
      };
      if (parsed.signup_required?.oauth_provider && parsed.signup_required.oauth_id) {
        signupRequired = parsed.signup_required;
      } else if (parsed.restore_required?.oauth_provider && parsed.restore_required.oauth_id) {
        signupRequired = parsed.restore_required;
      }
    } catch {
      signupRequired = null;
    }

    if (!signupRequired) {
      setRestoreError('회원가입 정보를 불러오지 못했습니다. 다시 로그인해 주세요.');
      return;
    }

    sessionStorage.setItem('kakaoLoginResult', JSON.stringify({ signup_required: signupRequired }));
    sessionStorage.removeItem('kakaoRestoreRequired');
    setRestoreOpen(false);
    router.replace('/onboarding');
  };

  const handleRestoreChoice = async () => {
    if (!restoreData || isRestoring) return;
    if (!restoreData.email || !restoreData.nickname) {
      setRestoreError('복구에 필요한 정보가 부족합니다. 다시 로그인해 주세요.');
      return;
    }
    setIsRestoring(true);
    setRestoreError(null);
    try {
      const result = await restoreAccount({
        oauth_provider: restoreData.oauth_provider,
        oauth_id: restoreData.oauth_id,
        email: restoreData.email,
        nickname: restoreData.nickname,
      });

      setAuthCookies({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        userId: result.user_id,
      });

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
      } catch (err) {
        console.warn('[WS] connect after restore failed', err);
      }

      sessionStorage.removeItem('kakaoRestoreRequired');
      setRestoreOpen(false);
      pushToast('계정이 복구되었습니다.', { variant: 'success' });
      router.replace('/');
    } catch (error) {
      if (await handleCommonApiError(error)) {
        return;
      }
      setRestoreError(
        error instanceof Error ? error.message : '계정 복구에 실패했습니다. 다시 시도해 주세요.',
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return {
    restoreOpen,
    setRestoreOpen,
    restoreData,
    restoreError,
    isRestoring,
    handleSignupChoice,
    handleRestoreChoice,
  };
}
