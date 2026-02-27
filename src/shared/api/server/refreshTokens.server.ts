import { cookies } from 'next/headers';
import { buildApiUrl } from '@/shared/api';
import type { ApiResponse } from '@/shared/api';

type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
};

export class RefreshTokenError extends Error {
  status: number;
  code: string;

  constructor(code: string, status: number, message?: string) {
    super(message ?? code);
    this.name = 'RefreshTokenError';
    this.code = code;
    this.status = status;
  }
}

export async function refreshAuthTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  const domain = process.env.NODE_ENV === 'production' ? '.re-fit.kr' : undefined;
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const accessToken = cookieStore.get('access_token')?.value;
  if (!refreshToken) {
    throw new RefreshTokenError('REFRESH_TOKEN_MISSING', 401);
  }

  let res: Response;
  try {
    const forwardedCookies = [
      `refresh_token=${encodeURIComponent(refreshToken)}`,
      accessToken ? `access_token=${encodeURIComponent(accessToken)}` : null,
    ]
      .filter(Boolean)
      .join('; ');

    res = await fetch(buildApiUrl('/api/v1/auth/tokens'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Refresh-Token': refreshToken,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        // Some auth servers only read tokens from cookies; include both.
        ...(forwardedCookies ? { Cookie: forwardedCookies } : {}),
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    throw new RefreshTokenError('TOKEN_REFRESH_NETWORK_FAILED', 502);
  }

  if (!res.ok) {
    let body: ApiResponse<unknown> | null = null;
    try {
      body = (await res.json()) as ApiResponse<unknown>;
    } catch {
      body = null;
    }
    const code = body?.code ?? 'TOKEN_REFRESH_FAILED';
    const message = body?.message ?? 'TOKEN_REFRESH_FAILED';
    throw new RefreshTokenError(code, res.status, message);
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
      secure,
      sameSite: 'lax',
      path: '/',
      domain,
    });
    cookieStore.set('refresh_token', nextTokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      domain,
    });
  } catch {
    // Cookies may be immutable in server components; ignore and return tokens.
  }

  return nextTokens;
}
