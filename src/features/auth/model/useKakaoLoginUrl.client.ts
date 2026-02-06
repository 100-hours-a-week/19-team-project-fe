'use client';

import { getKakaoAuthorizeUrl } from '@/features/auth';

export function useKakaoLoginUrl() {
  return getKakaoAuthorizeUrl();
}
