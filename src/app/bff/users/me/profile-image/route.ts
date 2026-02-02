import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { BusinessError, type ApiResponse, buildApiUrl } from '@/shared/api';

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('access_token')?.value;

    const accessToken = cookieToken?.trim() || undefined;
    if (!accessToken) {
      const response: ApiResponse<null> = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'unauthorized',
        data: null,
      };
      return NextResponse.json(response, { status: 401 });
    }

    const res = await fetch(buildApiUrl('/api/v1/users/me/profile-image'), {
      method: 'DELETE',
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
        code: 'PROFILE_IMAGE_DELETE_FAILED',
        message: 'PROFILE_IMAGE_DELETE_FAILED',
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

    console.error('[Delete Profile Image Error]', error);
    const response: ApiResponse<null> = {
      code: 'PROFILE_IMAGE_DELETE_FAILED',
      message: 'PROFILE_IMAGE_DELETE_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
