// app/api/auth/kakao/login/route.ts
import { NextResponse } from 'next/server';
import { kakaoLogin } from '@/features/auth.server';

export async function POST(req: Request) {
  const { code } = await req.json();

  const result = await kakaoLogin(code);

  const response = NextResponse.json({
    userId: result.userId,
    userType: result.userType,
  });

  // 쿠키는 반드시 여기서 설정
  response.cookies.set('access_token', result.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 15,
  });

  response.cookies.set('refresh_token', result.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });

  return response;
}
