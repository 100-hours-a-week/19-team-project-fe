import { readAccessToken } from './accessToken';
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

function refreshInitWithLatestToken(init?: ApiFetchOptions): ApiFetchOptions | undefined {
  if (!isBrowser() || !init?.headers) return init;
  const token = readAccessToken();
  if (!token) return init;
  const headers = new Headers(init.headers);
  if (!headers.has('Authorization')) return init;
  headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers };
}

function normalizeJsonBody(init?: ApiFetchOptions): ApiFetchOptions | undefined {
  if (!init) return init;
  const body = init.body;
  if (!body || typeof body !== 'object') return init;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const isSearchParams = typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;
  const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;
  const isArrayBuffer = typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer;
  const isArrayBufferView = typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(body);
  const isReadableStream =
    typeof ReadableStream !== 'undefined' && body instanceof ReadableStream;

  if (isFormData || isSearchParams || isBlob || isArrayBuffer || isArrayBufferView || isReadableStream) {
    return init;
  }

  const headers = new Headers(init.headers);
  const contentType = headers.get('Content-Type') ?? headers.get('content-type');
  if (!contentType) {
    headers.set('Content-Type', 'application/json');
  } else if (!contentType.includes('application/json')) {
    return init;
  }

  return {
    ...init,
    headers,
    body: JSON.stringify(body),
  };
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
  const normalizedInit = normalizeJsonBody(fetchInit);
  const res = await fetch(input, {
    credentials: 'include',
    ...(normalizedInit ?? fetchInit),
  });

  if (res.status === 401 && retryOnUnauthorized) {
    const requestUrl = getRequestUrl(input);
    const isTokenRefresh = requestUrl?.includes('/bff/auth/tokens') ?? false;
    if (!isTokenRefresh) {
      const refreshed = await tryRefreshAuthTokens();
      if (refreshed) {
        const retryInit = refreshInitWithLatestToken({ ...init, retryOnUnauthorized: false });
        return apiFetch<T>(input, retryInit);
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
