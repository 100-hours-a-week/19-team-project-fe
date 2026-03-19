import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { type ApiResponse, BusinessError } from '@/shared/api';
import { getAgentSessions, createAgentSession } from '@/features/agent.server';

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
  if (code === 'AUTH_UNAUTHORIZED' || code === 'AUTH_INVALID_TOKEN' || code === 'UNAUTHORIZED') {
    return 401;
  }
  return 400;
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = getAccessToken(req, cookieStore.get('access_token')?.value);
    if (!accessToken) return unauthorizedResponse();

    const data = await getAgentSessions(accessToken);
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

    console.error('[Agent Sessions Error]', error);
    const response: ApiResponse<null> = {
      code: 'AGENT_SESSIONS_FAILED',
      message: 'AGENT_SESSIONS_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = getAccessToken(req, cookieStore.get('access_token')?.value);
    if (!accessToken) return unauthorizedResponse();

    const data = await createAgentSession(accessToken);
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

    console.error('[Agent Session Create Error]', error);
    const response: ApiResponse<null> = {
      code: 'AGENT_SESSION_CREATE_FAILED',
      message: 'AGENT_SESSION_CREATE_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
