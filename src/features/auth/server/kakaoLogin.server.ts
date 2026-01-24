/**
 * Kakao Login Use Case (Server)
 *
 * 흐름:
 * 1. 카카오 로그인 API 호출 (shared)
 * 2. access / refresh token 쿠키 저장
 * 3. 클라이언트에 필요한 최소 정보만 반환
 */

import { loginWithKakao } from '@/shared/api/server';
import { setAuthCookies } from './setAuthCookies.server';

type KakaoLoginResult = {
  userId: number;
  userType: string;
};

export async function kakaoLogin(code: string) {
  // 1. Backend 호출
  const data = await loginWithKakao(code);

  // 2. 토큰은 서버에만 저장
  await setAuthCookies({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });

  // 3️. 클라이언트에는 토큰 전달하지 않음.
  return {
    userId: data.user_id,
    userType: data.user_type,
  };
}
