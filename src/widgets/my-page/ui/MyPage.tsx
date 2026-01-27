'use client';

import { useRouter } from 'next/navigation';

import { KakaoLoginButton, getMe } from '@/features/auth';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import { useAuthGate } from '@/shared/lib/useAuthGate';

export default function MyPage() {
  const router = useRouter();
  const { status: authStatus } = useAuthGate(getMe);

  const handleAuthSheetClose = () => {
    router.replace('/');
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <div className="fixed top-0 left-1/2 z-10 flex h-app-header w-full max-w-[600px] -translate-x-1/2 items-center bg-[#f7f7f7] px-6">
        <h1 className="text-2xl font-semibold">마이 페이지</h1>
      </div>

      <section className="px-6 pt-[calc(var(--app-header-height)+24px)]">
        {authStatus === 'authed' ? (
          <div className="rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">마이 페이지는 준비 중입니다.</p>
          </div>
        ) : authStatus === 'checking' ? (
          <div className="rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">불러오는 중...</p>
          </div>
        ) : (
          <div className="rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">로그인이 필요합니다.</p>
          </div>
        )}
      </section>

      <AuthGateSheet
        open={authStatus === 'guest'}
        title="로그인이 필요합니다"
        description="마이 페이지를 보려면 로그인해 주세요."
        onClose={handleAuthSheetClose}
      >
        <KakaoLoginButton />
      </AuthGateSheet>
    </div>
  );
}
