import Image from 'next/image';

import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';
import { SearchBar } from '@/widgets/search-bar';
import { SplashGate } from '@/widgets/splash-screen';
import { PageTransition } from '@/shared/ui/page-transition';
import { SignupConfetti } from '@/widgets/home';
import RecruitmentLinksTicker from '@/widgets/home/ui/RecruitmentLinksTicker';
import TechBlogTicker from '@/widgets/home/ui/TechBlogTicker';
import iconMarkB from '@/shared/icons/icon-mark_B.png';
import charBtn from '@/shared/icons/char_btn.png';

export default function Home() {
  return (
    <>
      <PageTransition>
        <SplashGate>
          <SignupConfetti />
          <div className="min-h-screen bg-[#D2DEEA]">
            <Header />
            <div className="flex min-h-[calc(100vh-var(--app-header-height))] flex-col">
              <div className="px-6 pt-6 text-text-body">
                <div className="flex items-center">
                  <Image src={iconMarkB} alt="" width={22} height={22} />
                  <p className="text-2xl font-bold">re:fit에 오신 걸 환영합니다.</p>
                </div>
              </div>

              <div className="relative z-20">
                <SearchBar />
              </div>

              <div className="flex flex-1 flex-col pb-0">
                <div className="relative mt-30 flex-1 w-full rounded-t-3xl bg-white px-6 py-8 shadow-[0_-16px_36px_rgba(59,91,204,0.25)]">
                  <Image
                    src={charBtn}
                    alt=""
                    width={380}
                    height={380}
                    className="pointer-events-none absolute -top-52 left-1/2 -translate-x-1/2"
                  />
                  <div className="flex flex-col gap-4">
                    <RecruitmentLinksTicker />
                    <div className="-mt-2">
                      <TechBlogTicker />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Footer />
          </div>
        </SplashGate>
      </PageTransition>
    </>
  );
}
