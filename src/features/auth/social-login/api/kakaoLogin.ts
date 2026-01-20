import { apiFetch, buildApiUrl } from '@/shared/api';
import type { KakaoOAuthLoginData } from './types';

const KAKAO_LOGIN_PATH = '/api/v1/auth/oauth/kakao/login';

export async function kakaoLogin(code: string): Promise<KakaoOAuthLoginData> {
  const url = buildApiUrl(KAKAO_LOGIN_PATH);

  return apiFetch<KakaoOAuthLoginData>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });
}
