import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BusinessError, type ApiResponse, buildApiUrl } from '@/shared/api';
import { fetchBffUpstream } from '@/app/bff/_lib/fetchUpstream';

export async function POST(req: Request) {
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

    const payload = (await req.json()) as { file_url?: unknown; fileUrl?: unknown };
    const rawFileUrl = payload.file_url ?? payload.fileUrl;
    const fileUrl = typeof rawFileUrl === 'string' ? rawFileUrl.trim() : '';
    if (!fileUrl) {
      const response: ApiResponse<null> = {
        code: 'INVALID_PAYLOAD',
        message: 'file_url is required',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const requestHeaders = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const candidates: Array<{ body: Record<string, string> }> = [
      { body: { file_url: fileUrl, mode: 'async' } },
      { body: { file_url: fileUrl } },
      { body: { fileUrl, mode: 'async' } },
      { body: { fileUrl } },
    ];

    let res: Response | null = null;
    for (const candidate of candidates) {
      res = await fetchBffUpstream(buildApiUrl('/api/v2/resumes/tasks'), {
        timeoutMs: 30000,
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(candidate.body),
      });

      if (res.ok) break;
      if (res.status !== 400 && res.status !== 404) break;
    }

    if (!res) {
      const response: ApiResponse<null> = {
        code: 'RESUME_PARSE_FAILED',
        message: 'RESUME_PARSE_FAILED',
        data: null,
      };
      return NextResponse.json(response, { status: 500 });
    }

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
        code: 'RESUME_PARSE_FAILED',
        message: 'RESUME_PARSE_FAILED',
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

    console.error('[Resume Parse Error]', error);
    const response: ApiResponse<null> = {
      code: 'RESUME_PARSE_FAILED',
      message: 'RESUME_PARSE_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
