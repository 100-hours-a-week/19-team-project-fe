'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { kakaoLogin } from '@/features/auth';
import { authStatusQueryKey } from '@/entities/auth';
import { userMeQueryKey } from '@/entities/user';
import { setAuthCookies, useCommonApiErrorHandler } from '@/shared/api';
import { ensureWsConnected } from '@/shared/ws';

export function useKakaoCallback() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const handleCommonApiError = useCommonApiErrorHandler();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error('[KAKAO][ERROR]', errorDescription ?? error);
      router.replace('/login?error=kakao');
      return;
    }

    if (!code) {
      console.error('[KAKAO][ERROR] no code');
      router.replace('/login?error=invalid_callback');
      return;
    }

    kakaoLogin(code)
      .then(async (result) => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('kakaoLoginResult');
          sessionStorage.removeItem('kakaoRestoreRequired');
        }

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
        queryClient.setQueryData(authStatusQueryKey, { authenticated: true });
        await queryClient.invalidateQueries({ queryKey: userMeQueryKey });

        try {
          const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
          if (!wsUrl) {
            console.warn('[WS] NEXT_PUBLIC_WS_URL is missing');
          } else {
            await ensureWsConnected({ accessToken: result.accessToken });
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
  }, [handleCommonApiError, queryClient, router, searchParams]);
}
