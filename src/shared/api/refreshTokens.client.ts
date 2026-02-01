import { apiFetch } from './apiFetch';
import { setAuthCookies } from './setAuthCookies.client';

type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
};

export async function refreshAuthTokens(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    window.alert('세션이 만료되어 재인증을 시도합니다.');
  }
  const data = await apiFetch<RefreshTokenResponse>('/bff/auth/tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    retryOnUnauthorized: false,
    successCodes: ['CREATED'],
  });

  setAuthCookies({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });

  if (typeof window !== 'undefined') {
    window.alert('재인증이 완료되었습니다.');
  }

  return true;
}
