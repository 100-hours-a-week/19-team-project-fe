'use client';

import { useEffect, useMemo, useState } from 'react';

const BLOGS = [
  { label: '카카오 테크 블로그', url: 'https://tech.kakao.com/blog/' },
  { label: '쿠팡 기술 블로그', url: 'https://medium.com/coupang-tech/technote/home' },
  { label: '왓챠 팀 블로그', url: 'https://medium.com/watcha' },
  { label: '마켓컬리 Tech Blog', url: 'http://thefarmersfront.github.io/' },
  { label: '우아한형제들 기술 블로그', url: 'https://woowabros.github.io/' },
  { label: '뱅크샐러드 공식 블로그', url: 'https://blog.banksalad.com/' },
  { label: 'NHN 기술 블로그 (TOAST Meetup)', url: 'http://meetup.toast.com' },
  { label: '하이퍼커넥트 기술 블로그', url: 'https://hyperconnect.github.io/' },
  { label: '당근마켓 팀 블로그', url: 'https://medium.com/daangn' },
  { label: '강남언니 기업 블로그', url: 'https://blog.gangnamunni.com/blog/tech/' },
  { label: 'Delivery Tech Korea', url: 'https://medium.com/deliverytechkorea' },
  { label: '이스트소프트 AI PLUS TECH', url: 'https://blog.est.ai/' },
  { label: '플랫팜 팀 블로그', url: 'https://medium.com/platfarm' },
  { label: '레진 기술 블로그', url: 'https://tech.lezhin.com/' },
  { label: 'Spoqa 기술 블로그', url: 'https://spoqa.github.io/' },
  { label: '플라네타리움 엔지니어링 스낵', url: 'https://snack.planetarium.dev/kor/' },
  { label: 'LINE Engineering 블로그', url: 'https://engineering.linecorp.com/ko/blog/' },
  { label: '쏘카 Tech Blog', url: 'https://tech.socarcorp.kr/' },
  { label: '리디 Tech Blog', url: 'https://www.ridicorp.com/blog/' },
  { label: 'Naver D2 개발자 블로그', url: 'https://d2.naver.com/' },
];

export default function TechBlogTicker() {
  const [index, setIndex] = useState(0);
  const [enableTransition, setEnableTransition] = useState(true);
  const [sliceIndex, setSliceIndex] = useState(0);
  const [sliceTransition, setSliceTransition] = useState(true);
  const rowHeight = 44;
  const rowGap = 8;

  const items = useMemo(() => [...BLOGS, ...BLOGS.slice(0, 3)], []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setEnableTransition(true);
      setIndex((prev) => prev + 1);
    }, 3500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (index !== BLOGS.length) return;
    const resetId = window.setTimeout(() => {
      setEnableTransition(false);
      setIndex(0);
    }, 300);
    return () => window.clearTimeout(resetId);
  }, [index]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSliceTransition(true);
      setSliceIndex((prev) => prev + 1);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (sliceIndex !== 3) return;
    const resetId = window.setTimeout(() => {
      setSliceTransition(false);
      setSliceIndex(0);
    }, 300);
    return () => window.clearTimeout(resetId);
  }, [sliceIndex]);

  return (
    <div className="rounded-2xl bg-white px-4 py-4">
      <p className="text-sm font-semibold text-neutral-900">기업 기술 블로그</p>
      <div className="mt-3 overflow-hidden" style={{ height: rowHeight * 3 + rowGap * 2 }}>
        <div
          className={`flex flex-col gap-2 ${
            enableTransition ? 'transition-transform duration-300 ease-out' : ''
          }`}
          style={{ transform: `translateY(-${index * (rowHeight + rowGap)}px)` }}
        >
          {items.map((item, idx) => (
            <a
              key={`${item.url}-${idx}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center justify-between rounded-xl bg-neutral-50 px-3 text-sm font-semibold text-neutral-900"
            >
              <span>{item.label}</span>
              <svg
                data-slot="icon"
                fill="none"
                strokeWidth={1.5}
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="h-4 w-4 text-neutral-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </a>
          ))}
        </div>
      </div>
      <div className="mt-4 overflow-hidden">
        <div
          className={`flex ${sliceTransition ? 'transition-transform duration-500 ease-out' : ''}`}
          style={{ transform: `translateX(-${sliceIndex * 100}%)` }}
        >
          {[
            { key: 0, bg: 'bg-[#F7C7D3]', shadow: 'shadow-[0_10px_24px_rgba(247,199,211,0.5)]' },
            { key: 1, bg: 'bg-[#CFEAD6]', shadow: 'shadow-[0_10px_24px_rgba(207,234,214,0.5)]' },
            { key: 2, bg: 'bg-[#C8D7F3]', shadow: 'shadow-[0_10px_24px_rgba(200,215,243,0.55)]' },
            { key: 0, bg: 'bg-[#F7C7D3]', shadow: 'shadow-[0_10px_24px_rgba(247,199,211,0.5)]' },
          ].map((item, idx) => (
            <div key={`tech-blog-slice-${item.key}-${idx}`} className="w-full shrink-0 pr-2">
              <div className={`h-24 rounded-2xl ${item.bg} ${item.shadow}`} aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
