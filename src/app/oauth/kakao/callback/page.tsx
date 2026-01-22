import { Suspense } from 'react';

import { KakaoCallbackClient } from '@/widgets/auth';

export default function KakaoOauthCallbackPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-600">카카오 로그인 처리 중...</p>}>
      <KakaoCallbackClient />
    </Suspense>
  );
}
