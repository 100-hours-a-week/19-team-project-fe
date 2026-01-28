import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BusinessError, type ApiResponse, buildApiUrl } from '@/shared/api';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ resumeId: string }> },
) {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;

    const authHeader = req.headers.get('authorization');
    const rawToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (authHeader ?? undefined);

    const accessToken = rawToken?.trim() || cookieToken?.trim() || undefined;
    if (!accessToken) {
      const response: ApiResponse<null> = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'unauthorized',
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    const { resumeId } = await params;
    const normalizedId = resumeId?.trim();
    if (!normalizedId) {
      const response: ApiResponse<null> = {
        code: 'RESUME_ID_INVALID',
        message: 'invalid_resume_id',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const res = await fetch(buildApiUrl(`/api/v1/resumes/${normalizedId}`), {
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
        code: 'RESUME_DETAIL_FAILED',
        message: 'RESUME_DETAIL_FAILED',
        data: null,
      };
      return NextResponse.json(response, { status: res.status });
    }

    const body = await res.json();
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof BusinessError) {
      const response: ApiResponse<unknown> = {
        code: error.code,
        message: error.message,
        data: error.data ?? null,
      };
      return NextResponse.json(response);
    }

    console.error('[Resume Detail Error]', error);
    const response: ApiResponse<null> = {
      code: 'RESUME_DETAIL_FAILED',
      message: 'RESUME_DETAIL_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
