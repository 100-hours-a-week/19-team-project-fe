export type OAuthLoginStatus = 'LOGIN_SUCCESS' | 'SIGNUP_REQUIRED';

export interface KakaoLoginSuccess {
  userId: number;
  userType: string;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface KakaoSignupRequired {
  provider: string;
  providerUserId: string;
  email: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
}

export interface KakaoOAuthLoginData {
  status: OAuthLoginStatus;
  loginSuccess?: KakaoLoginSuccess;
  signupRequired?: KakaoSignupRequired;
}
