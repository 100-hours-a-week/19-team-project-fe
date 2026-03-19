import { test as base } from '@playwright/test';

import {
  mockAuthAuthed,
  mockAuthGuest,
  mockRestoreAccountBusinessError,
  mockRestoreAccountSuccess,
} from '../mocks/auth';
import {
  createChatRequestItem,
  createChatSummary,
  createUserMe,
  mockChatListByStatus,
  mockChatListError,
  mockChatRequestsByDirection,
  mockChatRequestsError,
  mockUpdateChatRequestStatus,
  mockUpdateChatRequestStatusError,
  mockUserMe,
} from '../mocks/chat';
import {
  createResumeDetail,
  createResumeListItem,
  mockCreateResume,
  mockResumeDetail,
  mockResumeParseTaskCompleted,
  mockResumesList,
  mockResumesListBusinessError,
} from '../mocks/resume';
import {
  createReportDetail,
  createReportSummary,
  mockDeleteReport,
  mockReportDetail,
  mockReportDetailError,
  mockReportsList,
  mockReportsListError,
} from '../mocks/report';

type ApiMocks = {
  authGuest: () => Promise<void>;
  authAuthed: () => Promise<void>;
  restoreAccountSuccess: () => Promise<void>;
  restoreAccountBusinessError: (message?: string) => Promise<void>;
  resumesList: (count?: number) => Promise<void>;
  resumesListError: (message?: string) => Promise<void>;
  resumeDetail: (resumeId: number) => Promise<void>;
  resumeParseTaskCompleted: (taskId: string) => Promise<void>;
  createResumeSuccess: (resumeId?: number) => Promise<void>;
  reportsList: (count?: number) => Promise<void>;
  reportDetail: (reportId: number) => Promise<void>;
  deleteReportSuccess: (reportId: number) => Promise<void>;
  reportsListError: (message?: string) => Promise<void>;
  reportDetailError: (reportId: number, message?: string) => Promise<void>;
  userMe: (options?: { id?: number; userType?: 'USER' | 'EXPERT'; nickname?: string }) => Promise<void>;
  chatList: (options?: { activeCount?: number; closedCount?: number }) => Promise<void>;
  chatListError: (message?: string) => Promise<void>;
  chatRequests: (options?: { receivedCount?: number; sentCount?: number }) => Promise<void>;
  chatRequestsError: (direction: 'received' | 'sent', message?: string) => Promise<void>;
  chatRequestUpdateSuccess: (requestId: number, chatId?: number | null) => Promise<void>;
  chatRequestUpdateError: (requestId: number, message?: string) => Promise<void>;
};

