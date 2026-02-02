import { cookies } from 'next/headers';
import { buildApiUrl } from '@/shared/api';

type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
};

export async function refreshAuthTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  if (!refreshToken) {
    throw new Error('REFRESH_TOKEN_MISSING');
  }

  const res = await fetch(buildApiUrl('/api/v1/auth/tokens'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Refresh-Token': refreshToken,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    throw new Error('TOKEN_REFRESH_FAILED');
  }

  const body = await res.json();
  const data = body.data as RefreshTokenResponse;
  const nextTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };

  try {
    cookieStore.set('access_token', nextTokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    cookieStore.set('refresh_token', nextTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  } catch {
    // Cookies may be immutable in server components; ignore and return tokens.
  }

  return nextTokens;
}
