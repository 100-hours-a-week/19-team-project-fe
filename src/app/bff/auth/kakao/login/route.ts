import { NextResponse } from 'next/server';

import type { ApiResponse } from '@/shared/api';
import { kakaoLogin } from '@/features/auth.server';

export async function POST(req: Request) {
  const { code } = await req.json();

  const result = await kakaoLogin(code);

  if (result.status === 'SIGNUP_REQUIRED') {
    const response: ApiResponse<{
      status: 'SIGNUP_REQUIRED';
      login_success: null;
      signup_required: {
        oauth_provider: 'KAKAO';
        oauth_id: string;
        email: string | null;
        nickname: string | null;
      };
    }> = {
      code: 'OK',
      message: '',
      data: {
        status: 'SIGNUP_REQUIRED',
        login_success: null,
        signup_required: result.signupRequired,
      },
    };

    return NextResponse.json(response);
  }

  const response: ApiResponse<{
    status: 'LOGIN_SUCCESS';
    login_success: {
      user_id: number;
      user_type: string;
      access_token: string;
      refresh_token: string;
    };
    signup_required: null;
  }> = {
    code: 'OK',
    message: '',
    data: {
      status: 'LOGIN_SUCCESS',
      login_success: {
        user_id: result.userId,
        user_type: result.userType,
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      },
      signup_required: null,
    },
  };

  // 쿠키는 반드시 여기서 설정
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

  responseWithCookies.cookies.set('user_id', String(result.userId), {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return responseWithCookies;
}
