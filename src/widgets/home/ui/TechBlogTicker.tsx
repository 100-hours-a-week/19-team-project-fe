'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import bannerNum1 from '@/shared/icons/banner_num1.png';
import bannerNum2 from '@/shared/icons/banner_num2.png';
import bannerNum3 from '@/shared/icons/banner_num3.png';

const BLOGS = [
  { label: '카카오 테크 블로그', url: 'https://tech.kakao.com/blog?page=1' },
  { label: '쿠팡 기술 블로그', url: 'https://medium.com/coupang-engineering' },
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

  return (
    <div className="rounded-2xl bg-white px-2.5 pt-0 pb-4">
      <p className="text-sm font-semibold text-neutral-900">기업 기술 블로그</p>
      <div className="mt-2 overflow-hidden" style={{ height: rowHeight * 3 + rowGap * 2 }}>
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
    </div>
  );
}

export function TechBlogBanner() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [enableTransition, setEnableTransition] = useState(true);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setEnableTransition(true);
      setSlideIndex((prev) => prev + 1);
    }, 3500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (slideIndex !== 3) return;
    const resetId = window.setTimeout(() => {
      setEnableTransition(false);
      setSlideIndex(0);
    }, 300);
    return () => window.clearTimeout(resetId);
  }, [slideIndex]);

  const slides = [bannerNum1, bannerNum2, bannerNum3, bannerNum1];

  return (
    <div className="-mt-2 rounded-2xl bg-white px-2.5 py-4">
      <div className="relative w-full overflow-hidden rounded-2xl aspect-[600/174] shadow-[0_14px_32px_rgba(15,23,42,0.2)]">
        <div
          className={`flex h-full ${enableTransition ? 'transition-transform duration-500 ease-out' : ''}`}
          style={{ transform: `translateX(-${slideIndex * 100}%)` }}
        >
          {slides.map((src, idx) => (
            <div key={`tech-blog-banner-${idx}`} className="relative h-full w-full shrink-0">
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 600px) 100vw, 600px"
                className="object-contain object-[center_0px]"
                priority={idx === 0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
