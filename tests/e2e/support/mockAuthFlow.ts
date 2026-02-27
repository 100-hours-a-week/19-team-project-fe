import type { Page, Route } from '@playwright/test';

type Actor = 'seeker' | 'expert';

type UserShape = {
  id: number;
  email: string;
  nickname: string;
  user_type: 'USER' | 'EXPERT';
  career_level: { id: number; level: string } | null;
  introduction: string;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
  jobs: Array<{ id: number; name: string }>;
  skills: Array<{ id: number; name: string; display_order: number }>;
};

type ChatRequest = {
  chat_request_id: number;
  requester: { user_id: number; nickname: string; profile_image_url: string | null };
  receiver: { user_id: number; nickname: string; profile_image_url: string | null };
  resume_id: number | null;
  request_type: 'FEEDBACK' | 'COFFEE_CHAT';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  job_post_url: string | null;
  created_at: string;
  responded_at: string | null;
};

type ChatItem = {
  chat_id: number;
  requester: { user_id: number; nickname: string; profile_image_url: string | null };
  receiver: { user_id: number; nickname: string; profile_image_url: string | null };
  last_message: {
    message_id: number;
    content: string;
    last_message_at: string;
  } | null;
  unread_count: number;
  request_type: 'FEEDBACK' | 'COFFEE_CHAT';
  status: 'ACTIVE' | 'CLOSED';
  created_at: string;
  updated_at: string;
};

