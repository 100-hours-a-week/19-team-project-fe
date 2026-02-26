'use client';

import dynamic from 'next/dynamic';

const GuideButtons = dynamic(() => import('./GuideButtons'), { ssr: false });
const RecruitmentLinksTicker = dynamic(() => import('./RecruitmentLinksTicker'), { ssr: false });
const TechBlogTicker = dynamic(() => import('./TechBlogTicker'), { ssr: false });
const WhyRefitSection = dynamic(() => import('./WhyRefitSection'), { ssr: false });

export default function HomeDeferredSections() {
  return (
    <>
      <GuideButtons />
      <RecruitmentLinksTicker />
      <TechBlogTicker />
      <WhyRefitSection />
    </>
  );
}
