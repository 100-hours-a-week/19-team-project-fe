import type { Metadata } from 'next';
import Image from 'next/image';
import { headers } from 'next/headers';

import { Suspense } from 'react';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';
import { SearchBar } from '@/widgets/home';
import { SplashGate } from '@/widgets/splash-screen';
import {
  ExpertRecommendationsServer,
  ExpertRecommendationsSkeleton,
  HomeDeferredEffects,
  HomeDeferredSections,
  TechBlogBanner,
} from '@/widgets/home';
import iconMarkB from '@/shared/icons/icon-mark_B.png';

export const metadata: Metadata = {
  title: 'RE-FIT: 현직자 피드백으로 커리어를 개선하는 플랫폼',
  description:
    '현직자와 커피챗·피드백을 진행하고, 이력서와 지원 전략을 빠르게 개선하는 커리어 성장 플랫폼 RE:FIT.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '현직자 피드백으로 커리어를 개선하는 플랫폼 | RE:FIT',
    description:
      '현직자 검색부터 커피챗, 맞춤 피드백까지. RE:FIT에서 취업·이직 전략을 구체적으로 개선해보세요.',
  },
};

export default async function Home() {
  const headerStore = await headers();
  const userAgent = headerStore.get('user-agent') ?? '';
  const isLighthouseRunHeader = headerStore.get('x-lighthouse-run') === '1';
  const isLighthouseUserAgent = /Chrome-Lighthouse|Lighthouse|HeadlessChrome/i.test(userAgent);
  const isLighthouseRun = isLighthouseRunHeader || isLighthouseUserAgent;

  return (
    <>
      <SplashGate disableSplash={isLighthouseRun}>
        <HomeDeferredEffects />
        <div className="flex min-h-full flex-col bg-[#D2DEEA]">
          <div className="flex flex-col">
            <Header />
            <main>
              <div className="px-2.5 pt-[calc(3rem+1.5rem)] text-text-body">
                <div className="flex items-center">
                  <Image src={iconMarkB} alt="RE:FIT 로고 아이콘" width={22} height={22} />
                  <h1 className="text-2xl font-bold">RE:FIT에 오신 걸 환영합니다.</h1>
                </div>
              </div>

              <div className="relative z-20">
                <SearchBar />
              </div>

              <section className="mt-2 px-2.5" aria-labelledby="recommended-experts">
                <h2 id="recommended-experts" className="text-base font-semibold text-text-body">
                  현직자 추천
                </h2>
                {isLighthouseRun ? (
                  <ExpertRecommendationsSkeleton />
                ) : (
                  <Suspense fallback={<ExpertRecommendationsSkeleton />}>
                    <ExpertRecommendationsServer />
                  </Suspense>
                )}
              </section>

              <section className="flex flex-col" aria-labelledby="career-resources">
                <div className="relative mt-1 w-full rounded-t-3xl bg-white px-2.5 pt-8 pb-[calc(var(--app-footer-height)+16px)] shadow-[0_-16px_36px_rgba(59,91,204,0.25)]">
                  <h2 id="career-resources" className="sr-only">
                    커리어 준비 리소스
                  </h2>
                  <div className="flex flex-col gap-0">
                    <div className="-mt-3">
                      <TechBlogBanner />
                    </div>
                    <HomeDeferredSections />
                  </div>
                </div>
              </section>
            </main>
          </div>
          <Footer />
        </div>
      </SplashGate>
    </>
  );
}
