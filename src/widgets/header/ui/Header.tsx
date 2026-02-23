'use client';

import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const showNotificationBell = pathname === '/';

  return (
    <header
      className={
        isHome
          ? 'fixed top-0 left-1/2 z-30 flex h-12 w-full max-w-[600px] -translate-x-1/2 items-center justify-end rounded-b-2xl bg-white/65 px-2.5 backdrop-blur-sm'
          : 'sticky top-0 z-30 flex h-app-header w-full items-center justify-end bg-white px-2.5'
      }
    >
      {showNotificationBell ? (
        <button
          type="button"
          aria-label="알림"
          className="text-primary-main flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5"
        >
          <svg
            data-slot="icon"
            fill="none"
            strokeWidth="1.5"
            stroke="var(--color-primary-main)"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="var(--color-primary-active)"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
        </button>
      ) : null}
    </header>
  );
}
