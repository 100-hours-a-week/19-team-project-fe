import { buildApiUrl } from '@/shared/api';

const KAKAO_AUTHORIZE_PATH = '/api/v1/auth/oauth/kakao/authorize';

export function getKakaoAuthorizeUrl(): string {
  const baseUrl = buildApiUrl(KAKAO_AUTHORIZE_PATH);

  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URL?.trim();
  if (!redirectUri) return baseUrl;

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}redirect_uri=${encodeURIComponent(redirectUri)}`;
}
