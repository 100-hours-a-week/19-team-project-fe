import Image from 'next/image';

import charReady from '@/shared/icons/char_ready.png';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

export default function ReportPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-black">
      <Header />
      <main className="flex flex-1 items-center justify-center pb-[calc(var(--app-footer-height)+16px)]">
        <Image
          src={charReady}
          alt="레포트 준비 캐릭터"
          className="h-72 w-auto animate-float"
          priority
        />
      </main>
      <Footer />
    </div>
  );
}
