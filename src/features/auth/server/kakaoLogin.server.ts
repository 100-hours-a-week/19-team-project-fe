import { loginWithKakao } from '@/shared/api/server';

type KakaoLoginSuccessResult = {
  status: 'LOGIN_SUCCESS';
  userId: number;
  userType: string;
  accessToken: string;
  refreshToken: string;
};

type KakaoSignupRequiredResult = {
  status: 'SIGNUP_REQUIRED';
  signupRequired: {
    oauth_provider: 'KAKAO';
    oauth_id: string;
    email: string | null;
    nickname: string | null;
  };
};

type KakaoLoginResult = KakaoLoginSuccessResult | KakaoSignupRequiredResult;

export async function kakaoLogin(code: string): Promise<KakaoLoginResult> {
  const response = await loginWithKakao(code);

  if (response.status === 'SIGNUP_REQUIRED' && response.signup_required) {
    return {
      status: 'SIGNUP_REQUIRED',
      signupRequired: response.signup_required,
    };
  }

  if (response.status !== 'LOGIN_SUCCESS' || !response.login_success) {
    throw new Error('LOGIN_FAILED');
  }

  const { user_id, user_type, access_token, refresh_token } = response.login_success;

  return {
    status: 'LOGIN_SUCCESS',
    userId: user_id,
    userType: user_type,
    accessToken: access_token,
    refreshToken: refresh_token,
  };
}
