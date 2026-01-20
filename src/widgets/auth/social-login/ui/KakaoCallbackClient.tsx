'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { kakaoLogin, type KakaoOAuthLoginData } from '@/features/auth/social-login';

type CallbackStatus = 'loading' | 'missing_code' | 'login_success' | 'signup_required' | 'error';

export default function KakaoCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [payload, setPayload] = useState<KakaoOAuthLoginData | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      sessionStorage.setItem('kakaoLoginError', errorDescription ?? error);
      setStatus('error');
      router.replace('/');
      return;
    }

    if (!code) {
      sessionStorage.setItem('kakaoLoginError', '인가 코드가 없습니다.');
      setStatus('missing_code');
      router.replace('/');
      return;
    }

    let active = true;
    kakaoLogin(code)
      .then((data) => {
        if (!active) return;
        setPayload(data);
        sessionStorage.setItem('kakaoLoginResult', JSON.stringify(data));
        if (data.status === 'LOGIN_SUCCESS') {
          setStatus('login_success');
          router.replace('/');
          return;
        }
        setStatus('signup_required');
        router.replace('/onboarding');
      })
      .catch(() => {
        if (!active) return;
        sessionStorage.setItem('kakaoLoginError', '로그인에 실패했습니다.');
        setStatus('error');
        router.replace('/');
      });

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  if (status === 'loading') {
    return <p className="p-6 text-sm text-gray-600">카카오 로그인 처리 중...</p>;
  }

  if (status === 'missing_code') {
    return <p className="p-6 text-sm text-gray-600">인증 코드가 없습니다. 다시 로그인해주세요.</p>;
  }

  if (status === 'signup_required') {
    const signup = payload?.signupRequired;
    return (
      <div className="p-6 text-sm text-gray-600">
        <p>회원가입이 필요합니다.</p>
        {signup ? (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-xs text-gray-500">
            <p>provider: {signup.provider}</p>
            <p>providerUserId: {signup.providerUserId}</p>
            <p>email: {signup.email ?? '-'}</p>
            <p>nickname: {signup.nickname ?? '-'}</p>
            <p>profileImageUrl: {signup.profileImageUrl ?? '-'}</p>
          </div>
        ) : null}
      </div>
    );
  }

  if (status === 'error') {
    return <p className="p-6 text-sm text-gray-600">로그인에 실패했습니다.</p>;
  }

  return <p className="p-6 text-sm text-gray-600">로그인 완료! 이동 중...</p>;
}
