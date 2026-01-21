'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { kakaoLogin } from '@/features/auth/social-login';

export default function KakaoCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      .then((result) => {
        if (result.status === 'LOGIN_SUCCESS') {
          router.replace('/');
          return;
        }

        if (result.status === 'SIGNUP_REQUIRED') {
          router.replace('/onboarding');
          return;
        }

        console.error('[KAKAO][ERROR] unknown response', result);
        router.replace('/login?error=unknown');
      })
      .catch((err) => {
        console.error('[KAKAO][ERROR] backend login fail', err);
        router.replace('/login?error=server');
      });
  }, [router, searchParams]);

  return <p className="p-6 text-sm text-gray-600">카카오 로그인 처리 중입니다…</p>;
}
