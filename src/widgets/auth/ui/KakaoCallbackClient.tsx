'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { kakaoLogin } from '@/features/auth';
import { readAccessToken, setAuthCookies, useCommonApiErrorHandler } from '@/shared/api';
import { stompManager } from '@/shared/ws';

export default function KakaoCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handleCommonApiError = useCommonApiErrorHandler();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // 1. 카카오 OAuth 에러
    if (error) {
      console.error('[KAKAO][ERROR]', errorDescription ?? error);
      router.replace('/login?error=kakao');
      return;
    }

    // 2. code 없음
    if (!code) {
      console.error('[KAKAO][ERROR] no code');
      router.replace('/login?error=invalid_callback');
      return;
    }

    kakaoLogin(code)
      .then(async (result) => {
        /**
         * result 예시:
         * {
         *   userId: number;
         *   userType: string;
         * }
         *
         * 토큰 없음
         * 쿠키는 이미 서버에서 설정됨
         */

        if (result.status === 'SIGNUP_REQUIRED') {
          sessionStorage.setItem(
            'kakaoLoginResult',
            JSON.stringify({ signup_required: result.signup_required }),
          );
          router.replace('/onboarding');
          return;
        }

        if (result.status === 'ACCOUNT_CHOICE_REQUIRED') {
          sessionStorage.setItem(
            'kakaoRestoreRequired',
            JSON.stringify({
              restore_required: result.restore_required,
              signup_required: result.signup_required ?? null,
            }),
          );
          router.replace('/login?account_choice=1');
          return;
        }

        setAuthCookies({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          userId: result.userId,
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
          console.warn('[WS] connect after login failed', err);
        }

        router.replace('/');
      })
      .catch(async (err) => {
        console.error('[KAKAO][ERROR] login failed', err);
        if (await handleCommonApiError(err)) return;
        router.replace('/login?error=server');
      });
  }, [handleCommonApiError, router, searchParams]);

  return <p className="p-6 text-sm text-gray-600">카카오 로그인 처리 중입니다…</p>;
}
