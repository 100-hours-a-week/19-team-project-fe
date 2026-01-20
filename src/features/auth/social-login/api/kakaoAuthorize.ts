import { buildApiUrl } from '@/shared/api';

export const KAKAO_AUTHORIZE_PATH = '/api/v1/auth/oauth/kakao/authorize';

export function getKakaoAuthorizeUrl(): string {
  return buildApiUrl(KAKAO_AUTHORIZE_PATH);
}