export const test = base.extend<{ apiMocks: ApiMocks }>({
  apiMocks: async ({ page }, applyApiMocks) => {
    const apiMocks: ApiMocks = {
      authGuest: async () => {
        await mockAuthGuest(page);
      },
      authAuthed: async () => {
        await mockAuthAuthed(page);
      },
      restoreAccountSuccess: async () => {
        await mockRestoreAccountSuccess(page);
      },
      restoreAccountBusinessError: async (message?: string) => {
        await mockRestoreAccountBusinessError(page, { message });
      },
      resumesList: async (count: number = 1) => {
        const items = Array.from({ length: count }, (_, index) =>
          createResumeListItem({
            resumeId: index + 1,
            title: `이력서 ${index + 1}`,
          }),
        );
        await mockResumesList(page, items);
      },
      resumesListError: async (message?: string) => {
        await mockResumesListBusinessError(page, message ?? '이력서를 불러오지 못했습니다.');
      },
      resumeDetail: async (resumeId: number) => {
        await mockResumeDetail(page, resumeId, createResumeDetail({ resumeId }));
      },
      resumeParseTaskCompleted: async (taskId: string) => {
        await mockResumeParseTaskCompleted(page, taskId);
      },
      createResumeSuccess: async (resumeId?: number) => {
        await mockCreateResume(page, resumeId);
      },
      reportsList: async (count: number = 1) => {
        const reports = Array.from({ length: count }, (_, index) =>
          createReportSummary({
            reportId: index + 1,
            title: `리포트 ${index + 1}`,
          }),
        );
        await mockReportsList(page, reports);
      },
      reportDetail: async (reportId: number) => {
        await mockReportDetail(page, reportId, createReportDetail({ reportId }));
      },
      deleteReportSuccess: async (reportId: number) => {
        await mockDeleteReport(page, reportId);
      },
      reportsListError: async (message?: string) => {
        await mockReportsListError(page, message ?? '리포트를 불러오지 못했습니다.');
      },
      reportDetailError: async (reportId: number, message?: string) => {
        await mockReportDetailError(page, reportId, message ?? '리포트를 불러오지 못했습니다.');
      },
      userMe: async (options) => {
        await mockUserMe(
          page,
          createUserMe({
            id: options?.id ?? 1,
            nickname: options?.nickname ?? '테스트유저',
            user_type: options?.userType ?? 'USER',
          }),
        );
      },
      chatList: async (options) => {
        const activeChats = Array.from({ length: options?.activeCount ?? 1 }, (_, index) =>
          createChatSummary({
            chat_id: 1000 + index + 1,
            receiver: {
              user_id: 200 + index + 1,
              nickname: `현직자 ${index + 1}`,
              profile_image_url: null,
              user_type: 'EXPERT',
            },
            last_message: {
              message_id: 3000 + index + 1,
              content: `최근 메시지 ${index + 1}`,
              created_at: '2026-03-17T01:10:00.000Z',
              last_message_at: '2026-03-17T01:10:00.000Z',
            },
          }),
        );
        const closedChats = Array.from({ length: options?.closedCount ?? 0 }, (_, index) =>
          createChatSummary({
            chat_id: 9000 + index + 1,
            status: 'CLOSED',
            receiver: {
              user_id: 300 + index + 1,
              nickname: `종료 현직자 ${index + 1}`,
              profile_image_url: null,
              user_type: 'EXPERT',
            },
          }),
        );
        await mockChatListByStatus(page, {
          activeChats,
          closedChats,
        });
      },
      chatListError: async (message?: string) => {
        await mockChatListError(page, message ?? '채팅 목록을 불러오지 못했습니다.');
      },
      chatRequests: async (options) => {
        const received = Array.from({ length: options?.receivedCount ?? 0 }, (_, index) =>
          createChatRequestItem({
            chat_request_id: 7000 + index + 1,
            requester: {
              user_id: 400 + index + 1,
              nickname: `요청자 ${index + 1}`,
              profile_image_url: null,
              user_type: 'USER',
            },
            receiver: {
              user_id: 500 + index + 1,
              nickname: `현직자 ${index + 1}`,
              profile_image_url: null,
              user_type: 'EXPERT',
            },
          }),
        );
        const sent = Array.from({ length: options?.sentCount ?? 0 }, (_, index) =>
          createChatRequestItem({
            chat_request_id: 8000 + index + 1,
            requester: {
              user_id: 1,
              nickname: '테스트유저',
              profile_image_url: null,
              user_type: 'USER',
            },
            receiver: {
              user_id: 600 + index + 1,
              nickname: `전문가 ${index + 1}`,
              profile_image_url: null,
              user_type: 'EXPERT',
            },
          }),
        );
        await mockChatRequestsByDirection(page, {
          received,
          sent,
        });
      },
      chatRequestsError: async (direction, message?: string) => {
        await mockChatRequestsError(page, direction, message ?? '요청 목록을 불러오지 못했습니다.');
      },
      chatRequestUpdateSuccess: async (requestId, chatId) => {
        await mockUpdateChatRequestStatus(page, requestId, chatId ?? null);
      },
      chatRequestUpdateError: async (requestId, message?: string) => {
        await mockUpdateChatRequestStatusError(
          page,
          requestId,
          message ?? '요청 처리에 실패했습니다.',
        );
      },
    };

    await applyApiMocks(apiMocks);
  },
});

export { expect } from '@playwright/test';
