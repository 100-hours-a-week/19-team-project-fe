import { NextResponse } from 'next/server';
import { RefreshTokenError, refreshAuthTokens } from '@/shared/api/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const tokens = await refreshAuthTokens();
    const secure = process.env.NODE_ENV === 'production';
    const domain = process.env.NODE_ENV === 'production' ? '.re-fit.kr' : undefined;

    const response = NextResponse.json({
      code: 'CREATED',
      message: 'token_refreshed',
      data: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      },
    });
    response.cookies.set('access_token', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      domain,
    });
    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      domain,
    });
    return response;
  } catch (error) {
    const status = error instanceof RefreshTokenError ? error.status : 500;
    const code = error instanceof RefreshTokenError ? error.code : 'TOKEN_REFRESH_FAILED';
    const message = error instanceof RefreshTokenError ? error.message : 'token_refresh_failed';
    const isUnauthorized = status === 401 || status === 403 || code === 'AUTH_UNAUTHORIZED';

    const response = NextResponse.json(
      { code, message, data: null },
      { status: isUnauthorized ? 401 : status >= 500 ? 502 : status },
    );
    if (isUnauthorized) {
      const secure = process.env.NODE_ENV === 'production';
      const domain = process.env.NODE_ENV === 'production' ? '.re-fit.kr' : undefined;

      response.cookies.set('access_token', '', {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        domain,
        expires: new Date(0),
      });
      response.cookies.set('refresh_token', '', {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        domain,
        expires: new Date(0),
      });
    }
    return response;
  }
}
