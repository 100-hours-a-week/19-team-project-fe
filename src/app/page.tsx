import Image from 'next/image';

import { Suspense } from 'react';
import { Footer } from '@/widgets/footer';
import { SearchBar } from '@/widgets/home';
import { SplashGate } from '@/widgets/splash-screen';
import { PageTransition } from '@/shared/ui/page-transition';
import {
  ExpertRecommendationsServer,
  ExpertRecommendationsSkeleton,
  HomeGuardToast,
  GuideButtons,
  RecruitmentLinksTicker,
  SignupConfetti,
  TechBlogBanner,
  TechBlogTicker,
} from '@/widgets/home';
import iconMarkB from '@/shared/icons/icon-mark_B.png';

export default async function Home() {
  return (
    <>
      <PageTransition>
        <SplashGate>
          <SignupConfetti />
          <HomeGuardToast />
          <div className="flex min-h-full flex-col bg-[#D2DEEA]">
            <div className="flex flex-col">
              <div className="px-2.5 pt-6 text-text-body">
                <div className="flex items-center">
                  <Image src={iconMarkB} alt="" width={22} height={22} />
                  <p className="text-2xl font-bold">RE:FIT에 오신 걸 환영합니다.</p>
                </div>
              </div>

              <div className="relative z-20">
                <SearchBar />
              </div>

              <div className="mt-2 px-2.5">
                <Suspense fallback={<ExpertRecommendationsSkeleton />}>
                  <ExpertRecommendationsServer />
                </Suspense>
              </div>

              <div className="flex flex-col pb-[calc var(--app-footer-height)]">
                <div className="relative mt-1 w-full rounded-t-3xl bg-white px-2.5 py-8 shadow-[0_-16px_36px_rgba(59,91,204,0.25)]">
                  <div className="flex flex-col gap-0">
                    <div className="-mt-3">
                      <TechBlogBanner />
                    </div>
                    <GuideButtons />
                    <RecruitmentLinksTicker />
                    <TechBlogTicker />
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
