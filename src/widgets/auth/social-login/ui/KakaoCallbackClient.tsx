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

    if (error) {
      sessionStorage.setItem('kakaoLoginError', errorDescription ?? error);
      router.replace('/');
      return;
    }

    if (!code) {
      sessionStorage.setItem('kakaoLoginError', '인가 코드가 없습니다.');
      router.replace('/');
      return;
    }

    let active = true;
    kakaoLogin(code)
      .then((data) => {
        if (!active) return;
        sessionStorage.setItem('kakaoLoginResult', JSON.stringify(data));
        if (data.status === 'LOGIN_SUCCESS') {
          router.replace('/');
          return;
        }
        if (data.status === 'SIGNUP_REQUIRED') {
          router.replace('/onboarding');
          return;
        }
        sessionStorage.setItem('kakaoLoginError', '알 수 없는 로그인 응답입니다.');
        router.replace('/');
      })
      .catch(() => {
        if (!active) return;
        sessionStorage.setItem('kakaoLoginError', '로그인에 실패했습니다.');
        router.replace('/');
      });

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return <p className="p-6 text-sm text-gray-600">로그인 완료! 이동 중...</p>;
}
