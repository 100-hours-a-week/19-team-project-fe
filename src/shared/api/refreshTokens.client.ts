import { apiFetch } from './apiFetch';
import { setAuthCookies } from './setAuthCookies.client';

type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
};

let refreshPromise: Promise<boolean> | null = null;

export async function refreshAuthTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
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

    return true;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}
