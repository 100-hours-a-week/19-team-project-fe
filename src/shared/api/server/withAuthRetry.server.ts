import 'server-only';

import { cookies } from 'next/headers';

import { BusinessError, HttpError } from '@/shared/api';
import { refreshAuthTokens } from './refreshTokens.server';
import { setAuthCookies } from './setAuthCookies.server';

type RequestWithToken<T> = (token: string) => Promise<T>;
type AuthRetryOptions = {
  allowRefresh?: boolean;
};

function isAuthError(error: unknown): boolean {
  if (error instanceof BusinessError) {
    return (
      error.code === 'UNAUTHORIZED' ||
      error.code === 'AUTH_UNAUTHORIZED' ||
      error.code === 'AUTH_INVALID_TOKEN' ||
      error.code === 'AUTH_TOKEN_EXPIRED'
    );
  }
  if (error instanceof HttpError) {
    return error.status === 401;
  }
  return false;
}

export async function withAuthRetry<T>(
  request: RequestWithToken<T>,
  accessTokenOverride?: string,
  options: AuthRetryOptions = {},
): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = accessTokenOverride ?? cookieStore.get('access_token')?.value;

  if (!accessToken) {
    throw new Error('UNAUTHORIZED');
  }

  try {
    return await request(accessToken);
  } catch (error) {
    if (!isAuthError(error)) {
      throw error;
    }
  }

  if (options.allowRefresh === false) {
    throw new Error('UNAUTHORIZED');
  }

  try {
    const tokens = await refreshAuthTokens();
    await setAuthCookies({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    return request(tokens.accessToken);
  } catch {
    throw new Error('UNAUTHORIZED');
  }
}
