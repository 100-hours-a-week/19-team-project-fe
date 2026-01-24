/**
 * Kakao Login Route Entry
 *
 * - app/api는 Entry Layer
 * - 비즈니스 로직 담당하지 않음..
 * - 쿠키 직접 제어 하지 않게 하기
 */

import { NextResponse } from 'next/server';
import { kakaoLogin } from '@/features/auth.server';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ message: 'INVALID_REQUEST' }, { status: 400 });
    }

    const result = await kakaoLogin(code);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Kakao Login Error]', error);

    return NextResponse.json({ message: 'LOGIN_FAILED' }, { status: 401 });
  }
}
