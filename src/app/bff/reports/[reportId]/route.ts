import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { type ApiResponse, buildApiUrl } from '@/shared/api';
import { invalidateReportCache } from '@/shared/lib/cache';
import { fetchBffUpstream } from '@/app/bff/_lib/fetchUpstream';

function getAccessToken(req: Request, cookieToken?: string) {
  const authHeader = req.headers.get('authorization');
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader ?? undefined);
  return rawToken?.trim() || cookieToken?.trim() || undefined;
}

function parseReportId(rawReportId: string): number | null {
  const parsed = Number(rawReportId);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export async function GET(req: Request, context: { params: Promise<{ reportId: string }> }) {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);

    if (!accessToken) {
      const response: ApiResponse<null> = {
        code: 'AUTH_UNAUTHORIZED',
        message: '인증이 필요합니다.',
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    const { reportId: rawReportId } = await context.params;
    const reportId = parseReportId(rawReportId);

    if (reportId === null) {
      const response: ApiResponse<null> = {
        code: 'INVALID_REQUEST',
        message: '요청이 올바르지 않습니다.',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const upstreamRes = await fetchBffUpstream(buildApiUrl(`/api/v2/reports/${reportId}`), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const body = await upstreamRes.json().catch(() => null);
    if (!body) {
      const response: ApiResponse<null> = {
        code: 'REPORT_DETAIL_FAILED',
        message: 'REPORT_DETAIL_FAILED',
        data: null,
      };
      return NextResponse.json(response, { status: upstreamRes.status || 500 });
    }

    return NextResponse.json(body, { status: upstreamRes.status });
  } catch (error) {
    console.error('[Report Detail Error]', error);
    const response: ApiResponse<null> = {
      code: 'REPORT_DETAIL_FAILED',
      message: 'REPORT_DETAIL_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ reportId: string }> }) {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;
    const accessToken = getAccessToken(req, cookieToken);

    if (!accessToken) {
      const response: ApiResponse<null> = {
        code: 'AUTH_UNAUTHORIZED',
        message: '인증이 필요합니다.',
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    const { reportId: rawReportId } = await context.params;
    const reportId = parseReportId(rawReportId);

    if (reportId === null) {
      const response: ApiResponse<null> = {
        code: 'INVALID_REQUEST',
        message: '요청이 올바르지 않습니다.',
        data: null,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const upstreamRes = await fetchBffUpstream(buildApiUrl(`/api/v2/reports/${reportId}`), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const body = await upstreamRes.json().catch(() => null);
    if (!body) {
      const response: ApiResponse<null> = {
        code: 'REPORT_DELETE_FAILED',
        message: 'REPORT_DELETE_FAILED',
        data: null,
      };
      return NextResponse.json(response, { status: upstreamRes.status || 500 });
    }

    invalidateReportCache(reportId);
    return NextResponse.json(body, { status: upstreamRes.status });
  } catch (error) {
    console.error('[Report Delete Error]', error);
    const response: ApiResponse<null> = {
      code: 'REPORT_DELETE_FAILED',
      message: 'REPORT_DELETE_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
