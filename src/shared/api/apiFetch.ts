import { BusinessError, HttpError } from './errors';
import type { ApiResponse } from './types';

const DEFAULT_SUCCESS_CODES = ['SUCCESS', 'OK', 'CREATED'];

export type ApiFetchOptions = RequestInit & {
  successCodes?: string[];
  retryOnUnauthorized?: boolean;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getRequestUrl(input: RequestInfo): string | null {
  if (typeof input === 'string') return input;
  if (typeof URL !== 'undefined' && input instanceof URL) return input.toString();
  if (typeof Request !== 'undefined' && input instanceof Request) return input.url;
  return null;
}

async function tryRefreshAuthTokens(): Promise<boolean> {
  if (!isBrowser()) return false;
  try {
    const { refreshAuthTokens } = await import('./refreshTokens.client');
    return await refreshAuthTokens().catch(() => false);
  } catch {
    return false;
  }
}

export async function apiFetch<T>(input: RequestInfo, init?: ApiFetchOptions): Promise<T> {
  const {
    successCodes = DEFAULT_SUCCESS_CODES,
    retryOnUnauthorized = true,
    ...fetchInit
  } = init ?? {};
  const res = await fetch(input, {
    credentials: 'include',
    ...fetchInit,
  });

  if (res.status === 401 && retryOnUnauthorized) {
    const requestUrl = getRequestUrl(input);
    const isTokenRefresh = requestUrl?.includes('/bff/auth/tokens') ?? false;
    if (!isTokenRefresh) {
      const refreshed = await tryRefreshAuthTokens();
      if (refreshed) {
        return apiFetch<T>(input, { ...init, retryOnUnauthorized: false });
      }
    }
  }

  if (!res.ok) {
    try {
      const errorBody = (await res.json()) as ApiResponse<unknown>;
      if (errorBody && typeof errorBody.code === 'string') {
        throw new BusinessError(errorBody.code, errorBody.message, errorBody.data);
      }
    } catch (parseError) {
      if (parseError instanceof BusinessError) {
        throw parseError;
      }
    }
    throw new HttpError(res.status, res.statusText, res.url);
  }

  const body = (await res.json()) as ApiResponse<T>;

  if (!successCodes.includes(body.code)) {
    throw new BusinessError(body.code, body.message, body.data);
  }

  return body.data;
}
