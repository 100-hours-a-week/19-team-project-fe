'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import iconIncruit from '@/shared/icons/main_in.png';
import iconSaramin from '@/shared/icons/main_saram.png';
import iconJobkorea from '@/shared/icons/main_jobko.png';
import iconJasoseol from '@/shared/icons/main_jasosal.png';
import iconWanted from '@/shared/icons/main_wanted.png';

const LINKS = [
  { label: '인크루트', url: 'https://www.incruit.com/', icon: iconIncruit },
  { label: '사람인', url: 'https://www.saramin.co.kr/zf_user/', icon: iconSaramin },
  { label: '잡코리아', url: 'https://www.jobkorea.co.kr/', icon: iconJobkorea },
  { label: '자소설닷컴', url: 'https://jasoseol.com/', icon: iconJasoseol },
  { label: '원티드', url: 'https://www.wanted.co.kr/', icon: iconWanted },
];

export default function RecruitmentLinksTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % LINKS.length);
        setVisible(true);
      }, 350);
    }, 4500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const current = LINKS[index];

  return (
    <div className="rounded-2xl bg-white px-4 pt-2 pb-4">
      <p className="text-sm font-semibold text-neutral-900">채용공고 사이트</p>
      <div
        className={`mt-2 flex flex-col gap-2 transition duration-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
        }`}
      >
        <a
          href={current.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-900"
        >
          <span className="flex items-center gap-2">
            <Image src={current.icon} alt="" width={20} height={20} />
            {current.label}
          </span>
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
      </div>
    </div>
  );
}
