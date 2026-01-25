'use client';

import { useRouter } from 'next/navigation';

export default function ExpertDetailHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 flex h-app-header w-full items-center bg-white/90 px-6">
      <button
        type="button"
        className="flex items-center gap-2 text-sm font-semibold text-text-body"
        onClick={() => {
          sessionStorage.setItem('nav-direction', 'back');
          router.push('/experts');
        }}
        aria-label="뒤로 가기"
      >
        <svg
          data-slot="icon"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="h-5 w-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
        </svg>
        뒤로 가기
      </button>
    </header>
  );
}
