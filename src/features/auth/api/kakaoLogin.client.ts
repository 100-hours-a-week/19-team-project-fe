import { apiFetch } from '@/shared/api';

type KakaoLoginResult =
  | {
      status: 'LOGIN_SUCCESS';
      userId: number;
      userType: string;
      accessToken: string;
      refreshToken: string;
    }
  | {
      status: 'SIGNUP_REQUIRED';
      signup_required: {
        oauth_provider: 'KAKAO';
        oauth_id: string;
        email: string | null;
        nickname: string | null;
      };
    };

export async function kakaoLogin(code: string): Promise<KakaoLoginResult> {
  const data = await apiFetch<{
    status: 'LOGIN_SUCCESS' | 'SIGNUP_REQUIRED';
    login_success: {
      user_id: number;
      user_type: string;
      access_token: string;
      refresh_token: string;
    } | null;
    signup_required: {
      oauth_provider: 'KAKAO';
      oauth_id: string;
      email: string | null;
      nickname: string | null;
    } | null;
  }>('/bff/auth/kakao/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (data.status === 'SIGNUP_REQUIRED' && data.signup_required) {
    return {
      status: 'SIGNUP_REQUIRED',
      signup_required: data.signup_required,
    };
  }

  if (data.status !== 'LOGIN_SUCCESS' || !data.login_success) {
    throw new Error('LOGIN_FAILED');
  }

  return {
    status: 'LOGIN_SUCCESS',
    userId: data.login_success.user_id,
    userType: data.login_success.user_type,
    accessToken: data.login_success.access_token,
    refreshToken: data.login_success.refresh_token,
  };
}
