'use client';

import { useRouter } from 'next/navigation';

import { KakaoLoginButton, getMe } from '@/features/auth';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import { useAuthGate } from '@/shared/lib/useAuthGate';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

export default function ResumePage() {
  const router = useRouter();
  const { status: authStatus } = useAuthGate(getMe);

  const handleAuthSheetClose = () => {
    router.replace('/');
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] text-black">
      <Header />

      <section className="px-6 pt-6 pb-[calc(var(--app-footer-height)+16px)]">
        <h1 className="text-2xl font-semibold text-black">이력서</h1>

        {authStatus === 'checking' ? (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">불러오는 중...</p>
          </div>
        ) : authStatus !== 'authed' ? (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">로그인이 필요합니다.</p>
          </div>
        ) : (
          <div className="mt-4 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <p className="text-base text-neutral-700">이력서 페이지 준비 중입니다.</p>
          </div>
        )}
      </section>

      <Footer />

      <AuthGateSheet
        open={authStatus === 'guest'}
        title="로그인이 필요합니다"
        description="이력서를 보려면 로그인해 주세요."
        onClose={handleAuthSheetClose}
      >
        <KakaoLoginButton />
      </AuthGateSheet>
    </div>
  );
}
