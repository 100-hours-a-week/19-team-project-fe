import Image from 'next/image';

import { cookies, headers } from 'next/headers';

import type { ExpertRecommendationsResponse } from '@/entities/experts';
import { Footer } from '@/widgets/footer';
import { SearchBar } from '@/widgets/home';
import { SplashGate } from '@/widgets/splash-screen';
import { PageTransition } from '@/shared/ui/page-transition';
import { apiFetch } from '@/shared/api';
import {
  ExpertRecommendations,
  HomeGuardToast,
  GuideButtons,
  RecruitmentLinksTicker,
  SignupConfetti,
  TechBlogBanner,
  TechBlogTicker,
} from '@/widgets/home';
import iconMarkB from '@/shared/icons/icon-mark_B.png';

async function buildBffUrl(path: string): Promise<string> {
  const explicitBase = process.env.NEXT_PUBLIC_APP_URL;
  if (explicitBase) return `${explicitBase}${path}`;

  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');
  if (!host) return `http://localhost:3000${path}`;

  const proto = headerStore.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}${path}`;
}

export default async function Home() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const query = new URLSearchParams({ top_k: '12' });
  const url = await buildBffUrl(`/bff/experts/recommendations?${query.toString()}`);
  const recommendations = await apiFetch<ExpertRecommendationsResponse>(url, {
    method: 'GET',
    cache: 'no-store',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  })
    .then((data) => data.recommendations)
    .catch(() => []);

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
                <ExpertRecommendations recommendations={recommendations} />
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
