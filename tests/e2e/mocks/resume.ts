import type { Page } from '@playwright/test';

import { buildApiError, buildApiSuccess, mockJsonRoute, type JsonValue } from './http';

type ResumeListItem = {
  resumeId: number;
  title: string;
  status?: string;
  isFresher: boolean;
  educationLevel: string;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
};

type ResumeDetail = {
  resumeId: number;
  title: string;
  isFresher: boolean;
  educationLevel: string;
  fileUrl: string;
  contentJson: Record<string, JsonValue> | null;
  createdAt: string;
  updatedAt: string;
};

const RESUMES_BFF_PATH = '/bff/resumes';
const RESUME_TASKS_BFF_PATH = '/bff/resumes/tasks';

export function createResumeListItem(overrides: Partial<ResumeListItem> = {}): ResumeListItem {
  return {
    resumeId: 1,
    title: '백엔드 이력서',
    status: 'READY',
    isFresher: false,
    educationLevel: '4년제 졸업',
    fileUrl: 'https://refit.test/resume.pdf',
    createdAt: '2026-03-17T01:00:00.000Z',
    updatedAt: '2026-03-17T01:00:00.000Z',
    ...overrides,
  };
}

export function createResumeDetail(overrides: Partial<ResumeDetail> = {}): ResumeDetail {
  return {
    resumeId: 1,
    title: '백엔드 이력서',
    isFresher: false,
    educationLevel: '4년제 졸업',
    fileUrl: 'https://refit.test/resume.pdf',
    contentJson: {
      summary: '백엔드 개발 경험 3년',
      careers: ['Refit | Backend Developer | 2023-01 - 2026-02'],
    },
    createdAt: '2026-03-17T01:00:00.000Z',
    updatedAt: '2026-03-17T01:00:00.000Z',
    ...overrides,
  };
}

export async function mockResumesList(page: Page, resumes: ResumeListItem[]): Promise<void> {
  await mockJsonRoute(page, {
    path: RESUMES_BFF_PATH,
    method: 'GET',
    status: 200,
    body: buildApiSuccess({ resumes }),
  });
}

export async function mockResumesListBusinessError(page: Page, message: string): Promise<void> {
  await mockJsonRoute(page, {
    path: RESUMES_BFF_PATH,
    method: 'GET',
    status: 400,
    body: buildApiError({ code: 'RESUME_LIST_FAILED', message }),
  });
}

export async function mockResumeDetail(
  page: Page,
  resumeId: number,
  detail: ResumeDetail,
): Promise<void> {
  await mockJsonRoute(page, {
    path: `${RESUMES_BFF_PATH}/${resumeId}`,
    method: 'GET',
    status: 200,
    body: buildApiSuccess(detail),
  });
}

export async function mockResumeParseTaskCompleted(page: Page, taskId: string): Promise<void> {
  await mockJsonRoute(page, {
    path: `${RESUME_TASKS_BFF_PATH}/${encodeURIComponent(taskId)}`,
    method: 'GET',
    status: 200,
    body: buildApiSuccess({
      taskId,
      status: 'COMPLETED',
      result: {
        is_fresher: false,
        education_level: '4년제 졸업',
        content_json: {
          summary: '자동 파싱 요약',
          careers: ['Auto Career 1'],
        },
      },
    }),
  });
}

export async function mockCreateResume(page: Page, resumeId: number = 101): Promise<void> {
  await mockJsonRoute(page, {
    path: RESUMES_BFF_PATH,
    method: 'POST',
    status: 201,
    body: buildApiSuccess(
      {
        resumeId,
      },
      {
        code: 'CREATED',
        message: '생성 완료',
      },
    ),
  });
}
