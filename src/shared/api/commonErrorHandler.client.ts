'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/shared/ui/toast';
import { refreshAuthTokens } from './refreshTokens.client';
import { BusinessError, HttpError } from './errors';
import type { CommonErrorCode } from './types';

const COMMON_ERROR_MESSAGES: Record<CommonErrorCode, string> = {
  INVALID_CURSOR: '요청이 만료됐어요. 다시 시도해 주세요.',
  AUTH_UNAUTHORIZED: '로그인이 필요해요.',
  AUTH_TOKEN_EXPIRED: '로그인이 만료됐어요. 다시 로그인해 주세요.',
  AUTH_INVALID_TOKEN: '로그인이 만료됐어요. 다시 로그인해 주세요.',
  AUTH_INVALID_REQUEST: '로그인 요청이 올바르지 않아요.',
  AUTH_INVALID_CREDENTIALS: '로그인 정보가 올바르지 않아요.',
  AUTH_FORBIDDEN: '접근 권한이 없어요.',
  EXPERT_USER_ID_INVALID: '요청한 현직자 정보가 올바르지 않아요.',
  EXPERT_FILTER_INVALID: '필터 값이 올바르지 않아요.',
  EXPERT_NOT_FOUND: '현직자 정보를 찾을 수 없어요.',
  CHAT_RECEIVER_NOT_FOUND: '요청한 현직자를 찾을 수 없어요.',
  CHAT_REQUEST_TYPE_INVALID: '요청 유형이 올바르지 않아요.',
  CHAT_RECEIVER_IS_SELF: '본인에게는 채팅을 요청할 수 없어요.',
  CONFLICT: '이미 채팅 요청이 있어요.',
  CHAT_NOT_FOUND: '채팅방을 찾을 수 없어요.',
  FORBIDDEN: '권한이 없어요.',
  INTERNAL_SERVER_ERROR: '잠시 후 다시 시도해 주세요.',
};

const COMMON_ERROR_CODES = new Set<CommonErrorCode>([
  'INVALID_CURSOR',
  'AUTH_UNAUTHORIZED',
  'AUTH_TOKEN_EXPIRED',
  'AUTH_INVALID_TOKEN',
  'AUTH_INVALID_REQUEST',
  'AUTH_INVALID_CREDENTIALS',
  'AUTH_FORBIDDEN',
  'EXPERT_USER_ID_INVALID',
  'EXPERT_FILTER_INVALID',
  'EXPERT_NOT_FOUND',
  'CHAT_RECEIVER_NOT_FOUND',
  'CHAT_REQUEST_TYPE_INVALID',
  'CHAT_RECEIVER_IS_SELF',
  'CONFLICT',
  'CHAT_NOT_FOUND',
  'FORBIDDEN',
  'INTERNAL_SERVER_ERROR',
]);

function isCommonErrorCode(code: string): code is CommonErrorCode {
  return COMMON_ERROR_CODES.has(code as CommonErrorCode);
}

function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }
  const rawMessage =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message ?? '')
        : '';
  const rawName =
    error && typeof error === 'object' && 'name' in error
      ? String((error as { name?: unknown }).name ?? '')
      : '';

  if (error instanceof Error && error instanceof TypeError) return true;
  if (rawName.toLowerCase() === 'typeerror') return true;
  return /failed to fetch|networkerror|load failed/i.test(rawMessage);
}

type CommonErrorHandlerOptions = {
  redirectTo?: string;
  onInvalidToken?: () => Promise<boolean> | boolean;
};

export function useCommonApiErrorHandler(options: CommonErrorHandlerOptions = {}) {
  const { redirectTo = '/', onInvalidToken } = options;
  const router = useRouter();
  const { pushToast } = useToast();

  return useCallback(
    async (error: unknown): Promise<boolean> => {
      if (isNetworkError(error)) {
        pushToast('네트워크 오류가 발생했어요. 다시 시도해 주세요.');
        return true;
      }
      if (error instanceof BusinessError && isCommonErrorCode(error.code)) {
        if (error.code === 'AUTH_UNAUTHORIZED') {
          pushToast(COMMON_ERROR_MESSAGES[error.code]);
          router.replace(redirectTo);
          return true;
        }
        if (error.code === 'AUTH_INVALID_TOKEN' || error.code === 'AUTH_TOKEN_EXPIRED') {
          const handled = onInvalidToken
            ? await onInvalidToken()
            : await refreshAuthTokens().catch(() => false);
          if (!handled) {
            pushToast(COMMON_ERROR_MESSAGES[error.code]);
            router.replace(redirectTo);
          }
          return true;
        }
        if (
          error.code === 'AUTH_INVALID_REQUEST' ||
          error.code === 'AUTH_INVALID_CREDENTIALS' ||
          error.code === 'AUTH_FORBIDDEN'
        ) {
          pushToast(COMMON_ERROR_MESSAGES[error.code]);
          router.replace(redirectTo);
          return true;
        }
        pushToast(COMMON_ERROR_MESSAGES[error.code]);
        return true;
      }

      if (error instanceof HttpError) {
        const status = error.status;
        const mappedCode =
          status === 401
            ? 'AUTH_UNAUTHORIZED'
            : status === 403
              ? 'FORBIDDEN'
              : status >= 500
                ? 'INTERNAL_SERVER_ERROR'
                : null;

        if (mappedCode) {
          pushToast(COMMON_ERROR_MESSAGES[mappedCode]);
          if (mappedCode === 'AUTH_UNAUTHORIZED') {
            router.replace(redirectTo);
          }
          return true;
        }
      }

      return false;
    },
    [onInvalidToken, pushToast, redirectTo, router],
  );
}
