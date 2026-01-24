'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { kakaoLogin } from '@/features/auth';

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
      .then(() => {
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

        router.replace('/');
      })
      .catch((err) => {
        console.error('[KAKAO][ERROR] login failed', err);
        router.replace('/login?error=server');
      });
  }, [router, searchParams]);

  return <p className="p-6 text-sm text-gray-600">카카오 로그인 처리 중입니다…</p>;
}
