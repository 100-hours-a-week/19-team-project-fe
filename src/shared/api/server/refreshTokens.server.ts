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
      Authorization: `Bearer ${refreshToken}`,
      Cookie: `refresh_token=${encodeURIComponent(refreshToken)}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    console.error('[Token Refresh Error]', res.status, body);
    if (body && typeof body.code === 'string') {
      throw new Error(body.code);
    }
    throw new Error('TOKEN_REFRESH_FAILED');
  }

  const body = await res.json().catch(() => null);
  const data = body?.data as RefreshTokenResponse | undefined;
  if (!data?.access_token || !data?.refresh_token) {
    throw new Error('TOKEN_REFRESH_FAILED');
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}
