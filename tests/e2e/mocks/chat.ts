import type { Page } from '@playwright/test';

import { buildApiError, buildApiSuccess, mockJsonRoute } from './http';

type UserMe = {
  id: number;
  email: string;
  nickname: string;
  user_type: string;
  career_level: null;
  introduction: string;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
  jobs: Array<{ id: number; name: string }>;
  skills: Array<{ id: number; name: string; display_order: number }>;
};

type ChatSummary = {
  chat_id: number;
  requester: {
    user_id: number;
    nickname: string;
    profile_image_url?: string | null;
    user_type?: string;
  };
  receiver: {
    user_id: number;
    nickname: string;
    profile_image_url?: string | null;
    user_type?: string;
  };
  last_message: {
    message_id: number;
    content: string;
    created_at: string;
    last_message_at: string;
  } | null;
  unread_count: number;
  request_type?: 'FEEDBACK' | 'COFFEE_CHAT';
  status?: string;
  created_at?: string;
  updated_at?: string;
};

type ChatRequestItem = {
  chat_request_id: number;
  requester: {
    user_id: number;
    nickname: string;
    profile_image_url?: string | null;
    user_type?: string;
  };
  receiver: {
    user_id: number;
    nickname: string;
    profile_image_url?: string | null;
    user_type?: string;
  };
  resume_id: number | null;
  request_type: 'FEEDBACK' | 'COFFEE_CHAT';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  job_post_url: string | null;
  created_at: string;
  responded_at: string | null;
};

const USERS_ME_BFF_PATH = '/bff/users/me';
const CHAT_REQUESTS_BFF_PATH = '/bff/chat/requests';

export function createUserMe(overrides: Partial<UserMe> = {}): UserMe {
  return {
    id: 1,
    email: 'user@refit.test',
    nickname: '테스트유저',
    user_type: 'USER',
    career_level: null,
    introduction: '',
    profile_image_url: null,
    created_at: '2026-03-17T01:00:00.000Z',
    updated_at: '2026-03-17T01:00:00.000Z',
    jobs: [],
    skills: [],
    ...overrides,
  };
}

export function createChatSummary(overrides: Partial<ChatSummary> = {}): ChatSummary {
  return {
    chat_id: 1001,
    requester: {
      user_id: 1,
      nickname: '요청자',
      profile_image_url: null,
      user_type: 'USER',
    },
    receiver: {
      user_id: 2,
      nickname: '현직자',
      profile_image_url: null,
      user_type: 'EXPERT',
    },
    last_message: {
      message_id: 1,
      content: '안녕하세요',
      created_at: '2026-03-17T01:10:00.000Z',
      last_message_at: '2026-03-17T01:10:00.000Z',
    },
    unread_count: 0,
    request_type: 'FEEDBACK',
    status: 'ACTIVE',
    created_at: '2026-03-17T01:00:00.000Z',
    updated_at: '2026-03-17T01:10:00.000Z',
    ...overrides,
  };
}

export function createChatRequestItem(overrides: Partial<ChatRequestItem> = {}): ChatRequestItem {
  return {
    chat_request_id: 7001,
    requester: {
      user_id: 11,
      nickname: '요청자A',
      profile_image_url: null,
      user_type: 'USER',
    },
    receiver: {
      user_id: 22,
      nickname: '현직자A',
      profile_image_url: null,
      user_type: 'EXPERT',
    },
    resume_id: 101,
    request_type: 'FEEDBACK',
    status: 'PENDING',
    job_post_url: 'https://refit.test/jobs/1',
    created_at: '2026-03-17T01:00:00.000Z',
    responded_at: null,
    ...overrides,
  };
}

export async function mockUserMe(page: Page, userMe: UserMe): Promise<void> {
  await mockJsonRoute(page, {
    path: USERS_ME_BFF_PATH,
    method: 'GET',
    status: 200,
    body: buildApiSuccess(userMe),
  });
}

export async function mockChatListByStatus(
  page: Page,
  options: {
    activeChats?: ChatSummary[];
    closedChats?: ChatSummary[];
    activeHasMore?: boolean;
    closedHasMore?: boolean;
  } = {},
): Promise<void> {
  const {
    activeChats = [],
    closedChats = [],
    activeHasMore = false,
    closedHasMore = false,
  } = options;

  await page.route('**/bff/chat**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }

    const requestUrl = new URL(route.request().url());
    const status = requestUrl.searchParams.get('status');
    const isClosed = status === 'CLOSED';

    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(
        buildApiSuccess({
          chats: isClosed ? closedChats : activeChats,
          nextCursor: null,
          hasMore: isClosed ? closedHasMore : activeHasMore,
        }),
      ),
    });
  });
}

export async function mockChatListError(page: Page, message: string): Promise<void> {
  await page.route('**/bff/chat**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }

    const requestUrl = new URL(route.request().url());
    const status = requestUrl.searchParams.get('status');

    if (status !== 'ACTIVE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(
          buildApiSuccess({
            chats: [],
            nextCursor: null,
            hasMore: false,
          }),
        ),
      });
      return;
    }

    await route.fulfill({
      status: 400,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(
        buildApiError({
          code: 'CHAT_LIST_FAILED',
          message,
        }),
      ),
    });
  });
}

export async function mockChatRequestsByDirection(
  page: Page,
  options: {
    received?: ChatRequestItem[];
    sent?: ChatRequestItem[];
  } = {},
): Promise<void> {
  const { received = [], sent = [] } = options;

  await page.route('**/bff/chat/requests**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }

    const requestUrl = new URL(route.request().url());
    const direction = requestUrl.searchParams.get('direction');
    const requests = direction === 'sent' ? sent : received;

    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(
        buildApiSuccess({
          requests,
          next_cursor: null,
          has_more: false,
        }),
      ),
    });
  });
}

export async function mockChatRequestsError(
  page: Page,
  direction: 'received' | 'sent',
  message: string,
): Promise<void> {
  await page.route('**/bff/chat/requests**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }

    const requestUrl = new URL(route.request().url());
    const requestDirection = requestUrl.searchParams.get('direction');

    if (requestDirection !== direction) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(
          buildApiSuccess({
            requests: [],
            next_cursor: null,
            has_more: false,
          }),
        ),
      });
      return;
    }

    await route.fulfill({
      status: 400,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(
        buildApiError({
          code: 'CHAT_REQUEST_LIST_FAILED',
          message,
        }),
      ),
    });
  });
}

export async function mockUpdateChatRequestStatus(
  page: Page,
  requestId: number,
  chatId: number | null = null,
): Promise<void> {
  await mockJsonRoute(page, {
    path: `${CHAT_REQUESTS_BFF_PATH}/${requestId}`,
    method: 'PATCH',
    status: 200,
    body: buildApiSuccess({
      chat_request_id: requestId,
      status: chatId ? 'ACCEPTED' : 'REJECTED',
      chat_id: chatId,
    }),
  });
}

export async function mockUpdateChatRequestStatusError(
  page: Page,
  requestId: number,
  message: string,
): Promise<void> {
  await mockJsonRoute(page, {
    path: `${CHAT_REQUESTS_BFF_PATH}/${requestId}`,
    method: 'PATCH',
    status: 400,
    body: buildApiError({
      code: 'CHAT_REQUEST_UPDATE_FAILED',
      message,
    }),
  });
}
