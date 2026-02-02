import 'server-only';

import { cookies } from 'next/headers';

import { apiFetch, BusinessError, HttpError } from '@/shared/api';
import { refreshAuthTokens } from './refreshTokens.server';

type AuthErrorCode =
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_INVALID_TOKEN'
  | 'AUTH_UNAUTHORIZED'
  | 'UNAUTHORIZED';

const AUTH_ERROR_CODES = new Set<AuthErrorCode>([
  'AUTH_TOKEN_EXPIRED',
  'AUTH_INVALID_TOKEN',
  'AUTH_UNAUTHORIZED',
  'UNAUTHORIZED',
]);

const withAuthorization = (headers: HeadersInit | undefined, token: string): HeadersInit => {
  if (!headers) return { Authorization: `Bearer ${token}` };
  if (headers instanceof Headers) {
    const next = new Headers(headers);
    next.set('Authorization', `Bearer ${token}`);
    return next;
  }
  if (Array.isArray(headers)) {
    return [...headers.filter(([key]) => key.toLowerCase() !== 'authorization'), ['Authorization', `Bearer ${token}`]];
  }
  return { ...headers, Authorization: `Bearer ${token}` };
};

export async function apiFetchWithRefresh<T>(
  input: RequestInfo,
  init?: RequestInit,
  accessToken?: string,
  allowRefresh: boolean = true,
): Promise<T> {
  const cookieStore = await cookies();
  const token = accessToken ?? cookieStore.get('access_token')?.value;

  if (!token) {
    throw new Error('UNAUTHORIZED');
  }

  try {
    return await apiFetch<T>(input, {
      ...init,
      headers: withAuthorization(init?.headers, token),
    });
  } catch (error) {
    const isAuthBusinessError =
      error instanceof BusinessError && AUTH_ERROR_CODES.has(error.code as AuthErrorCode);
    const isAuthHttpError = error instanceof HttpError && error.status === 401;

    if (!isAuthBusinessError && !isAuthHttpError) {
      throw error;
    }
    if (!allowRefresh) {
      throw error;
    }

    const refreshed = await refreshAuthTokens().catch(() => null);
    if (!refreshed) {
      throw error;
    }

    return apiFetch<T>(input, {
      ...init,
      headers: withAuthorization(init?.headers, refreshed.accessToken),
    });
  }
}
