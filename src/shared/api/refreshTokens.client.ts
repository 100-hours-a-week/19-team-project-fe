import { apiFetch } from './apiFetch';
import { setAuthCookies } from './setAuthCookies.client';

type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
};

let refreshInFlight: Promise<boolean> | null = null;

export async function refreshAuthTokens(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
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
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}