type ResumeState = {
  resumeId: number;
  title: string;
  isFresher: boolean;
  educationLevel: string;
  fileUrl: string;
  contentJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type ReportState = {
  reportId: number;
  title: string;
  status: string;
  chatRoomId: number;
  resumeId: number;
  jobPostUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type MockFlowState = {
  users: Record<Actor, UserShape>;
  expertList: Array<{
    user_id: number;
    nickname: string;
    profile_image_url: string;
    introduction: string;
    career_level: { id: number; level: string };
    company_name: string;
    verified: boolean;
    rating_avg: number;
    rating_count: number;
    jobs: Array<{ id: number; name: string }>;
    skills: Array<{ id: number; name: string; display_order?: number }>;
    last_active_at: string;
  }>;
  expertDetail: {
    user_id: number;
    nickname: string;
    profile_image_url: string;
    introduction: string;
    company_name: string;
    verified: boolean;
    verified_at: string | null;
    career_level: { id: number; level: string };
    jobs: Array<{ id: number; name: string }>;
    skills: Array<{ id: number; name: string; display_order: number }>;
    rating_avg: number;
    rating_count: number;
    last_active_at: string;
  };
  resumes: ResumeState[];
  chatRequests: ChatRequest[];
  chats: ChatItem[];
  reports: ReportState[];
  nextChatRequestId: number;
  nextChatId: number;
  nextReportId: number;
};

const now = '2026-02-27T12:00:00.000Z';

export function createMockFlowState(): MockFlowState {
  return {
    users: {
      seeker: {
        id: 101,
        email: 'qa-seeker@example.com',
        nickname: '테스터구직자',
        user_type: 'USER',
        career_level: { id: 1, level: '주니어' },
        introduction: '구직자 테스트 계정',
        profile_image_url: null,
        created_at: now,
        updated_at: now,
        jobs: [{ id: 11, name: '프론트엔드' }],
        skills: [{ id: 21, name: 'React', display_order: 1 }],
      },
      expert: {
        id: 202,
        email: 'qa-expert@example.com',
        nickname: '테스터현직자',
        user_type: 'EXPERT',
        career_level: { id: 3, level: '시니어' },
        introduction: '현직자 테스트 계정',
        profile_image_url: null,
        created_at: now,
        updated_at: now,
        jobs: [{ id: 12, name: '백엔드' }],
        skills: [{ id: 22, name: 'Spring', display_order: 1 }],
      },
    },
    expertList: [
      {
        user_id: 202,
        nickname: '테스터현직자',
        profile_image_url: '',
        introduction: '백엔드 현직자입니다.',
        career_level: { id: 3, level: '시니어' },
        company_name: 'Mock Corp',
        verified: true,
        rating_avg: 4.8,
        rating_count: 13,
        jobs: [{ id: 12, name: '백엔드' }],
        skills: [{ id: 22, name: 'Spring', display_order: 1 }],
        last_active_at: now,
      },
    ],
    expertDetail: {
      user_id: 202,
      nickname: '테스터현직자',
      profile_image_url: '',
      introduction: '실무 면접/이력서 피드백 가능합니다.',
      company_name: 'Mock Corp',
      verified: true,
      verified_at: now,
      career_level: { id: 3, level: '시니어' },
      jobs: [{ id: 12, name: '백엔드' }],
      skills: [{ id: 22, name: 'Spring', display_order: 1 }],
      rating_avg: 4.8,
      rating_count: 13,
      last_active_at: now,
    },
    resumes: [
      {
        resumeId: 501,
        title: '초기 이력서',
        isFresher: true,
        educationLevel: '4년제 졸업',
        fileUrl: '',
        contentJson: {
          projects: [
            {
              title: '리핏 프로젝트',
              start_date: '2025-01',
              end_date: '2025-12',
              description: '테스트 프로젝트',
            },
          ],
          careers: [],
          education: ['4년제 졸업'],
          awards: [],
          certificates: [],
          activities: [],
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    chatRequests: [],
    chats: [],
    reports: [],
    nextChatRequestId: 9001,
    nextChatId: 7001,
    nextReportId: 8001,
  };
}

function ok(data: unknown, code = 'OK') {
  return JSON.stringify({ code, message: '', data });
}

function fulfillJson(route: Route, body: string) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json; charset=utf-8',
    body,
  });
}

export async function installMockFlowApi(page: Page, actor: Actor, state: MockFlowState) {
  await page.route('**/*', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    const me = state.users[actor];

    if (pathname === '/bff/auth/me' && method === 'GET') {
      return fulfillJson(route, JSON.stringify({ authenticated: true }));
    }

    if (pathname === '/bff/users/me' && method === 'GET') {
      return fulfillJson(route, ok(me));
    }

    if (pathname === '/bff/users/me/expert-status' && method === 'GET') {
      return fulfillJson(route, ok({ verified: actor === 'expert', submitted: actor === 'expert' }));
    }

    if (pathname === '/api/v1/experts' && method === 'GET') {
      return fulfillJson(
        route,
        ok({
          experts: state.expertList,
          next_cursor: null,
          has_more: false,
        }),
      );
    }

    if (pathname === `/api/v1/experts/${state.expertDetail.user_id}` && method === 'GET') {
      return fulfillJson(route, ok(state.expertDetail));
    }

    if (pathname === '/bff/resumes' && method === 'GET') {
      return fulfillJson(route, ok({ resumes: actor === 'seeker' ? state.resumes : [] }));
    }

    if (/^\/bff\/resumes\/\d+$/.test(pathname) && method === 'GET') {
      const resumeId = Number(pathname.split('/').pop());
      const resume = state.resumes.find((item) => item.resumeId === resumeId);
      if (!resume) {
        return route.fulfill({ status: 404, body: ok(null, 'RESUME_NOT_FOUND') });
      }
      return fulfillJson(
        route,
        ok({
          resume_id: resume.resumeId,
          title: resume.title,
          is_fresher: resume.isFresher,
          education_level: resume.educationLevel,
          file_url: resume.fileUrl,
          content_json: resume.contentJson,
          created_at: resume.createdAt,
          updated_at: resume.updatedAt,
        }),
      );
    }

    if (/^\/bff\/resumes\/\d+$/.test(pathname) && method === 'PATCH') {
      const resumeId = Number(pathname.split('/').pop());
      const resume = state.resumes.find((item) => item.resumeId === resumeId);
      const payload = JSON.parse(request.postData() ?? '{}') as {
        title?: string;
        is_fresher?: boolean;
        education_level?: string;
        content_json?: Record<string, unknown>;
      };
      if (resume) {
        resume.title = payload.title ?? resume.title;
        resume.isFresher = payload.is_fresher ?? resume.isFresher;
        resume.educationLevel = payload.education_level ?? resume.educationLevel;
        resume.contentJson = payload.content_json ?? resume.contentJson;
        resume.updatedAt = now;
      }
      return fulfillJson(route, ok(null));
    }

    if (pathname === '/bff/chat/requests' && method === 'POST') {
      const payload = JSON.parse(request.postData() ?? '{}') as {
        receiver_id: number;
        resume_id: number | null;
        request_type: 'FEEDBACK' | 'COFFEE_CHAT';
        job_post_url: string | null;
      };

      const item: ChatRequest = {
        chat_request_id: state.nextChatRequestId++,
        requester: {
          user_id: state.users.seeker.id,
          nickname: state.users.seeker.nickname,
          profile_image_url: null,
        },
        receiver: {
          user_id: payload.receiver_id,
          nickname: state.users.expert.nickname,
          profile_image_url: null,
        },
        resume_id: payload.resume_id,
        request_type: payload.request_type,
        status: 'PENDING',
        job_post_url: payload.job_post_url,
        created_at: now,
        responded_at: null,
      };
      state.chatRequests.unshift(item);
      return fulfillJson(route, ok({ chat_request_id: item.chat_request_id }, 'CREATED'));
    }

    if (pathname === '/bff/chat/requests' && method === 'GET') {
      const direction = searchParams.get('direction');
      const pending = state.chatRequests.filter((item) => item.status === 'PENDING');
      const filtered =
        direction === 'received'
          ? pending.filter((item) => item.receiver.user_id === me.id)
          : pending.filter((item) => item.requester.user_id === me.id);

      return fulfillJson(route, ok({ requests: filtered, next_cursor: null, has_more: false }));
    }

    if (/^\/bff\/chat\/requests\/\d+$/.test(pathname) && method === 'PATCH') {
      const requestId = Number(pathname.split('/').pop());
      const payload = JSON.parse(request.postData() ?? '{}') as { status?: 'ACCEPTED' | 'REJECTED' };
      const target = state.chatRequests.find((item) => item.chat_request_id === requestId);

      if (!target) {
        return route.fulfill({ status: 404, body: ok(null, 'CHAT_REQUEST_NOT_FOUND') });
      }

      target.status = payload.status ?? target.status;
      target.responded_at = now;

      let chatId: number | null = null;
      if (target.status === 'ACCEPTED') {
        chatId = state.nextChatId++;
        state.chats.unshift({
          chat_id: chatId,
          requester: target.requester,
          receiver: target.receiver,
          last_message: {
            message_id: 1,
            content: '요청이 수락되었습니다.',
            last_message_at: now,
          },
          unread_count: 0,
          request_type: target.request_type,
          status: 'ACTIVE',
          created_at: now,
          updated_at: now,
        });
      }

      return fulfillJson(
        route,
        ok({
          chat_request_id: target.chat_request_id,
          status: target.status,
          chat_id: chatId,
        }),
      );
    }

    if (pathname === '/bff/chat' && method === 'GET') {
      const chats = state.chats.filter(
        (chat) => chat.requester.user_id === me.id || chat.receiver.user_id === me.id,
      );
      return fulfillJson(route, ok({ chats, nextCursor: null, hasMore: false }));
    }

    if (/^\/bff\/chat\/\d+$/.test(pathname) && method === 'GET') {
      const chatId = Number(pathname.split('/').pop());
      const chat = state.chats.find((item) => item.chat_id === chatId);
      if (!chat) return route.fulfill({ status: 404, body: ok(null, 'CHAT_NOT_FOUND') });

      const request = state.chatRequests.find(
        (item) =>
          item.requester.user_id === chat.requester.user_id &&
          item.receiver.user_id === chat.receiver.user_id,
      );

      return fulfillJson(
        route,
        ok({
          chat_id: chat.chat_id,
          requester: chat.requester,
          receiver: chat.receiver,
          resume_id: request?.resume_id ?? state.resumes[0]?.resumeId ?? 0,
          job_post_url: request?.job_post_url ?? '',
          request_type: request?.request_type ?? 'FEEDBACK',
          status: chat.status,
          created_at: chat.created_at,
          closed_at: null,
        }),
      );
    }

    if (/^\/bff\/chat\/\d+\/messages$/.test(pathname) && method === 'GET') {
      const chatId = Number(pathname.split('/')[3]);
      return fulfillJson(
        route,
        ok({
          messages: [
            {
              message_id: 1,
              chat_id: chatId,
              sender: {
                user_id: state.users.expert.id,
                nickname: state.users.expert.nickname,
              },
              message_type: 'TEXT',
              content: '안녕하세요. 요청 확인했습니다.',
              created_at: now,
            },
          ],
          nextCursor: null,
          hasMore: false,
        }),
      );
    }

    if (/^\/bff\/chat\/\d+\/last-read-message$/.test(pathname) && method === 'PATCH') {
      return fulfillJson(route, ok(null));
    }

    if (/^\/bff\/chat\/\d+\/feedback$/.test(pathname) && method === 'POST') {
      const chatId = Number(pathname.split('/')[3]);
      const chat = state.chats.find((item) => item.chat_id === chatId);
      const request = state.chatRequests.find((item) => item.status === 'ACCEPTED');
      if (!chat || !request) {
        return route.fulfill({ status: 404, body: ok(null, 'CHAT_NOT_FOUND') });
      }

      const report: ReportState = {
        reportId: state.nextReportId++,
        title: '모의 생성 리포트',
        status: 'COMPLETED',
        chatRoomId: chatId,
        resumeId: request.resume_id ?? state.resumes[0].resumeId,
        jobPostUrl: request.job_post_url ?? '',
        createdAt: now,
        updatedAt: now,
      };
      state.reports.unshift(report);
      return fulfillJson(route, ok({ report_id: report.reportId }, 'CREATED'));
    }

    if (pathname === '/bff/reports' && method === 'GET') {
      return fulfillJson(route, ok({ reports: actor === 'seeker' ? state.reports : [] }));
    }

    if (pathname === '/bff/notifications' && method === 'GET') {
      return fulfillJson(
        route,
        ok({
          notifications: [],
          unread_count: 0,
          next_cursor: null,
          has_more: false,
        }),
      );
    }

    if (pathname === '/api/v2/events/subscribe' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream; charset=utf-8',
        body: '',
      });
    }

    return route.continue();
  });
}

export async function mockReportGenerated(state: MockFlowState, chatId: number) {
  const acceptedRequest = state.chatRequests.find((item) => item.status === 'ACCEPTED');
  state.reports.unshift({
    reportId: state.nextReportId++,
    title: '모의 생성 리포트',
    status: 'COMPLETED',
    chatRoomId: chatId,
    resumeId: acceptedRequest?.resume_id ?? state.resumes[0].resumeId,
    jobPostUrl: acceptedRequest?.job_post_url ?? '',
    createdAt: now,
    updatedAt: now,
  });
}
