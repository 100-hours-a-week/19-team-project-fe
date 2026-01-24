import Link from 'next/link';

export default function SearchBar() {
  return (
    <section className="px-6 pt-4">
      <Link
        href="/experts"
        className="flex w-full items-center justify-between gap-3 rounded-full border border-[#262627] bg-[#f7f7f7] px-4 py-3 text-left text-text-hint-main"
        aria-label="검색"
      >
        <span className="text-sm">커피챗 하고 싶은 현직자 탐색!!</span>
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
      </Link>
    </section>
  );
}
