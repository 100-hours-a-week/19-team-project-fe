export type OAuthLoginStatus = 'LOGIN_SUCCESS' | 'SIGNUP_REQUIRED' | 'ACCOUNT_CHOICE_REQUIRED';

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

export interface KakaoRestoreRequired {
  provider: string;
  providerUserId: string;
  email: string | null;
  nickname: string | null;
  emailConflict?: boolean;
  nicknameConflict?: boolean;
}

export interface KakaoOAuthLoginData {
  status: OAuthLoginStatus;
  loginSuccess?: KakaoLoginSuccess;
  signupRequired?: KakaoSignupRequired;
  restoreRequired?: KakaoRestoreRequired;
}
