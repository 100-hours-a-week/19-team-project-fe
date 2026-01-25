import { NextResponse } from 'next/server';
import { kakaoLogin } from '@/features/auth.server';

export async function POST(req: Request) {
  const { code } = await req.json();

  const result = await kakaoLogin(code);

  if (result.status === 'SIGNUP_REQUIRED') {
    return NextResponse.json({
      status: 'SIGNUP_REQUIRED',
      signup_required: result.signupRequired,
    });
  }

  const response = NextResponse.json({
    status: 'LOGIN_SUCCESS',
    userId: result.userId,
    userType: result.userType,
    accessToken: result.accessToken,
  });

  // 쿠키는 반드시 여기서 설정
  response.cookies.set('access_token', result.accessToken, {
    httpOnly: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 15,
  });

  response.cookies.set('refresh_token', result.refreshToken, {
    httpOnly: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });

  response.cookies.set('user_id', String(result.userId), {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });

  return response;
}
