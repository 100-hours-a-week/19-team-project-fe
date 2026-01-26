'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/shared/ui/toast';
import { BusinessError, HttpError } from './errors';
import type { CommonErrorCode } from './types';

const COMMON_ERROR_MESSAGES: Record<CommonErrorCode, string> = {
  INVALID_CURSOR: '요청이 만료됐어요. 다시 시도해 주세요.',
  AUTH_UNAUTHORIZED: '로그인이 필요해요.',
  AUTH_INVALID_TOKEN: '로그인이 만료됐어요. 다시 로그인해 주세요.',
  FORBIDDEN: '권한이 없어요.',
  INTERNAL_SERVER_ERROR: '잠시 후 다시 시도해 주세요.',
};

const COMMON_ERROR_CODES = new Set<CommonErrorCode>([
  'INVALID_CURSOR',
  'AUTH_UNAUTHORIZED',
  'AUTH_INVALID_TOKEN',
  'FORBIDDEN',
  'INTERNAL_SERVER_ERROR',
]);

function isCommonErrorCode(code: string): code is CommonErrorCode {
  return COMMON_ERROR_CODES.has(code as CommonErrorCode);
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
      if (error instanceof BusinessError && isCommonErrorCode(error.code)) {
        pushToast(COMMON_ERROR_MESSAGES[error.code]);
        if (error.code === 'AUTH_UNAUTHORIZED') {
          router.replace(redirectTo);
        }
        if (error.code === 'AUTH_INVALID_TOKEN') {
          const handled = onInvalidToken ? await onInvalidToken() : false;
          if (!handled) {
            router.replace(redirectTo);
          }
        }
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
