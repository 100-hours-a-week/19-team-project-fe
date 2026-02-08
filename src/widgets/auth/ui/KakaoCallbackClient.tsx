'use client';

import { useKakaoCallback } from '@/features/auth';

export default function KakaoCallbackClient() {
  useKakaoCallback();

  return <p className="p-6 text-sm text-gray-600">카카오 로그인 처리 중입니다…</p>;
}
