import type { Page } from '@playwright/test';

import { buildApiError, buildApiSuccess, mockJsonRoute, type JsonValue } from './http';

type ReportSummary = {
  reportId: number;
  title: string;
  status: string;
  chatRoomId: number;
  resumeId: number;
  jobPostUrl: string;
  createdAt: string;
  updatedAt: string;
};

type ReportDetail = {
  reportId: number;
  userId: number;
  expertId: number;
  chatRoomId: number;
  chatFeedbackId: number;
  chatRequestId: number;
  resumeId: number;
  title: string;
  status: string;
  resultJson: Record<string, JsonValue>;
  jobPostUrl: string;
  createdAt: string;
  updatedAt: string;
};

const REPORTS_BFF_PATH = '/bff/reports';

export function createReportSummary(overrides: Partial<ReportSummary> = {}): ReportSummary {
  return {
    reportId: 1,
    title: '백엔드 피드백 리포트',
    status: 'COMPLETED',
    chatRoomId: 101,
    resumeId: 201,
    jobPostUrl: 'https://refit.test/jobs/1',
    createdAt: '2026-03-17T01:00:00.000Z',
    updatedAt: '2026-03-17T02:00:00.000Z',
    ...overrides,
  };
}

export function createReportDetail(overrides: Partial<ReportDetail> = {}): ReportDetail {
  return {
    reportId: 1,
    userId: 1,
    expertId: 2,
    chatRoomId: 101,
    chatFeedbackId: 301,
    chatRequestId: 401,
    resumeId: 201,
    title: '백엔드 피드백 리포트',
    status: 'COMPLETED',
    resultJson: {
      basic_info: {
        report_date: '2026-03-17',
        job_post_title: 'Backend Engineer',
        job_post_position: 'Backend',
      },
      overall_evaluation: {
        job_fit: 'HIGH',
        pass_probability: 'MEDIUM',
      },
      final_comment: {
        ai_comment: '구조가 좋습니다.',
        mentor_comment: '성과 중심으로 보완하세요.',
      },
    },
    jobPostUrl: 'https://refit.test/jobs/1',
    createdAt: '2026-03-17T01:00:00.000Z',
    updatedAt: '2026-03-17T02:00:00.000Z',
    ...overrides,
  };
}

export async function mockReportsList(page: Page, reports: ReportSummary[]): Promise<void> {
  await mockJsonRoute(page, {
    path: REPORTS_BFF_PATH,
    method: 'GET',
    status: 200,
    body: buildApiSuccess({ reports }),
  });
}

export async function mockReportDetail(
  page: Page,
  reportId: number,
  detail: ReportDetail,
): Promise<void> {
  await mockJsonRoute(page, {
    path: `${REPORTS_BFF_PATH}/${reportId}`,
    method: 'GET',
    status: 200,
    body: buildApiSuccess(detail),
  });
}

export async function mockDeleteReport(page: Page, reportId: number): Promise<void> {
  await mockJsonRoute(page, {
    path: `${REPORTS_BFF_PATH}/${reportId}`,
    method: 'DELETE',
    status: 200,
    body: buildApiSuccess({}),
  });
}

export async function mockReportsListError(page: Page, message: string): Promise<void> {
  await mockJsonRoute(page, {
    path: REPORTS_BFF_PATH,
    method: 'GET',
    status: 400,
    body: buildApiError({ code: 'REPORT_LIST_FAILED', message }),
  });
}

export async function mockReportDetailError(
  page: Page,
  reportId: number,
  message: string,
): Promise<void> {
  await mockJsonRoute(page, {
    path: `${REPORTS_BFF_PATH}/${reportId}`,
    method: 'GET',
    status: 400,
    body: buildApiError({ code: 'REPORT_DETAIL_FAILED', message }),
  });
}
