import type { Page } from '@playwright/test';

import { buildApiError, buildApiSuccess, mockJsonRoute, type JsonValue } from './http';

type Expert = {
  user_id: number;
  nickname: string;
  profile_image_url: string;
  introduction: string;
  career_level: {
    id: number;
    level: string;
  };
  company_name: string;
  verified: boolean;
  rating_avg: number;
  rating_count: number;
  jobs: Array<{ id: number; name: string }>;
  skills: Array<{ id: number; name: string; display_order?: number }>;
  last_active_at: string;
};

type ExpertDetail = Expert & {
  verified_at: string | null;
};

type ExpertReview = {
  chat_review_id: number;
  chat_id: number;
  reviewer: {
    user_id: number;
    nickname: string;
    profile_image_url?: string | null;
    user_type?: string;
  };
  rating: number;
  comment: string;
  created_at: string;
};

const EXPERTS_API_PATH = '/api/v1/experts';

export function createExpert(overrides: Partial<Expert> = {}): Expert {
  return {
    user_id: 1,
    nickname: '김현직',
    profile_image_url: 'https://refit.test/profile-1.png',
    introduction: '백엔드 현직자입니다.',
    career_level: {
      id: 3,
      level: '시니어',
    },
    company_name: 'RE-FIT',
    verified: true,
    rating_avg: 4.8,
    rating_count: 12,
    jobs: [{ id: 1, name: '백엔드' }],
    skills: [{ id: 1, name: 'Java', display_order: 1 }],
    last_active_at: '2026-03-17T01:00:00.000Z',
    ...overrides,
  };
}

export function createExpertDetail(overrides: Partial<ExpertDetail> = {}): ExpertDetail {
  return {
    ...createExpert(),
    verified_at: '2026-03-01T01:00:00.000Z',
    ...overrides,
  };
}

export function createExpertReview(overrides: Partial<ExpertReview> = {}): ExpertReview {
  return {
    chat_review_id: 1,
    chat_id: 101,
    reviewer: {
      user_id: 55,
      nickname: '리뷰작성자',
      profile_image_url: 'https://refit.test/reviewer.png',
      user_type: 'USER',
    },
    rating: 5,
    comment: '정말 도움이 되었습니다.',
    created_at: '2026-03-17T01:00:00.000Z',
    ...overrides,
  };
}

export async function mockExpertsSearch(page: Page, experts: Expert[]): Promise<void> {
  await mockJsonRoute(page, {
    path: EXPERTS_API_PATH,
    method: 'GET',
    status: 200,
    body: buildApiSuccess({
      experts,
      next_cursor: null,
      has_more: false,
    }),
  });
}

export async function mockExpertDetail(
  page: Page,
  userId: number,
  detail: ExpertDetail,
): Promise<void> {
  await mockJsonRoute(page, {
    path: `${EXPERTS_API_PATH}/${userId}`,
    method: 'GET',
    status: 200,
    body: buildApiSuccess(detail),
  });
}

export async function mockExpertReviews(
  page: Page,
  userId: number,
  options: {
    reviews: ExpertReview[];
    nextCursor?: string | null;
    hasMore?: boolean;
    cursor?: string | null;
  },
): Promise<void> {
  await page.route(`**/bff/experts/${userId}/reviews**`, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }

    const requestUrl = new URL(route.request().url());
    const cursor = requestUrl.searchParams.get('cursor');
    const expectedCursor = options.cursor ?? null;

    if (cursor !== expectedCursor) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(
        buildApiSuccess({
          reviews: options.reviews,
          next_cursor: options.nextCursor ?? null,
          has_more: options.hasMore ?? false,
        }),
      ),
    });
  });
}

export async function mockExpertsSearchError(page: Page, message: string): Promise<void> {
  await mockJsonRoute(page, {
    path: EXPERTS_API_PATH,
    method: 'GET',
    status: 400,
    body: buildApiError({ code: 'EXPERT_SEARCH_FAILED', message }),
  });
}

export async function mockExpertDetailError(
  page: Page,
  userId: number,
  message: string,
): Promise<void> {
  await mockJsonRoute(page, {
    path: `${EXPERTS_API_PATH}/${userId}`,
    method: 'GET',
    status: 400,
    body: buildApiError({ code: 'EXPERT_DETAIL_FAILED', message, data: null as JsonValue }),
  });
}
