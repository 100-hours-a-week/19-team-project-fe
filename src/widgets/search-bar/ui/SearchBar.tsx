'use client';

import Link from 'next/link';

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
        <div className="w-full rounded-2xl border border-[#111827] bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-left text-black">
            <span className="text-sm text-gray-400">나에게 fit한 현직자를 찾아보세요</span>
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
        </div>
      </Link>
    </section>
  );
}
