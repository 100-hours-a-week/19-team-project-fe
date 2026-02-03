import { NextResponse } from 'next/server';

import type { ApiResponse } from '@/shared/api';
import { BusinessError } from '@/shared/api';
import { restoreAccount } from '@/features/auth.server';

type RestoreResult = {
  user_id: number;
  user_type: string;
  access_token: string;
  refresh_token: string;
};

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const result = await restoreAccount(payload);

    const response: ApiResponse<RestoreResult> = {
      code: 'OK',
      message: '',
      data: {
        user_id: result.userId,
        user_type: result.userType,
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      },
    };

    const responseWithCookies = NextResponse.json(response);
    responseWithCookies.cookies.set('access_token', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    responseWithCookies.cookies.set('refresh_token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return responseWithCookies;
  } catch (error) {
    if (error instanceof BusinessError) {
      const response: ApiResponse<unknown> = {
        code: error.code,
        message: error.message,
        data: error.data ?? null,
      };
      return NextResponse.json(response);
    }

    console.error('[Restore Account Error]', error);
    const response: ApiResponse<null> = {
      code: 'ACCOUNT_RESTORE_FAILED',
      message: 'ACCOUNT_RESTORE_FAILED',
      data: null,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
