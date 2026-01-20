import { BusinessError, HttpError } from './errors';
import type { ApiResponse } from './types';

const DEFAULT_SUCCESS_CODES = ['SUCCESS'];

export type ApiFetchOptions = RequestInit & {
  successCodes?: string[];
};

export async function apiFetch<T>(input: RequestInfo, init?: ApiFetchOptions): Promise<T> {
  const { successCodes = DEFAULT_SUCCESS_CODES, ...fetchInit } = init ?? {};
  const res = await fetch(input, {
    credentials: 'include',
    ...fetchInit,
  });

  if (!res.ok) {
    throw new HttpError(res.status, res.statusText, res.url);
  }

  const body = (await res.json()) as ApiResponse<T>;

  if (!successCodes.includes(body.code)) {
    throw new BusinessError(body.code, body.message, body.data);
  }

  return body.data;
}
