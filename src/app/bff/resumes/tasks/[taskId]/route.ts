import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BusinessError, type ApiResponse, buildApiUrl } from '@/shared/api';
import { fetchBffUpstream } from '@/app/bff/_lib/fetchUpstream';

type Params = {
  params: Promise<{
    taskId: string;
  }>;
};

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    if (!taskId) {
      const response: ApiResponse<null> = {
        code: 'INVALID_TASK_ID',
        message: 'INVALID_TASK_ID',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);
    if (!accessToken) {
      const response: ApiResponse<null> = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'unauthorized',
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    const encodedTaskId = encodeURIComponent(taskId);
    const res = await fetchBffUpstream(buildApiUrl(`/api/v2/resumes/tasks/${encodedTaskId}`), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      if (body && typeof body.code === 'string') {
        const response: ApiResponse<unknown> = {
          code: body.code,
          message: body.message ?? 'error',
          data: body.data ?? null,
        };
        return NextResponse.json(response, { status: res.status });
      }
      const response: ApiResponse<null> = {
        code: 'RESUME_PARSE_TASK_FAILED',
        message: 'RESUME_PARSE_TASK_FAILED',
        data: null,
      };
      return NextResponse.json(response, { status: res.status });
    }

    const body = await res.json();
    return NextResponse.json(body, { status: res.status });
  } catch (error) {
    if (error instanceof BusinessError) {
      const response: ApiResponse<unknown> = {
        code: error.code,
        message: error.message,
        data: error.data ?? null,
      };
      return NextResponse.json(response);
    }

    console.error('[Resume Parse Task Error]', error);
    const response: ApiResponse<null> = {
      code: 'RESUME_PARSE_TASK_FAILED',
      message: 'RESUME_PARSE_TASK_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
