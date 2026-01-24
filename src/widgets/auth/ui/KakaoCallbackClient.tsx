'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { kakaoLogin } from '@/features/auth';
import { stompManager } from '@/shared/ws';

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
      .then(async (result) => {
        if (result.status === 'LOGIN_SUCCESS') {
          const rawLoginSuccess = (
            result as {
              login_success?: { access_token?: string; user_id?: number; userId?: number };
            }
          ).login_success;
          const at = result.loginSuccess?.accessToken ?? rawLoginSuccess?.access_token ?? null;
          const rt = result.loginSuccess?.refreshToken ?? null;
          const userId =
            result.loginSuccess?.userId ??
            rawLoginSuccess?.user_id ??
            rawLoginSuccess?.userId ??
            null;

          if (at) document.cookie = `access_token=${encodeURIComponent(at)}; Path=/;`;
          if (rt) document.cookie = `refresh_token=${encodeURIComponent(rt)}; Path=/;`;
          if (userId != null) {
            document.cookie = `user_id=${encodeURIComponent(String(userId))}; Path=/;`;
          }

          if (at) {
            try {
              await stompManager.connect(process.env.NEXT_PUBLIC_WS_URL!, {
                connectHeaders: { Authorization: `Bearer ${at}` },
              });
            } catch (error) {
              console.error('[KAKAO][WARN] ws connect failed', error);
            }
          }

          router.replace('/');
          return;
        }

        if (result.status === 'SIGNUP_REQUIRED') {
          sessionStorage.setItem('kakaoLoginResult', JSON.stringify(result));
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
