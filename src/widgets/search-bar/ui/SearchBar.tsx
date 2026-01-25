'use client';

import Link from 'next/link';

import { StarBorder } from '@/shared/ui/star-border';

export default function SearchBar() {
  return (
    <section className="px-6 pt-4">
      <Link
        href="/experts"
        className="block"
        aria-label="검색"
        onClick={() => {
          sessionStorage.setItem('nav-direction', 'forward');
        }}
      >
        <StarBorder
          className="w-full"
          color="#22d3ee"
          speed="3s"
          thickness={4}
          starOpacity={0.95}
          starSize={18}
          innerClassName="bg-white bg-none text-black"
          innerStyle={{ borderColor: '#111827' }}
        >
          <div className="flex items-center justify-between gap-3 text-left text-black">
            <span className="text-sm">멘트 쌈뽕한걸로 수정!</span>
            <svg
              data-slot="icon"
              fill="none"
              strokeWidth={1.5}
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </div>
        </StarBorder>
      </Link>
    </section>
  );
}
