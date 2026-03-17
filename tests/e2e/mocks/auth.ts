import type { Page } from '@playwright/test';

import { buildApiError, buildApiSuccess, mockJsonRoute } from './http';

const AUTH_ME_BFF_PATH = '/bff/auth/me';
const AUTH_RESTORE_BFF_PATH = '/bff/auth/restore';

export async function mockAuthGuest(page: Page): Promise<void> {
  await mockJsonRoute(page, {
    path: AUTH_ME_BFF_PATH,
    method: 'GET',
    status: 200,
    body: {
      authenticated: false,
    },
  });
}

export async function mockAuthAuthed(page: Page): Promise<void> {
  await mockJsonRoute(page, {
    path: AUTH_ME_BFF_PATH,
    method: 'GET',
    status: 200,
    body: {
      authenticated: true,
    },
  });
}

type RestoreAccountResponseOverrides = Partial<{
  user_id: number;
  user_type: string;
  access_token: string;
  refresh_token: string;
}>;

export async function mockRestoreAccountSuccess(
  page: Page,
  overrides: RestoreAccountResponseOverrides = {},
): Promise<void> {
  await mockJsonRoute(page, {
    path: AUTH_RESTORE_BFF_PATH,
    method: 'POST',
    status: 200,
    body: {
      ...buildApiSuccess(
        {
          user_id: 1001,
          user_type: 'USER',
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          ...overrides,
        },
        { message: '복구 완료' },
      ),
    } as const,
  });
}

export async function mockRestoreAccountBusinessError(
  page: Page,
  options: {
    code?: string;
    message?: string;
  } = {},
): Promise<void> {
  await mockJsonRoute(page, {
    path: AUTH_RESTORE_BFF_PATH,
    method: 'POST',
    status: 400,
    body: buildApiError({
      code: options.code ?? 'RESTORE_ACCOUNT_FAILED',
      message: options.message ?? '복구 처리에 실패했습니다.',
    }),
  });
}
