import Image from 'next/image';

import charReady from '@/shared/icons/char_ready.png';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

export default function ReportPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-black">
      <Header />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden pb-[calc(var(--app-footer-height)+16px)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#eef2ff,transparent_65%),radial-gradient(circle_at_bottom,#fff7ed,transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-[480px] w-[320px] rounded-3xl border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
            <div className="h-16 rounded-t-3xl border-b border-neutral-200 bg-white px-4 py-3">
              <div className="h-3 w-28 rounded-full bg-neutral-300" />
              <div className="mt-2 h-2 w-20 rounded-full bg-neutral-200" />
            </div>
            <div className="space-y-4 px-5 py-6">
              <div className="h-20 rounded-2xl bg-neutral-100 shadow-[0_8px_22px_rgba(15,23,42,0.12)]" />
              <div className="h-24 rounded-2xl bg-neutral-100 shadow-[0_8px_22px_rgba(15,23,42,0.12)]" />
              <div className="h-16 rounded-2xl bg-neutral-100 shadow-[0_8px_22px_rgba(15,23,42,0.12)]" />
              <div className="flex gap-3">
                <div className="h-10 flex-1 rounded-full bg-neutral-100 shadow-[0_8px_22px_rgba(15,23,42,0.12)]" />
                <div className="h-10 w-20 rounded-full bg-neutral-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 backdrop-blur-[4px] bg-white/10" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <Image
            src={charReady}
            alt="레포트 준비 캐릭터"
            className="h-72 w-auto animate-float"
            priority
          />
          <p className="text-center text-sm font-semibold text-black">
            서비스 준비중입니다. 조금만 기다려주세요.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
