import { NextResponse } from 'next/server';
import { refreshAuthTokens } from '@/shared/api/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const tokens = await refreshAuthTokens();
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    response.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return response;
  } catch {
    const response = NextResponse.json(
      { code: 'AUTH_UNAUTHORIZED', message: 'token_refresh_failed', data: null },
      { status: 401 },
    );
    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    });
    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    });
    return response;
  }
}
