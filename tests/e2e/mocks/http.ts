import type { Page, Route } from '@playwright/test';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type MockJsonRouteOptions = {
  path: string;
  method?: HttpMethod;
  status?: number;
  body: JsonValue;
};

export function buildApiSuccess<T extends JsonValue>(
  data: T,
  options: { code?: string; message?: string } = {},
): JsonValue {
  return {
    code: options.code ?? 'SUCCESS',
    message: options.message ?? '요청 성공',
    data,
  };
}

export function buildApiError(options: {
  code: string;
  message: string;
  data?: JsonValue;
}): JsonValue {
  return {
    code: options.code,
    message: options.message,
    data: options.data ?? null,
  };
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toUrlPathWithOptionalQueryRegex(path: string): RegExp {
  const normalizedPath = normalizePath(path);
  const escapedPath = escapeRegExp(normalizedPath);
  return new RegExp(`${escapedPath}(?:\\?.*)?$`);
}

async function fulfillJson(route: Route, status: number, body: JsonValue): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(body),
  });
}

export async function mockJsonRoute(page: Page, options: MockJsonRouteOptions): Promise<void> {
  const method = options.method ?? 'GET';
  const status = options.status ?? 200;

  await page.route(toUrlPathWithOptionalQueryRegex(options.path), async (route) => {
    if (route.request().method() !== method) {
      await route.fallback();
      return;
    }

    await fulfillJson(route, status, options.body);
  });
}

type UnmockedBffGuard = {
  assertNoUnmockedRequests: () => void;
};

export async function installUnmockedBffGuard(page: Page): Promise<UnmockedBffGuard> {
  const unmockedRequests: string[] = [];

  await page.route('**/bff/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();
    unmockedRequests.push(`${method} ${url}`);
    await route.fulfill({
      status: 501,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({
        message: 'UNMOCKED_BFF_REQUEST',
        method,
        url,
      }),
    });
  });

  return {
    assertNoUnmockedRequests() {
      if (unmockedRequests.length === 0) return;
      throw new Error(
        `[E2E] Unmocked BFF requests detected:\\n${unmockedRequests
          .map((request) => `- ${request}`)
          .join('\\n')}`,
      );
    },
  };
}
