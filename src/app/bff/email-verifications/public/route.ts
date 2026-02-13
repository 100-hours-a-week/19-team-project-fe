import { NextResponse } from 'next/server';

import { BusinessError, type ApiResponse, buildApiUrl } from '@/shared/api';

const EMAIL_VERIFICATION_PUBLIC_PATH = '/api/v1/email-verifications/public';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const res = await fetch(buildApiUrl(EMAIL_VERIFICATION_PUBLIC_PATH), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      if (body && typeof body.code === 'string') {
        const response: ApiResponse<unknown> = {
          code: body.code,
          message: body.message ?? 'error',
          data: body.data ?? null,
        };
        return NextResponse.json(response, { status: res.status });
      }
      const response: ApiResponse<null> = {
        code: 'EMAIL_VERIFICATION_SEND_FAILED',
        message: 'EMAIL_VERIFICATION_SEND_FAILED',
        data: null,
      };
      return NextResponse.json(response, { status: res.status });
    }

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

    console.error('[Email Verification Public Send Error]', error);
    const response: ApiResponse<null> = {
      code: 'EMAIL_VERIFICATION_SEND_FAILED',
      message: 'EMAIL_VERIFICATION_SEND_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const payload = await req.json();
    const res = await fetch(buildApiUrl(EMAIL_VERIFICATION_PUBLIC_PATH), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      if (body && typeof body.code === 'string') {
        const response: ApiResponse<unknown> = {
          code: body.code,
          message: body.message ?? 'error',
          data: body.data ?? null,
        };
        return NextResponse.json(response, { status: res.status });
      }
      const response: ApiResponse<null> = {
        code: 'EMAIL_VERIFICATION_VERIFY_FAILED',
        message: 'EMAIL_VERIFICATION_VERIFY_FAILED',
        data: null,
      };
      return NextResponse.json(response, { status: res.status });
    }

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

    console.error('[Email Verification Public Verify Error]', error);
    const response: ApiResponse<null> = {
      code: 'EMAIL_VERIFICATION_VERIFY_FAILED',
      message: 'EMAIL_VERIFICATION_VERIFY_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
