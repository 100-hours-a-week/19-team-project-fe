'use client';

import GuideButtons from './GuideButtons';
import RecruitmentLinksTicker from './RecruitmentLinksTicker';
import TechBlogTicker from './TechBlogTicker';
import WhyRefitSection from './WhyRefitSection';

export default function HomeDeferredSections() {
  return (
    <>
      <section aria-labelledby="home-guide-heading">
        <h3 id="home-guide-heading" className="sr-only">
          이용 가이드
        </h3>
        <GuideButtons />
      </section>

      <section aria-labelledby="home-recruitment-links-heading">
        <h3 id="home-recruitment-links-heading" className="sr-only">
          채용 공고 링크
        </h3>
        <RecruitmentLinksTicker />
      </section>

      <section aria-labelledby="home-tech-blogs-heading">
        <h3 id="home-tech-blogs-heading" className="sr-only">
          기술 블로그
        </h3>
        <TechBlogTicker />
      </section>

      <section aria-labelledby="home-why-refit-heading">
        <h3 id="home-why-refit-heading" className="sr-only">
          왜 RE:FIT인가
        </h3>
        <WhyRefitSection />
      </section>
    </>
  );
}
