import { apiFetch } from './apiFetch';
import { setAuthCookies } from './setAuthCookies.client';

type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
};

export async function refreshAuthTokens(): Promise<boolean> {
  const data = await apiFetch<RefreshTokenResponse>('/bff/auth/tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    successCodes: ['CREATED'],
  });

  setAuthCookies({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });

  return true;
}
