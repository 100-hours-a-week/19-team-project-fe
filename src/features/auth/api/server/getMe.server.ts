import { cookies } from 'next/headers';

import { buildApiUrl, BusinessError, HttpError } from '@/shared/api';
import { apiFetchWithRefresh } from '@/shared/api/server';

type AuthStatus = {
  authenticated: true;
};

type GuestStatus = {
  authenticated: false;
};

export async function getMe(): Promise<AuthStatus | GuestStatus> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    return { authenticated: false };
  }

  try {
    await apiFetchWithRefresh<unknown>(
      buildApiUrl('/api/v1/users/me'),
      { method: 'GET' },
      accessToken,
    );
    return { authenticated: true };
  } catch (error) {
    const isAuthError =
      (error instanceof BusinessError &&
        ['AUTH_UNAUTHORIZED', 'AUTH_INVALID_TOKEN', 'AUTH_TOKEN_EXPIRED', 'UNAUTHORIZED'].includes(
          error.code,
        )) ||
      (error instanceof HttpError && (error.status === 401 || error.status === 403)) ||
      (error instanceof Error && error.message === 'UNAUTHORIZED');

    if (isAuthError) {
      const cookieDomain = process.env.NODE_ENV === 'production' ? '.re-fit.kr' : undefined;
      const base = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        expires: new Date(0),
        domain: cookieDomain,
      };
      cookieStore.set('access_token', '', base);
      cookieStore.set('refresh_token', '', base);
      return { authenticated: false };
    }

    throw error;
  }
}
