import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { type ApiResponse, BusinessError } from '@/shared/api';
import { updateAgentMessageFeedback } from '@/features/agent.server';
import type { AgentMessageFeedbackRequest } from '@/entities/agent';

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

function unauthorizedResponse() {
  const response: ApiResponse<null> = {
    code: 'AUTH_UNAUTHORIZED',
    message: '인증이 필요합니다.',
    data: null,
  };
  return NextResponse.json(response, { status: 401 });
}

function getBusinessErrorStatus(code: string): number {
  if (code === 'AI_CHAT_NOT_FOUND') return 404;
  if (code === 'AUTH_UNAUTHORIZED' || code === 'AUTH_INVALID_TOKEN' || code === 'UNAUTHORIZED') {
    return 401;
  }
  return 400;
}

export async function PATCH(req: Request, context: { params: Promise<{ message_id?: string }> }) {
  try {
    const { message_id: rawMessageId = '' } = await context.params;
    const messageId = Number(rawMessageId);
    if (Number.isNaN(messageId)) {
      const response: ApiResponse<null> = {
        code: 'INVALID_REQUEST',
        message: 'message_id is required',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const cookieStore = await cookies();
    const accessToken = getAccessToken(req, cookieStore.get('access_token')?.value);
    if (!accessToken) return unauthorizedResponse();

    const payload = (await req.json()) as AgentMessageFeedbackRequest;
    const feedbackValid =
      typeof payload?.feedback === 'boolean' || (payload && payload.feedback === null);

    if (!feedbackValid) {
      const response: ApiResponse<null> = {
        code: 'INVALID_REQUEST',
        message: 'feedback must be boolean or null',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const data = await updateAgentMessageFeedback(messageId, payload, accessToken);
    const response: ApiResponse<typeof data> = {
      code: 'OK',
      message: 'success',
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BusinessError) {
      const response: ApiResponse<unknown> = {
        code: error.code,
        message: error.message,
        data: error.data ?? null,
      };
      return NextResponse.json(response, { status: getBusinessErrorStatus(error.code) });
    }

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    console.error('[Agent Message Feedback Error]', error);
    const response: ApiResponse<null> = {
      code: 'AGENT_MESSAGE_FEEDBACK_FAILED',
      message: 'AGENT_MESSAGE_FEEDBACK_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
