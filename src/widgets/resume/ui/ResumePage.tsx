'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { KakaoLoginButton, getMe } from '@/features/auth';
import { AuthGateSheet } from '@/shared/ui/auth-gate';
import { useAuthGate } from '@/shared/lib/useAuthGate';
import iconResume from '@/shared/icons/icon_resume.png';
import charResume from '@/shared/icons/char_resume.png';
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

      <section className="flex flex-1 flex-col px-6 pt-6 pb-[calc(var(--app-footer-height)+16px)]">
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
          <>
            <button
              type="button"
              onClick={() => router.push('/resume/edit')}
              className="mt-4 flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-3">
                <Image src={iconResume} alt="이력서 추가하기" width={40} height={40} />
                <div className="text-left">
                  <span className="text-base font-semibold text-text-body">이력서 추가하기</span>
                  <p className="mt-1 text-xs text-text-caption">이력서를 업데이트해 보세요</p>
                </div>
              </div>
              <span className="text-xl text-gray-300">›</span>
            </button>

            <div className="mt-6 flex flex-1 items-center justify-center">
              <Image src={charResume} alt="이력서" className="h-72 w-auto animate-float" priority />
            </div>
          </>
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
