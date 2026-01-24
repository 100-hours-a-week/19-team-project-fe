import { loginWithKakao } from '@/shared/api/server';

type KakaoLoginResult = {
  userId: number;
  userType: string;
  accessToken: string;
  refreshToken: string;
};

export async function kakaoLogin(code: string): Promise<KakaoLoginResult> {
  const response = await loginWithKakao(code);

  if (response.status !== 'LOGIN_SUCCESS' || !response.login_success) {
    throw new Error('LOGIN_FAILED');
  }

  const { user_id, user_type, access_token, refresh_token } = response.login_success;

  return {
    userId: user_id,
    userType: user_type,
    accessToken: access_token,
    refreshToken: refresh_token,
  };
}
